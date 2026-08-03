import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { liveQuery } from "dexie";

import type { SyncQueueItem } from "@fleet/shared-types";

import { db } from "../../lib/db";
import { flushOutbox } from "../../lib/sync-manager";
import { useConnectivity } from "../../hooks/useConnectivity";

const entityLabels: Record<SyncQueueItem["entity"], string> = {
  vehicle: "Veículo",
  driver: "Motorista",
  fuelLog: "Abastecimento",
  maintenance: "Manutenção"
};

const statusLabels: Record<SyncQueueItem["status"], string> = {
  PENDING: "Aguardando conexão",
  SYNCING: "Sincronizando...",
  SYNCED: "Sincronizado",
  ERROR: "Falhou, será tentado novamente"
};

export function SyncCenter() {
  const online = useConnectivity();
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const subscription = liveQuery(() => db.outbox.toArray()).subscribe({
      next: setItems,
      error: () => setItems([])
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSyncNow() {
    setSyncing(true);
    try {
      await flushOutbox();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>Fila de sincronização</h2>
        <button
          type="button"
          className="btn-primary"
          style={syncButtonStyle}
          onClick={handleSyncNow}
          disabled={!online || syncing || items.length === 0}
        >
          {syncing ? "Sincronizando..." : "Sincronizar agora"}
        </button>
      </div>
      {items.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>Nenhum item pendente.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <div>
              <strong>{entityLabels[item.entity] ?? item.entity}</strong>
              <p style={{ margin: "0.25rem 0 0", color: "#94a3b8" }}>
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </p>
              {item.errorMessage ? (
                <p style={{ margin: "0.25rem 0 0", color: "#fda4af" }}>{item.errorMessage}</p>
              ) : null}
            </div>
            <span>{statusLabels[item.status] ?? item.status}</span>
          </div>
        ))
      )}
    </section>
  );
}

const panelStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  marginBottom: "0.75rem"
};

const syncButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.8rem",
  padding: "0.6rem 0.9rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "0.75rem 0",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)"
};
