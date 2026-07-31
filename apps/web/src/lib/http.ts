const DEFAULT_API_URL = "/graphql";
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export function resolveApiUrl() {
  return import.meta.env.VITE_API_URL || DEFAULT_API_URL;
}

export function resolveRequestTimeoutMs() {
  const raw = Number(
    import.meta.env.VITE_API_TIMEOUT_MS ?? DEFAULT_REQUEST_TIMEOUT_MS
  );

  if (!Number.isFinite(raw) || raw < 1000) {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }

  return Math.floor(raw);
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = resolveRequestTimeoutMs()
) {
  const controller = new AbortController();
  let timedOut = false;
  const externalSignal = init?.signal;

  const handleExternalAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", handleExternalAbort, {
        once: true,
      });
    }
  }

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (
      timedOut ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      throw new Error(
        `Tempo limite da API (${timeoutMs}ms). Verifique se o backend está online e acessível.`
      );
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", handleExternalAbort);
  }
}
