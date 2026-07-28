import type { CSSProperties, PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";

export function CenteredShell({
  title,
  subtitle,
  children
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  const navigate = useNavigate();

  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <button type="button" style={backButtonStyle} onClick={() => navigate(-1)}>
          Voltar
        </button>
        <div style={headerContentStyle}>
          <p style={eyebrowStyle}>Fleet Platform</p>
          <h1 style={titleStyle}>{title}</h1>
          <p style={subtitleStyle}>{subtitle}</p>
        </div>
      </header>
      <main style={mainStyle}>{children}</main>
    </div>
  );
}

const shellStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,176,0,0.14), transparent 28%), linear-gradient(180deg, #0f172a 0%, #111827 55%, #172033 100%)",
  color: "#f8fafc"
};

const headerStyle: CSSProperties = {
  padding: "2rem 1.25rem 1rem",
  maxWidth: "960px",
  margin: "0 auto",
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
  gap: "1rem"
};

const headerContentStyle: CSSProperties = {
  display: "grid",
  gap: "0.25rem",
  justifyItems: "center"
};

const mainStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 1.25rem 2rem",
  display: "grid",
  gap: "1rem"
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontSize: "0.72rem",
  color: "#fbbf24"
};

const titleStyle: CSSProperties = {
  margin: "0.4rem 0",
  fontSize: "clamp(2rem, 4vw, 3.5rem)"
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "#cbd5e1",
  maxWidth: "720px"
};

const backButtonStyle: CSSProperties = {
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#f8fafc",
  padding: "0.8rem 1rem"
};
