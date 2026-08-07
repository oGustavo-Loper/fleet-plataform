import { useEffect, useSyncExternalStore } from "react";

import { fetchWithTimeout, resolveApiUrl } from "./http";
import { getAccessToken } from "./storage";

const apiUrl = resolveApiUrl();

export const apiBaseUrl = apiUrl.replace(/\/graphql\/?$/, "").replace(/\/$/, "");

export type UploadedMedia = {
  url: string;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
};

// 1x1 transparent GIF shown in place of a /media/* image while a scoped
// token is still being fetched, so the <img> never gets an empty src
// (which browsers treat as a request to the current document URL).
const BLANK_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const MEDIA_TOKEN_EXPIRY_SKEW_MS = 10_000;

let mediaTokenState: { token: string; expiresAt: number } | null = null;
let mediaTokenFetch: Promise<void> | null = null;
const mediaTokenListeners = new Set<() => void>();

function notifyMediaTokenListeners() {
  for (const listener of mediaTokenListeners) {
    listener();
  }
}

function subscribeMediaToken(listener: () => void) {
  mediaTokenListeners.add(listener);
  return () => mediaTokenListeners.delete(listener);
}

function getMediaTokenSnapshot() {
  if (mediaTokenState && mediaTokenState.expiresAt > Date.now()) {
    return mediaTokenState.token;
  }
  return null;
}

/** Cleared on logout so a fresh session doesn't reuse a stale token/promise. */
export function clearMediaToken() {
  mediaTokenState = null;
  mediaTokenFetch = null;
  notifyMediaTokenListeners();
}

/**
 * Fetches a short-lived, media-scoped token (GET /media/token) and caches
 * it — /media/* URLs carry this instead of the real access token, since
 * <img> tags and canvas/PDF fetches can't attach an Authorization header.
 * Safe to call repeatedly: concurrent calls share one in-flight request,
 * and a still-valid cached token skips the request entirely.
 */
export function ensureMediaToken(): Promise<void> {
  if (getMediaTokenSnapshot()) {
    return Promise.resolve();
  }

  if (mediaTokenFetch) {
    return mediaTokenFetch;
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    return Promise.resolve();
  }

  mediaTokenFetch = (async () => {
    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/media/token`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { token?: string; expiresInSeconds?: number };
      if (!payload.token) {
        return;
      }

      const ttlMs = (payload.expiresInSeconds ?? 120) * 1000;
      mediaTokenState = {
        token: payload.token,
        expiresAt: Date.now() + Math.max(ttlMs - MEDIA_TOKEN_EXPIRY_SKEW_MS, 0)
      };
      notifyMediaTokenListeners();
    } catch {
      // Best-effort: callers fall back to an unauthenticated (rejected)
      // request and can retry on the next render/token refresh.
    } finally {
      mediaTokenFetch = null;
    }
  })();

  return mediaTokenFetch;
}

function buildMediaUrl(source: string | null | undefined, mediaToken: string | null) {
  if (!source) {
    return "";
  }

  if (
    source.startsWith("data:") ||
    source.startsWith("blob:") ||
    source.startsWith("http://") ||
    source.startsWith("https://")
  ) {
    return source;
  }

  const normalizedSource = source.startsWith("/") ? source : `/${source}`;
  const isMediaRoute = normalizedSource.startsWith("/media/");

  if (isMediaRoute && !mediaToken) {
    return BLANK_IMAGE;
  }

  const withToken = isMediaRoute
    ? `${normalizedSource}${normalizedSource.includes("?") ? "&" : "?"}token=${encodeURIComponent(mediaToken as string)}`
    : normalizedSource;

  // When the API is served from the same origin (the default in production,
  // where VITE_API_URL is a relative "/graphql"), apiBaseUrl is empty and
  // `new URL(path, "/")` throws ("Invalid base URL") — a relative path is
  // already correct in that case, so just return it as-is.
  if (!apiBaseUrl) {
    return withToken;
  }

  return `${apiBaseUrl}${withToken}`;
}

/**
 * React-render-safe resolver for /media/* (and data:/blob:/http(s)) image
 * sources. Renders a blank placeholder until the scoped media token is
 * fetched, then re-renders with the real, tokened URL.
 */
export function useMediaUrl(source?: string | null) {
  const mediaToken = useSyncExternalStore(subscribeMediaToken, getMediaTokenSnapshot, getMediaTokenSnapshot);

  useEffect(() => {
    if (!mediaToken) {
      void ensureMediaToken();
    }
  }, [mediaToken]);

  return buildMediaUrl(source, mediaToken);
}

/** Non-hook variant for one-off async contexts (e.g. PDF export) outside React render. */
export async function resolveMediaUrlAsync(source?: string | null) {
  await ensureMediaToken();
  return buildMediaUrl(source, getMediaTokenSnapshot());
}

const MAX_IMAGE_DIMENSION = 1280;
const RESIZED_IMAGE_QUALITY = 0.85;
const RESIZABLE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

/**
 * Downscales oversized photos (e.g. straight off a phone camera, often
 * 3000px+ and several MB) before upload, since nothing in the UI displays
 * them larger than a couple hundred pixels. Best-effort: any failure (or
 * an already-small/non-raster file) just falls back to the original file
 * rather than blocking the upload.
 */
async function resizeImageIfNeeded(file: File): Promise<File> {
  if (!RESIZABLE_MIME_TYPES.has(file.type) || typeof createImageBitmap !== "function") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const largestSide = Math.max(bitmap.width, bitmap.height);

    if (largestSide <= MAX_IMAGE_DIMENSION) {
      bitmap.close();
      return file;
    }

    const scale = MAX_IMAGE_DIMENSION / largestSide;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", RESIZED_IMAGE_QUALITY)
    );
    if (!blob) {
      return file;
    }

    const resizedName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], resizedName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadMediaFile(file: File, scope: string): Promise<UploadedMedia> {
  const uploadFile = await resizeImageIfNeeded(file);
  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("scope", scope);
  const accessToken = getAccessToken();

  const response = await fetchWithTimeout(`${apiBaseUrl}/media/upload`, {
    method: "POST",
    body: formData,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Falha ao enviar arquivo.");
  }

  const payload = (await response.json()) as Partial<UploadedMedia>;

  if (!payload.url) {
    throw new Error("Resposta de upload inválida.");
  }

  return {
    url: payload.url,
    path: payload.path ?? payload.url,
    originalName: payload.originalName ?? uploadFile.name,
    mimeType: payload.mimeType ?? uploadFile.type,
    size: payload.size ?? uploadFile.size
  };
}

export async function captureCurrentLocation() {
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não suportada neste dispositivo."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });

  const latitude = Number(position.coords.latitude.toFixed(7));
  const longitude = Number(position.coords.longitude.toFixed(7));
  const address = await reverseGeocode(latitude, longitude);

  return {
    latitude,
    longitude,
    address
  };
}

async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      return `${latitude}, ${longitude}`;
    }
    const data = (await response.json()) as { display_name?: string };
    return data.display_name ?? `${latitude}, ${longitude}`;
  } catch {
    return `${latitude}, ${longitude}`;
  }
}
