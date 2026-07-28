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
import { formatCpf, limitText, onlyDigits } from "../lib/masks";
import { resolveMediaUrl, uploadMediaFile } from "../lib/media";
import { REGISTER_INDIVIDUAL_MUTATION } from "../lib/queries";

export function RegisterIndividualPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    cpf: "",
    email: "",
    password: "",
    createDriverProfile: true,
    cnh: "",
    cnhCategory: "B",
    cnhExpiresAt: "",
    photoDataUrl: ""
  });
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [registerMutation, { loading, error }] = useMutation(REGISTER_INDIVIDUAL_MUTATION);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const fullName = form.fullName.trim();
    const cpf = form.cpf.trim();
    const email = form.email.trim();
    const cnh = form.cnh.trim();
    const cnhExpiresAt = form.cnhExpiresAt.trim();

    if (isBlank(fullName)) {
      setValidationError("Informe seu nome completo.");
      return;
    }

    if (!hasMinDigits(cpf, 11)) {
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

    if (form.createDriverProfile) {
      if (!hasMinDigits(cnh, 5)) {
        setValidationError("Informe a CNH para criar o perfil de motorista.");
        return;
      }

      if (isBlank(cnhExpiresAt)) {
        setValidationError("Informe a validade da CNH.");
        return;
      }
    }

    const result = await registerMutation({
      variables: {
        input: {
          ...form,
          fullName,
          cpf,
          email,
          cnh,
          cnhExpiresAt: cnhExpiresAt || undefined
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
        <FileUploadField
          label="Sua foto"
          accept="image/*"
          buttonLabel="Selecionar foto"
          hint={photoLoading ? "Enviando foto..." : "Imagem usada no perfil pessoal"}
          error={photoError}
          loading={photoLoading}
          previewUrl={resolveMediaUrl(form.photoDataUrl)}
          previewAlt="Preview do perfil"
          onSelect={async (file) => {
            if (!file) {
              setForm({ ...form, photoDataUrl: "" });
              return;
            }
            setPhotoLoading(true);
            setPhotoError("");
            try {
              const uploaded = await uploadMediaFile(file, "individual-photo");
              setForm({ ...form, photoDataUrl: uploaded.url });
            } catch (uploadError) {
              setPhotoError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar foto.");
            } finally {
              setPhotoLoading(false);
            }
          }}
        />
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
          <>
            <FormField label="CNH">
              <input
                style={formInputStyle}
                placeholder="Ex: 9988776655"
                value={form.cnh}
                maxLength={20}
                required
                onChange={(event) =>
                  setForm({ ...form, cnh: limitText(onlyDigits(event.target.value, 20), 20) })
                }
              />
            </FormField>
            <FormField label="Categoria da CNH">
              <select
                style={formInputStyle}
                value={form.cnhCategory}
                onChange={(event) => setForm({ ...form, cnhCategory: event.target.value })}
              >
                <option value="A">A</option>
                <option value="AB">AB</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </FormField>
            <FormField label="Validade da CNH">
              <input
                style={formInputStyle}
                type="date"
                value={form.cnhExpiresAt}
                required
                onChange={(event) => setForm({ ...form, cnhExpiresAt: event.target.value })}
              />
            </FormField>
          </>
        ) : null}
        <p style={hintStyle}>
          Esta conta nasce com plano `ESSENTIAL_FREE` e limite inicial de 3 veículos.
        </p>
        {validationError ? <p style={errorStyle}>{validationError}</p> : null}
        {error ? <p style={errorStyle}>{error.message}</p> : null}
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

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  color: "#cbd5e1"
};
