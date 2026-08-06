import type { CSSProperties, ReactNode } from "react";

export function LoadingState({ message }: { message: string }) {
  return <p style={mutedStateStyle}>{message}</p>;
}

export function EmptyState({
  message,
  action
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <section style={panelStyle}>
      <p style={mutedStateStyle}>{message}</p>
      {action ? <div>{action}</div> : null}
    </section>
  );
}

export function ErrorState({
  message,
  detail
}: {
  message: string;
  detail?: string;
}) {
  return (
    <section style={panelStyle}>
      <p style={errorStateStyle} role="alert" aria-live="assertive">
        {message}
      </p>
      {detail ? <p style={detailStyle}>{detail}</p> : null}
    </section>
  );
}

const panelStyle: CSSProperties = {
  padding: "1rem 1.1rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  background: "rgba(15, 23, 42, 0.52)"
};

const mutedStateStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8"
};

const errorStateStyle: CSSProperties = {
  margin: 0,
  color: "#fda4af"
};

const detailStyle: CSSProperties = {
  margin: "0.5rem 0 0",
  color: "#cbd5e1"
};
