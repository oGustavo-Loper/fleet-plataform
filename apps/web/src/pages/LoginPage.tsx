import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AppShell } from "@fleet/ui";

import { FormField, formInputStyle } from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import { apolloClient } from "../lib/apollo";
import { isBlank } from "../lib/form-validation";
import {
  CONFIRM_PASSWORD_RESET_MUTATION,
  LOGIN_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION
} from "../lib/queries";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [requestPasswordReset, { loading: resetRequestLoading, error: resetRequestError }] =
    useMutation(REQUEST_PASSWORD_RESET_MUTATION);
  const [confirmPasswordReset, { loading: resetConfirmLoading, error: resetConfirmError }] =
    useMutation(CONFIRM_PASSWORD_RESET_MUTATION);
  const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const normalizedIdentifier = identifier.trim();
    if (isBlank(normalizedIdentifier)) {
      setFormError("Informe seu e-mail de acesso.");
      return;
    }

    if (isBlank(password)) {
      setFormError("Informe sua senha.");
      return;
    }

    const result = await loginMutation({
      variables: {
        input: {
          identifier: normalizedIdentifier,
          password
        }
      }
    });

    const payload = result.data?.login;
    if (!payload) {
      return;
    }

    await apolloClient.clearStore();

    login({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: normalizedIdentifier,
      role: payload.role,
      fullName: payload.fullName,
      driverId: payload.driverId ?? undefined,
      assignedVehicleIds: payload.assignedVehicleIds ?? [],
      allowAnyVehicle: payload.allowAnyVehicle ?? false,
      mustChangePassword: payload.mustChangePassword ?? false,
      rememberMe
    });

    const nextRoute =
      typeof location.state === "object" && location.state && "from" in location.state
        ? String(location.state.from)
        : payload.mustChangePassword
          ? "/first-access"
          : "/dashboard";

    navigate(nextRoute);
  }

  async function handleRequestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetMessage("");

    const email = (resetEmail || identifier).trim();
    if (isBlank(email)) {
      setResetMessage("Informe o e-mail para recuperar a senha.");
      return;
    }

    const result = await requestPasswordReset({
      variables: {
        input: {
          email
        }
      }
    });

    const payload = result.data?.requestPasswordReset;
    if (!payload) {
      return;
    }

    setResetMessage(`Código enviado para ${email}.`);
  }

  async function handleConfirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = (resetEmail || identifier).trim();

    if (isBlank(email) || isBlank(resetCode)) {
      setResetMessage("Informe e-mail e código de recuperação.");
      return;
    }

    if (isBlank(newPassword)) {
      setResetMessage("Informe a nova senha.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetMessage("As senhas novas precisam ser iguais.");
      return;
    }

    const result = await confirmPasswordReset({
      variables: {
        input: {
          email,
          code: resetCode,
          newPassword
        }
      }
    });

    const payload = result.data?.confirmPasswordReset;
    if (!payload) {
      return;
    }

    await apolloClient.clearStore();

    login({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      userId: payload.userId,
      tenantId: payload.tenantId,
      email,
      role: payload.role,
      fullName: payload.fullName,
      driverId: payload.driverId ?? undefined,
      assignedVehicleIds: payload.assignedVehicleIds ?? [],
      allowAnyVehicle: payload.allowAnyVehicle ?? false,
      mustChangePassword: payload.mustChangePassword ?? false,
      rememberMe
    });

    navigate("/dashboard", { replace: true });
  }

  return (
    <AppShell
      title="Acesso"
      subtitle="Autenticação por conta com perfis para administrador, empresa, motorista e pessoa física."
    >
      <div style={layoutStyle}>
        {showReset ? (
          <div style={formStyle}>
            <div style={sectionHeaderStyle}>
              <strong>Recuperar senha</strong>
              <button type="button" style={linkButtonStyle} onClick={() => setShowReset(false)}>
                Voltar ao login
              </button>
            </div>
            <form style={resetFormStyle} onSubmit={handleRequestReset}>
              <FormField label="E-mail para recuperar">
                <input
                  style={formInputStyle}
                  type="email"
                  placeholder="Ex: você@email.com"
                  value={resetEmail}
                  required
                  onChange={(event) => setResetEmail(event.target.value)}
                />
              </FormField>
              <button style={buttonStyle} type="submit" disabled={resetRequestLoading}>
                {resetRequestLoading ? "Enviando código..." : "Enviar código"}
              </button>
            </form>
            <form style={resetFormStyle} onSubmit={handleConfirmReset}>
              <FormField label="Código">
                <input
                  style={formInputStyle}
                  inputMode="numeric"
                  placeholder="Ex: 123456"
                  value={resetCode}
                  required
                  onChange={(event) => setResetCode(event.target.value)}
                />
              </FormField>
              <FormField label="Nova senha">
                <input
                  style={formInputStyle}
                  type="password"
                  placeholder="Ex: NovaSenha123"
                  value={newPassword}
                  required
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </FormField>
              <FormField label="Confirmar nova senha">
                <input
                  style={formInputStyle}
                  type="password"
                  placeholder="Ex: NovaSenha123"
                  value={confirmPassword}
                  required
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </FormField>
              <button style={buttonStyle} type="submit" disabled={resetConfirmLoading}>
                {resetConfirmLoading ? "Alterando..." : "Alterar senha"}
              </button>
            </form>
            {resetMessage ? <p style={successStyle}>{resetMessage}</p> : null}
            {resetRequestError ? <p style={errorStyle}>{resetRequestError.message}</p> : null}
            {resetConfirmError ? <p style={errorStyle}>{resetConfirmError.message}</p> : null}
          </div>
        ) : (
          <form style={formStyle} onSubmit={handleSubmit}>
            <FormField label="E-mail">
              <input
                style={formInputStyle}
                type="email"
                placeholder="Ex: voce@email.com"
                value={identifier}
                required
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </FormField>
            <FormField label="Senha">
              <input
                style={formInputStyle}
                type="password"
                placeholder="Sua senha"
                value={password}
                required
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>
            <label style={rememberMeLabelStyle}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Lembrar de mim neste dispositivo
            </label>
            <div style={actionsStyle}>
              <Link style={linkStyle} to="/register/company">
                Criar conta empresa
              </Link>
              <Link style={linkStyle} to="/register/individual">
                Criar conta pessoal
              </Link>
              <Link style={linkStyle} to="/plans">
                Ver planos
              </Link>
              <button type="button" style={linkButtonStyle} onClick={() => setShowReset(true)}>
                Esqueci minha senha
              </button>
            </div>
            {error ? <p style={errorStyle}>{error.message}</p> : null}
            {formError ? <p style={errorStyle}>{formError}</p> : null}
            <button style={buttonStyle} type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}

const layoutStyle: CSSProperties = {
  minHeight: "calc(100vh - 200px)",
  display: "grid",
  placeItems: "center",
  paddingBottom: "1rem"
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  width: "min(100%, 420px)",
  padding: "1.25rem",
  background: "rgba(15, 23, 42, 0.72)",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const buttonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.95rem 1.2rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const hintStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "0.95rem"
};

const errorStyle: CSSProperties = {
  color: "#fda4af",
  margin: 0
};

const actionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem"
};

const linkStyle: CSSProperties = {
  color: "#fbbf24"
};

const linkButtonStyle: CSSProperties = {
  border: 0,
  background: "transparent",
  color: "#fbbf24",
  padding: 0,
  font: "inherit",
  cursor: "pointer"
};

const rememberMeLabelStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.65rem",
  color: "#cbd5e1"
};

const resetFormStyle: CSSProperties = {
  display: "grid",
  gap: "0.9rem"
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem"
};

const successStyle: CSSProperties = {
  color: "#86efac",
  margin: 0
};
