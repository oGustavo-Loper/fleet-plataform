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

export function resolveMediaUrl(source?: string | null) {
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

  // /media/* requires authentication (tenant-scoped access), but <img> tags
  // and canvas/PDF fetches can't attach an Authorization header — carry the
  // current access token as a query param instead, same short-lived token
  // used everywhere else, just also accepted here for this one route.
  const withToken = normalizedSource.startsWith("/media/")
    ? appendAccessToken(normalizedSource)
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

function appendAccessToken(path: string) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}token=${encodeURIComponent(accessToken)}`;
}

export async function uploadMediaFile(file: File, scope: string): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append("file", file);
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
    originalName: payload.originalName ?? file.name,
    mimeType: payload.mimeType ?? file.type,
    size: payload.size ?? file.size
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
