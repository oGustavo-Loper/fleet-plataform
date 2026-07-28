import type { CSSProperties, PropsWithChildren } from "react";

export function FormField({
  label,
  children,
  style
}: PropsWithChildren<{ label: string; style?: CSSProperties }>) {
  return (
    <label style={{ ...wrapperStyle, ...style }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export const formInputStyle: CSSProperties = {
  borderRadius: "0.8rem",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(15, 23, 42, 0.85)",
  color: "#f8fafc",
  padding: "1rem 1rem",
  minHeight: "3.25rem"
};

export const formPanelStyle: CSSProperties = {
  padding: "1.25rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  marginBottom: "1.25rem"
};

export const formGridStyle: CSSProperties = {
  display: "grid",
  columnGap: "1rem",
  rowGap: "1.1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  alignItems: "start"
};

export const primarySubmitStyle: CSSProperties = {
  marginTop: "1rem",
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

export const secondaryActionStyle: CSSProperties = {
  marginTop: "1rem",
  marginLeft: "0.75rem",
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "transparent",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)"
};

const wrapperStyle: CSSProperties = {
  display: "grid",
  gap: "0.55rem",
  alignContent: "start"
};

const labelStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "0.92rem"
};
