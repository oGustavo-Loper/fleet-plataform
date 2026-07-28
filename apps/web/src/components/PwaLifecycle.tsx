import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { registerSW } from "virtual:pwa-register";
import { getDevelopmentCacheKeysForCleanup } from "./pwa-dev-cache";

type PwaState =
  | { kind: "idle" }
  | { kind: "offline-ready" }
  | { kind: "update-ready"; update: (reloadPage?: boolean) => Promise<void> };

export function PwaLifecycle() {
  const [state, setState] = useState<PwaState>({ kind: "idle" });

  useEffect(() => {
    if (import.meta.env.DEV) {
      void unregisterDevelopmentServiceWorkers();
      return;
    }

    const updateServiceWorker = registerSW({
      immediate: true,
      onOfflineReady() {
        setState({ kind: "offline-ready" });
      },
      onNeedRefresh() {
        setState({
          kind: "update-ready",
          update: updateServiceWorker
        });
      }
    });
  }, []);

  const banner = useMemo(() => {
    if (state.kind === "offline-ready") {
      return {
        title: "Modo offline pronto",
        description: "O aplicativo pode continuar operando com cache local."
      };
    }

    if (state.kind === "update-ready") {
      return {
        title: "Atualizacao disponivel",
        description: "Existe uma nova versao pronta para carregar."
      };
    }

    return null;
  }, [state]);

  if (!banner) {
    return null;
  }

  return (
    <div style={bannerWrapperStyle}>
      <div style={bannerStyle}>
        <div>
          <strong style={{ display: "block", marginBottom: "0.2rem" }}>{banner.title}</strong>
          <span style={bannerTextStyle}>{banner.description}</span>
        </div>
        <div style={actionsStyle}>
          {state.kind === "update-ready" ? (
            <button type="button" style={primaryButtonStyle} onClick={() => void state.update(true)}>
              Atualizar agora
            </button>
          ) : null}
          <button type="button" style={secondaryButtonStyle} onClick={() => setState({ kind: "idle" })}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

async function unregisterDevelopmentServiceWorkers() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(getDevelopmentCacheKeysForCleanup(cacheKeys).map((key) => caches.delete(key)));
  }
}

const bannerWrapperStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: "1.25rem",
  transform: "translateX(-50%)",
  zIndex: 80,
  width: "min(92vw, 540px)"
};

const bannerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  padding: "1rem 1.1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.95)",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  boxShadow: "0 18px 50px rgba(15, 23, 42, 0.35)"
};

const bannerTextStyle: CSSProperties = {
  color: "#cbd5e1"
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
  justifyContent: "flex-end"
};

const primaryButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.85rem",
  padding: "0.75rem 0.95rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const secondaryButtonStyle: CSSProperties = {
  borderRadius: "0.85rem",
  padding: "0.75rem 0.95rem",
  background: "transparent",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)"
};
