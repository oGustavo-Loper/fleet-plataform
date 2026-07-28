import type { CSSProperties } from "react";

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  currentCount: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  currentCount,
  onPageChange
}: Props) {
  if (totalItems <= pageSize) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = start + currentCount - 1;

  return (
    <div style={wrapperStyle}>
      <span style={summaryStyle}>
        Mostrando {start}-{end} de {totalItems}
      </span>
      <div style={actionsStyle}>
        <button
          type="button"
          style={ghostButtonStyle}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </button>
        <span style={pageStyle}>
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          style={ghostButtonStyle}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

const wrapperStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
  marginTop: "1rem"
};

const summaryStyle: CSSProperties = {
  color: "#94a3b8"
};

const actionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap"
};

const pageStyle: CSSProperties = {
  color: "#cbd5e1"
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: "0.9rem",
  padding: "0.75rem 0.95rem",
  background: "transparent",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)"
};
