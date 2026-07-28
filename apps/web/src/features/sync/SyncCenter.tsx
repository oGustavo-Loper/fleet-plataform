import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import type { SyncQueueItem } from "@fleet/shared-types";

import { db } from "../../lib/db";

export function SyncCenter() {
  const [items, setItems] = useState<SyncQueueItem[]>([]);

  useEffect(() => {
    void db.outbox.toArray().then((rows) => {
      setItems(rows);
    });
  }, []);

  return (
    <section style={panelStyle}>
      <h2 style={{ marginTop: 0 }}>Fila de sincronização</h2>
      {items.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>Nenhum item pendente.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <div>
              <strong>{item.entity}</strong>
              <p style={{ margin: "0.25rem 0 0", color: "#94a3b8" }}>
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <span>{item.status}</span>
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

const rowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "0.75rem 0",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)"
};
