import type { CSSProperties } from "react";
import { useQuery } from "@apollo/client/react";
import { AppShell } from "@fleet/ui";
import type { UserRole } from "@fleet/shared-types";

import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { useTenant } from "../hooks/useTenant";
import { USERS_QUERY } from "../lib/queries";

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  COMPANY: "Empresa",
  INDIVIDUAL: "Pessoa física",
  DRIVER: "Motorista",
  SUPER_ADMIN: "Admin. da plataforma"
};

type TeamUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export function TeamPage() {
  const { activeTenant } = useTenant();

  const { data, loading, error } = useQuery<{ users: TeamUser[] }>(USERS_QUERY, {
    skip: !activeTenant?.id,
    variables: { tenantId: activeTenant?.id ?? "" },
    fetchPolicy: "network-only"
  });

  const users = data?.users ?? [];

  return (
    <AppShell title="Equipe" subtitle="Usuários com acesso à conta, além dos motoristas.">
      <p style={helperTextStyle}>
        Para virar Gestor, a pessoa precisa primeiro estar cadastrada como motorista, com e-mail de
        login, e já ter feito o primeiro acesso. A promoção acontece pelo menu do motorista, na
        tela Motoristas.
      </p>
      {loading ? (
        <LoadingState message="Carregando equipe..." />
      ) : error ? (
        <ErrorState message="Falha ao carregar usuários da conta." />
      ) : users.length > 0 ? (
        <section style={listStyle}>
          {users.map((item) => (
            <article key={item.id} style={cardStyle}>
              <div>
                <strong>{item.fullName}</strong>
                <p style={mutedStyle}>{item.email}</p>
              </div>
              <div style={badgeRowStyle}>
                <span style={roleBadgeStyle}>{roleLabel[item.role] ?? item.role}</span>
                <span style={{ ...statusBadgeStyle, color: item.isActive ? "#4ade80" : "#fda4af" }}>
                  {item.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState message="Nenhum usuário encontrado para esta conta." />
      )}
    </AppShell>
  );
}

const helperTextStyle: CSSProperties = {
  margin: "0 0 1.25rem",
  color: "#94a3b8",
  lineHeight: 1.5
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))"
};

const cardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  display: "grid",
  gap: "0.75rem"
};

const mutedStyle: CSSProperties = {
  margin: "0.35rem 0 0",
  color: "#94a3b8"
};

const badgeRowStyle: CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap"
};

const roleBadgeStyle: CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: "999px",
  background: "rgba(251, 191, 36, 0.14)",
  color: "#fbbf24",
  fontSize: "0.8rem",
  height: "fit-content"
};

const statusBadgeStyle: CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: "999px",
  background: "rgba(148, 163, 184, 0.12)",
  fontSize: "0.8rem",
  height: "fit-content"
};
