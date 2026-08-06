import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Link, useNavigate } from "react-router-dom";

import { AppShell } from "@fleet/ui";
import { TERMS_VERSION } from "@fleet/shared-types";
import { isValidCpf } from "@fleet/shared-validation";

import { FormField, formInputStyle } from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { apolloClient } from "../lib/apollo";
import { isBlank } from "../lib/form-validation";
import { formatCpf } from "../lib/masks";
import { REGISTER_INDIVIDUAL_MUTATION } from "../lib/queries";

export function RegisterIndividualPage() {
  usePageMeta("Criar conta pessoal", "Cadastre sua conta pessoal e comece com até 3 veículos no plano inicial.");
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    cpf: "",
    email: "",
    password: "",
    confirmPassword: "",
    createDriverProfile: true
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [registerMutation, { loading, error }] = useMutation(REGISTER_INDIVIDUAL_MUTATION);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const fullName = form.fullName.trim();
    const cpf = form.cpf.trim();
    const email = form.email.trim();

    if (isBlank(fullName)) {
      setValidationError("Informe seu nome completo.");
      return;
    }

    if (!isValidCpf(cpf)) {
      setValidationError("Informe um CPF válido.");
      return;
    }

    if (isBlank(email)) {
      setValidationError("Informe um e-mail válido.");
      return;
    }

    if (form.password.trim().length < 8) {
      setValidationError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setValidationError("As senhas precisam ser iguais.");
      return;
    }

    if (!acceptedTerms) {
      setValidationError("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }

    const { confirmPassword: _confirmPassword, ...registrationForm } = form;

    const result = await registerMutation({
      variables: {
        input: {
          ...registrationForm,
          fullName,
          cpf,
          email,
          acceptedTermsVersion: TERMS_VERSION
        }
      }
    });

    const payload = result.data?.registerIndividual;
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
      rememberMe: true
    });

    navigate("/onboarding");
  }

  return (
    <AppShell
      title="Criar Conta Pessoal"
      subtitle="Cadastre sua conta pessoal e comece com até 3 veículos no plano inicial."
    >
      <form style={formStyle} onSubmit={handleSubmit}>
        <FormField label="Nome completo">
          <input
            style={formInputStyle}
            placeholder="Ex: Gustavo Silva"
            value={form.fullName}
            required
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </FormField>
        <FormField label="CPF">
          <input
            style={formInputStyle}
            placeholder="Ex: 123.456.789-10"
            value={form.cpf}
            maxLength={14}
            required
            onChange={(event) => setForm({ ...form, cpf: formatCpf(event.target.value) })}
          />
        </FormField>
        <FormField label="E-mail">
          <input
            style={formInputStyle}
            type="email"
            placeholder="Ex: você@email.com"
            value={form.email}
            required
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </FormField>
        <FormField label="Senha">
          <input
            style={formInputStyle}
            type="password"
            placeholder="Ex: MinhaSenha123"
            value={form.password}
            required
            minLength={8}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </FormField>
        <FormField label="Confirmar senha">
          <input
            style={formInputStyle}
            type="password"
            placeholder="Ex: MinhaSenha123"
            value={form.confirmPassword}
            required
            minLength={8}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
          />
        </FormField>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={form.createDriverProfile}
            onChange={(event) =>
              setForm({ ...form, createDriverProfile: event.target.checked })
            }
          />
          Quero me cadastrar também como motorista
        </label>
        {form.createDriverProfile ? (
          <p style={hintStyle}>
            Sua foto e os dados da CNH (número, categoria e validade) ficam pendentes e podem ser
            completados depois, em "Meu perfil".
          </p>
        ) : null}
        <p style={hintStyle}>
          Esta conta nasce com plano `ESSENTIAL_FREE` e limite inicial de 3 veículos.
        </p>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={acceptedTerms}
            required
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          Li e aceito os{" "}
          <Link style={linkStyle} to="/termos" target="_blank" rel="noreferrer">
            Termos de Uso e a Política de Privacidade
          </Link>
        </label>
        {validationError ? (
          <p style={errorStyle} role="alert" aria-live="assertive">
            {validationError}
          </p>
        ) : null}
        {error ? (
          <p style={errorStyle} role="alert" aria-live="assertive">
            {error.message}
          </p>
        ) : null}
        <button style={buttonStyle} type="submit" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta pessoal"}
        </button>
        <Link style={linkStyle} to="/login">
          Já tenho login
        </Link>
      </form>
    </AppShell>
  );
}

const formStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  width: "100%",
  maxWidth: "520px",
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

const linkStyle: CSSProperties = {
  color: "#fbbf24"
};

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  color: "#cbd5e1"
};
