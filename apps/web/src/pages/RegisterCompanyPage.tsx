import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Link, useNavigate } from "react-router-dom";

import { AppShell } from "@fleet/ui";

import { FileUploadField } from "../components/FileUploadField";
import { FormField, formInputStyle } from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import { apolloClient } from "../lib/apollo";
import { hasMinDigits, isBlank } from "../lib/form-validation";
import { formatCnpj } from "../lib/masks";
import { resolveMediaUrl, uploadMediaFile } from "../lib/media";
import { REGISTER_COMPANY_MUTATION } from "../lib/queries";

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    companyName: "",
    cnpj: "",
    adminFullName: "",
    email: "",
    password: "",
    photoDataUrl: ""
  });
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [registerMutation, { loading, error }] = useMutation(REGISTER_COMPANY_MUTATION);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const companyName = form.companyName.trim();
    const cnpj = form.cnpj.trim();
    const adminFullName = form.adminFullName.trim();
    const email = form.email.trim();
    const password = form.password;

    if (isBlank(companyName)) {
      setValidationError("Informe o nome da empresa.");
      return;
    }

    if (!hasMinDigits(cnpj, 14)) {
      setValidationError("Informe um CNPJ válido.");
      return;
    }

    if (isBlank(adminFullName)) {
      setValidationError("Informe o responsável pela conta.");
      return;
    }

    if (isBlank(email)) {
      setValidationError("Informe um e-mail válido.");
      return;
    }

    if (password.trim().length < 8) {
      setValidationError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    const result = await registerMutation({
        variables: {
          input: {
            ...form,
            companyName,
            cnpj,
            adminFullName,
            email
          }
        }
      });

    const payload = result.data?.registerCompany;
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
      title="Criar Conta Empresa"
      subtitle="Cadastre sua empresa no Fleet Platform e gere o primeiro acesso administrativo."
    >
      <form style={formStyle} onSubmit={handleSubmit}>
        <FormField label="Nome da empresa">
          <input
            style={formInputStyle}
            placeholder="Ex: Transportes Sol"
            value={form.companyName}
            required
            onChange={(event) => setForm({ ...form, companyName: event.target.value })}
          />
        </FormField>
        <FileUploadField
          label="Foto da empresa"
          accept="image/*"
          buttonLabel="Selecionar foto"
          hint={photoLoading ? "Enviando foto..." : "Imagem usada no perfil da empresa"}
          error={photoError}
          loading={photoLoading}
          previewUrl={resolveMediaUrl(form.photoDataUrl)}
          previewAlt="Preview da empresa"
          onSelect={async (file) => {
            if (!file) {
              setForm({ ...form, photoDataUrl: "" });
              return;
            }
            setPhotoLoading(true);
            setPhotoError("");
            try {
              const uploaded = await uploadMediaFile(file, "company-photo");
              setForm({ ...form, photoDataUrl: uploaded.url });
            } catch (uploadError) {
              setPhotoError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar foto.");
            } finally {
              setPhotoLoading(false);
            }
          }}
        />
        <FormField label="CNPJ">
          <input
            style={formInputStyle}
            placeholder="Ex: 12.345.678/0001-99"
            value={form.cnpj}
            maxLength={18}
            required
            onChange={(event) => setForm({ ...form, cnpj: formatCnpj(event.target.value) })}
          />
        </FormField>
        <FormField label="Responsável pela conta">
          <input
            style={formInputStyle}
            placeholder="Ex: Gustavo Silva"
            value={form.adminFullName}
            required
            onChange={(event) => setForm({ ...form, adminFullName: event.target.value })}
          />
        </FormField>
        <FormField label="E-mail">
          <input
            style={formInputStyle}
            type="email"
            placeholder="Ex: contato@empresa.com"
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
        <p style={hintStyle}>
          Ao concluir, a empresa já entra no sistema com plano inicial e login administrativo.
        </p>
        {validationError ? <p style={errorStyle}>{validationError}</p> : null}
        {error ? <p style={errorStyle}>{error.message}</p> : null}
        <button style={buttonStyle} type="submit" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta empresa"}
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
  maxWidth: "520px",
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
