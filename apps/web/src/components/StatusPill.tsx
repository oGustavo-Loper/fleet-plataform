import type { SyncStatus } from "@fleet/shared-types";

const colors: Record<SyncStatus, string> = {
  ONLINE: "#16a34a",
  OFFLINE: "#ef4444",
  SYNCING: "#f59e0b",
  SYNCED: "#38bdf8",
  CONFLICT: "#fb7185"
};

const labels: Record<SyncStatus, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  SYNCING: "Sincronizando",
  SYNCED: "Sincronizado",
  CONFLICT: "Conflito"
};

export function StatusPill({ status }: { status: SyncStatus }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.45rem 0.7rem",
        borderRadius: "999px",
        background: "rgba(15, 23, 42, 0.72)",
        border: `1px solid ${colors[status]}`,
        color: "#f8fafc",
        fontSize: "0.9rem"
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: colors[status]
        }}
      />
      {labels[status]}
    </span>
  );
}
