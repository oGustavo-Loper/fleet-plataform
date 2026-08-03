import type { CSSProperties, FormEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import type { DriverListItem } from "@fleet/shared-types";

import { AppShell } from "@fleet/ui";

import { AvatarPickerField } from "../components/AvatarPickerField";
import { FormField, formGridStyle, formInputStyle, formPanelStyle, primarySubmitStyle } from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import { useTenant } from "../hooks/useTenant";
import { hasExactDigits } from "../lib/form-validation";
import { limitText, onlyDigits } from "../lib/masks";
import { resolveMediaUrl, uploadMediaFile } from "../lib/media";
import { DRIVERS_QUERY, UPDATE_DRIVER_MUTATION } from "../lib/queries";

function getInitialForm(driver?: DriverListItem | null) {
  return {
    cnh: driver?.cnh ?? "",
    cnhCategory: driver?.cnhCategory ?? "B",
    cnhExpiresAt: driver?.cnhExpiresAt ? driver.cnhExpiresAt.slice(0, 10) : "",
    photoDataUrl: driver?.photoDataUrl ?? ""
  };
}

export function ProfilePage() {
  const { auth } = useAuth();
  const { activeTenant } = useTenant();
  const tenantId = activeTenant?.id ?? "";

  const driversQuery = useQuery<{ drivers: DriverListItem[] }>(DRIVERS_QUERY, {
    skip: !tenantId || !auth?.driverId,
    variables: { tenantId }
  });

  const driver = driversQuery.data?.drivers.find((item) => item.id === auth?.driverId) ?? null;

  const [form, setForm] = useState(getInitialForm(driver));
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (driver) {
      setForm(getInitialForm(driver));
    }
  }, [driver?.id]);

  const [mutateDriver, { loading, error }] = useMutation(UPDATE_DRIVER_MUTATION);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    setSuccessMessage("");

    if (!driver) {
      return;
    }

    const cnh = form.cnh.trim();
    const cnhExpiresAt = form.cnhExpiresAt.trim();

    if (cnh && !hasExactDigits(cnh, 11)) {
      setValidationError("Informe uma CNH válida (11 dígitos) ou deixe o campo em branco.");
      return;
    }

    await mutateDriver({
      variables: {
        input: {
          id: driver.id,
          fullName: driver.fullName,
          cnh: cnh || undefined,
          cnhCategory: cnh ? form.cnhCategory : undefined,
          cnhExpiresAt: cnhExpiresAt || undefined,
          photoDataUrl: form.photoDataUrl
        }
      }
    });

    setSuccessMessage("Perfil atualizado com sucesso.");
  }

  if (!auth?.driverId || !driver) {
    return (
      <AppShell title="Meu perfil" subtitle="Gerencie sua foto e os dados da sua CNH.">
        <p style={mutedStyle}>
          {auth?.driverId
            ? "Carregando seu perfil..."
            : "Esta conta não possui um perfil de motorista vinculado."}
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Meu perfil" subtitle="Gerencie sua foto e os dados da sua CNH.">
      <form style={formPanelStyle} onSubmit={handleSubmit}>
        <AvatarPickerField
          photoUrl={resolveMediaUrl(form.photoDataUrl)}
          alt="Sua foto"
          loading={photoLoading}
          error={photoError}
          onSelect={async (file) => {
            if (!file) {
              setForm({ ...form, photoDataUrl: "" });
              return;
            }
            setPhotoLoading(true);
            setPhotoError("");
            try {
              const uploaded = await uploadMediaFile(file, "driver-photo");
              setForm({ ...form, photoDataUrl: uploaded.url });
            } catch (uploadError) {
              setPhotoError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar foto.");
            } finally {
              setPhotoLoading(false);
            }
          }}
        />
        <div style={formGridStyle}>
          <FormField label="CNH">
            <input
              style={formInputStyle}
              placeholder="Ex: 99887766554"
              value={form.cnh}
              maxLength={11}
              onChange={(event) =>
                setForm({ ...form, cnh: limitText(onlyDigits(event.target.value, 11), 11) })
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
              onChange={(event) => setForm({ ...form, cnhExpiresAt: event.target.value })}
            />
          </FormField>
        </div>
        {!driver.cnh ? (
          <p style={hintStyle}>Seus dados de CNH estão pendentes. Complete-os para liberar o histórico completo do seu perfil.</p>
        ) : null}
        {validationError ? <p style={errorStyle}>{validationError}</p> : null}
        {successMessage ? <p style={hintStyle}>{successMessage}</p> : null}
        {error ? <p style={errorStyle}>Falha ao salvar perfil.</p> : null}
        <button style={primarySubmitStyle} type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </AppShell>
  );
}

const mutedStyle: CSSProperties = {
  color: "#94a3b8"
};

const hintStyle: CSSProperties = {
  color: "#fbbf24",
  margin: 0
};

const errorStyle: CSSProperties = {
  color: "#fda4af",
  margin: 0
};
