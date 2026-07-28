import type { CSSProperties, PropsWithChildren } from "react";

export function AppShell({
  title,
  subtitle,
  children
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <div>
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
  maxWidth: "1200px",
  margin: "0 auto"
};

const mainStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 1.25rem 2rem"
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
