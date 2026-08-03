import { useState, type CSSProperties, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { AppShell } from "@fleet/ui";
import type { UserRole } from "@fleet/shared-types";

import { DrawerPanel } from "../components/DrawerPanel";
import { FormField, formGridStyle, formInputStyle, formPanelStyle, primarySubmitStyle } from "../components/FormField";
import { EmptyState, ErrorState, LoadingState } from "../components/ScreenState";
import { useAuth } from "../contexts/AuthContext";
import { useTenant } from "../hooks/useTenant";
import { INVITE_USER_MUTATION, USERS_QUERY } from "../lib/queries";
import { isBlank } from "../lib/form-validation";

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
  const { auth } = useAuth();
  const { activeTenant } = useTenant();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");
  const [inviteResult, setInviteResult] = useState("");

  const canInvite = auth?.role === "ADMIN";

  const { data, loading, error } = useQuery<{ users: TeamUser[] }>(USERS_QUERY, {
    skip: !activeTenant?.id,
    variables: { tenantId: activeTenant?.id ?? "" },
    fetchPolicy: "network-only"
  });

  const [inviteUser, { loading: inviting, error: inviteError }] = useMutation(INVITE_USER_MUTATION, {
    refetchQueries: [{ query: USERS_QUERY, variables: { tenantId: activeTenant?.id ?? "" } }]
  });

  const users = data?.users ?? [];

  function openDrawer() {
    setFullName("");
    setEmail("");
    setValidationError("");
    setInviteResult("");
    setDrawerOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    setInviteResult("");

    if (isBlank(fullName)) {
      setValidationError("Informe o nome do usuário.");
      return;
    }

    if (isBlank(email) || !email.includes("@")) {
      setValidationError("Informe um e-mail válido.");
      return;
    }

    if (!activeTenant?.id) {
      return;
    }

    const { data: result } = await inviteUser({
      variables: {
        input: {
          tenantId: activeTenant.id,
          email: email.trim(),
          fullName: fullName.trim()
        }
      }
    });

    const debugPassword = result?.inviteUser?.debugPassword;
    setInviteResult(
      debugPassword
        ? `Convite criado. SMTP não configurado neste ambiente — senha temporária: ${debugPassword}`
        : "Convite enviado por e-mail com uma senha temporária."
    );
    setFullName("");
    setEmail("");
  }

  return (
    <AppShell title="Equipe" subtitle="Usuários com acesso à conta, além dos motoristas.">
      {canInvite ? (
        <div style={toolbarStyle}>
          <button type="button" className="btn-primary" style={primaryButtonStyle} onClick={openDrawer}>
            Convidar usuário
          </button>
        </div>
      ) : null}
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
      <DrawerPanel open={drawerOpen} title="Convidar usuário" onClose={() => setDrawerOpen(false)}>
        <form style={formPanelStyle} onSubmit={handleSubmit}>
          <div style={formGridStyle}>
            <FormField label="Nome completo">
              <input
                style={formInputStyle}
                placeholder="Ex: Mariana Souza"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </FormField>
            <FormField label="E-mail">
              <input
                style={formInputStyle}
                type="email"
                placeholder="Ex: mariana@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>
          </div>
          <p style={helperTextStyle}>
            O usuário entra como Gestor: acesso à conta para gerenciar frota, sem poder convidar
            outros usuários. Uma senha temporária é enviada por e-mail e trocada no primeiro acesso.
          </p>
          {validationError ? <p style={{ ...helperTextStyle, color: "#fda4af" }}>{validationError}</p> : null}
          {inviteError ? (
            <p style={{ ...helperTextStyle, color: "#fda4af" }}>Falha ao enviar o convite.</p>
          ) : null}
          {inviteResult ? <p style={{ ...helperTextStyle, color: "#fbbf24" }}>{inviteResult}</p> : null}
          <button className="btn-primary" style={primarySubmitStyle} type="submit" disabled={inviting}>
            {inviting ? "Enviando..." : "Enviar convite"}
          </button>
        </form>
      </DrawerPanel>
    </AppShell>
  );
}

const toolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "1rem"
};

const primaryButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
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

const helperTextStyle: CSSProperties = {
  margin: "1rem 0 0",
  color: "#94a3b8",
  lineHeight: 1.5
};
