import { useEffect, useState } from "react";

import { apiBaseUrl } from "../lib/media";

type ApiHeartbeatState = {
  online: boolean;
  responseTimeMs?: number;
  checkedAt?: string;
};

const INITIAL_STATE: ApiHeartbeatState = {
  online: false
};

export function useApiHeartbeat(intervalMs = 15000) {
  const [state, setState] = useState<ApiHeartbeatState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      const startedAt = window.performance.now();

      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(`Health check failed with ${response.status}`);
        }

        const payload = (await response.json()) as {
          checkedAt?: string;
          responseTimeMs?: number;
        };

        if (cancelled) {
          return;
        }

        setState({
          online: true,
          responseTimeMs:
            payload.responseTimeMs ?? Math.round(window.performance.now() - startedAt),
          checkedAt: payload.checkedAt ?? new Date().toISOString()
        });
      } catch {
        if (cancelled) {
          return;
        }

        setState({
          online: false,
          checkedAt: new Date().toISOString()
        });
      }
    }

    void checkHealth();
    const interval = window.setInterval(() => {
      void checkHealth();
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [intervalMs]);

  return state;
}
