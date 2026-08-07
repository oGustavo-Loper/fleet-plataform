import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import { CenteredShell } from "../components/CenteredShell";
import { useAuth } from "../contexts/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";

export function NotFoundPage() {
  usePageMeta("404 Not Found", "A página que você tentou acessar não existe ou foi movida.");
  const { isAuthenticated } = useAuth();

  return (
    <CenteredShell title="404" subtitle="Página não encontrada.">
      <div style={panelStyle}>
        <p style={textStyle}>
          O endereço que você tentou acessar não existe ou foi movido. Confira o link ou volte para
          um lugar conhecido.
        </p>
        <Link to={isAuthenticated ? "/dashboard" : "/"} style={primaryLinkStyle}>
          {isAuthenticated ? "Ir para o painel" : "Ir para o início"}
        </Link>
      </div>
    </CenteredShell>
  );
}

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "1.25rem",
  justifyItems: "center",
  padding: "2rem 1rem",
  textAlign: "center"
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#cbd5e1",
  maxWidth: "480px"
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "0.9rem",
  padding: "0.9rem 1.25rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};
