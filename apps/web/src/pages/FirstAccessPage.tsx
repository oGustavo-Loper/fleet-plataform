import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Navigate, useNavigate } from "react-router-dom";

import { CenteredShell } from "../components/CenteredShell";
import { FormField, formInputStyle } from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { apolloClient } from "../lib/apollo";
import { isBlank } from "../lib/form-validation";
import { COMPLETE_FIRST_LOGIN_MUTATION } from "../lib/queries";

export function FirstAccessPage() {
  usePageMeta("Primeiro acesso", "Defina uma senha nova antes de continuar usando a conta.");
  const navigate = useNavigate();
  const { auth, login, isAuthenticated, isInitializing } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [completeFirstLogin, { loading, error }] = useMutation(COMPLETE_FIRST_LOGIN_MUTATION);

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated || !auth) {
    return <Navigate to="/login" replace />;
  }

  if (!auth.mustChangePassword) {
    return <Navigate to="/dashboard" replace />;
  }

  const currentAuth = auth;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    if (isBlank(currentPassword) || isBlank(newPassword) || isBlank(confirmPassword)) {
      setLocalError("Preencha todos os campos de senha.");
      return;
    }

    if (newPassword.trim().length < 8) {
      setLocalError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("As senhas novas precisam ser iguais.");
      return;
    }

    const result = await completeFirstLogin({
      variables: {
        input: {
          email: currentAuth.email,
          currentPassword,
          newPassword
        }
      }
    });

    const payload = result.data?.completeFirstLogin;
    if (!payload) {
      return;
    }

    await apolloClient.clearStore();

    login({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: currentAuth.email,
      role: payload.role,
      fullName: payload.fullName,
      driverId: payload.driverId ?? undefined,
      assignedVehicleIds: payload.assignedVehicleIds ?? [],
      allowAnyVehicle: payload.allowAnyVehicle ?? false,
      mustChangePassword: payload.mustChangePassword ?? false,
      rememberMe: currentAuth.rememberMe
    });

    navigate("/dashboard", { replace: true });
  }

  return (
    <CenteredShell
      title="Primeiro Acesso"
      subtitle="Defina uma senha nova antes de continuar usando a conta."
    >
      <form style={formStyle} onSubmit={handleSubmit}>
        <FormField label="Senha temporaria">
          <input
            style={formInputStyle}
            type="password"
            value={currentPassword}
            required
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </FormField>
        <FormField label="Nova senha">
          <input
            style={formInputStyle}
            type="password"
            value={newPassword}
            required
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </FormField>
        <FormField label="Confirmar nova senha">
          <input
            style={formInputStyle}
            type="password"
            value={confirmPassword}
            required
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </FormField>
        <p style={hintStyle}>
          Depois de salvar, a senha temporaria deixa de funcionar.
        </p>
        {localError ? <p style={errorStyle}>{localError}</p> : null}
        {error ? <p style={errorStyle}>{error.message}</p> : null}
        <button style={buttonStyle} type="submit" disabled={loading}>
          {loading ? "Atualizando senha..." : "Salvar nova senha"}
        </button>
      </form>
    </CenteredShell>
  );
}

const formStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  maxWidth: "520px",
  width: "100%",
  margin: "0 auto",
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
  margin: 0
};

const errorStyle: CSSProperties = {
  color: "#fda4af",
  margin: 0
};
