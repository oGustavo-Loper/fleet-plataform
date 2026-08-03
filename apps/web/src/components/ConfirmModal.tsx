import type { CSSProperties, ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onCancel
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <strong style={titleStyle}>{title}</strong>
        </div>
        <div style={bodyStyle}>{description}</div>
        <div style={actionsStyle}>
          <button type="button" style={cancelButtonStyle} onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? undefined : "btn-primary"}
            style={danger ? dangerButtonStyle : confirmButtonStyle}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2, 6, 23, 0.72)",
  backdropFilter: "blur(4px)",
  display: "grid",
  placeItems: "center",
  padding: "1rem",
  zIndex: 50
};

const modalStyle: CSSProperties = {
  width: "min(100%, 460px)",
  padding: "1.25rem",
  borderRadius: "1rem",
  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.45)"
};

const headerStyle: CSSProperties = {
  marginBottom: "0.75rem"
};

const titleStyle: CSSProperties = {
  fontSize: "1.1rem",
  color: "#f8fafc"
};

const bodyStyle: CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginTop: "1.25rem"
};

const cancelButtonStyle: CSSProperties = {
  borderRadius: "0.9rem",
  padding: "0.8rem 1rem",
  background: "transparent",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)"
};

const confirmButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.8rem 1rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const dangerButtonStyle: CSSProperties = {
  ...confirmButtonStyle,
  background: "#ef4444",
  color: "#fff7f7"
};
