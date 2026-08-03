import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useMutation } from "@apollo/client/react";
import type { AccountType, DriverEmploymentStatus, DriverListItem, VehicleListItem } from "@fleet/shared-types";

import {
  FormField,
  formGridStyle,
  formInputStyle,
  formPanelStyle,
  primarySubmitStyle,
  secondaryActionStyle
} from "../../components/FormField";
import { AvatarPickerField } from "../../components/AvatarPickerField";
import {
  CREATE_DRIVER_MUTATION,
  DRIVERS_QUERY,
  UPDATE_DRIVER_MUTATION
} from "../../lib/queries";
import { upsertQueryListItem } from "../../lib/apollo-cache";
import { hasExactDigits, hasMinDigits, isBlank } from "../../lib/form-validation";
import { formatCpf, formatPlate, limitText, onlyDigits } from "../../lib/masks";
import { resolveMediaUrl, uploadMediaFile } from "../../lib/media";
import { submitOrQueueOffline } from "../../lib/offline-submit";

function getInitialForm(driver?: DriverListItem | null) {
  return {
    fullName: driver?.fullName ?? "",
    cpf: driver?.cpf ?? "",
    registrationId: driver?.registrationId ?? "",
    cnh: driver?.cnh ?? "",
    cnhCategory: driver?.cnhCategory ?? "B",
    cnhExpiresAt: driver?.cnhExpiresAt ? driver.cnhExpiresAt.slice(0, 10) : "",
    loginEmail: driver?.loginEmail ?? "",
    assignedVehicleId: driver?.assignedVehicleIds?.[0] ?? "",
    allowAnyVehicle: Boolean(driver?.allowAnyVehicle),
    employmentStatus: driver?.employmentStatus ?? "ACTIVE",
    photoDataUrl: driver?.photoDataUrl ?? ""
  };
}

export function DriverForm({
  accountType,
  tenantId,
  vehicles,
  initialDriver,
  onDone,
  onCancel
}: {
  accountType: AccountType;
  tenantId: string;
  vehicles: VehicleListItem[];
  initialDriver?: DriverListItem | null;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const isCompany = accountType === "COMPANY";
  const isEditing = Boolean(initialDriver?.id);
  const [form, setForm] = useState(getInitialForm(initialDriver));
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [queuedMessage, setQueuedMessage] = useState("");

  useEffect(() => {
    setForm(getInitialForm(initialDriver));
  }, [initialDriver]);

  const [mutateDriver, { loading, error, reset: resetMutation }] = useMutation(
    isEditing ? UPDATE_DRIVER_MUTATION : CREATE_DRIVER_MUTATION,
    {
      update(cache, { data }) {
        const driver = data?.createDriver ?? data?.updateDriver;
        if (!driver) {
          return;
        }

        upsertQueryListItem({
          cache,
          query: DRIVERS_QUERY,
          variables: { tenantId },
          field: "drivers",
          item: driver
        });
      }
    }
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    setQueuedMessage("");

    const fullName = form.fullName.trim();
    const registrationId = form.registrationId.trim();
    const cnh = form.cnh.trim();
    const cnhExpiresAt = form.cnhExpiresAt.trim();
    const loginEmail = form.loginEmail.trim();
    const cpf = form.cpf.trim();

    if (isBlank(fullName)) {
      setValidationError("Informe o nome do motorista.");
      return;
    }

    if (isCompany) {
      if (isBlank(registrationId)) {
        setValidationError("Informe a matrícula do motorista.");
        return;
      }
    } else if (!hasMinDigits(cpf, 11)) {
      setValidationError("Informe um CPF válido.");
      return;
    }

    if (!hasExactDigits(cnh, 11)) {
      setValidationError("Informe uma CNH válida (11 dígitos).");
      return;
    }

    if (isBlank(cnhExpiresAt)) {
      setValidationError("Informe a validade da CNH.");
      return;
    }

    const baseInput = {
      fullName,
      cpf: isCompany ? undefined : cpf,
      registrationId: isCompany ? registrationId : undefined,
      cnh,
      cnhCategory: form.cnhCategory,
      cnhExpiresAt,
      loginEmail: loginEmail || undefined,
      assignedVehicleIds: form.assignedVehicleId ? [form.assignedVehicleId] : [],
      allowAnyVehicle: form.allowAnyVehicle,
      employmentStatus: form.employmentStatus,
      isActive: form.employmentStatus === "ACTIVE",
      photoDataUrl: form.photoDataUrl
    };

    if (isEditing) {
      await mutateDriver({
        variables: {
          input: {
            id: initialDriver?.id,
            ...baseInput
          }
        }
      });

      setForm(getInitialForm(null));
      onDone?.();
      return;
    }

    const input = {
      tenantId,
      ...baseInput
    };

    const { queued } = await submitOrQueueOffline({
      entity: "driver",
      tenantId,
      payload: input,
      mutate: () => mutateDriver({ variables: { input } })
    });

    if (queued) {
      resetMutation();
      setQueuedMessage(
        "Sem conexão: motorista salvo neste dispositivo e será enviado quando a internet voltar."
      );
    }

    setForm(getInitialForm(null));

    if (!queued) {
      onDone?.();
    }
  }

  return (
    <form style={formPanelStyle} onSubmit={handleSubmit}>
      <AvatarPickerField
        photoUrl={resolveMediaUrl(form.photoDataUrl)}
        alt="Foto do motorista"
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
        <FormField label="Nome do motorista">
          <input
            style={formInputStyle}
            placeholder="Ex: Carlos Almeida"
            value={form.fullName}
            required
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
          />
        </FormField>
        {isCompany ? (
          <FormField label="Matrícula">
            <input
              style={formInputStyle}
              placeholder="Ex: MT-1024"
              value={form.registrationId}
              maxLength={30}
              required
              onChange={(event) => setForm({ ...form, registrationId: limitText(event.target.value.toUpperCase(), 30) })}
            />
          </FormField>
        ) : (
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
        )}
        <FormField label="CNH">
          <input
            style={formInputStyle}
            placeholder="Ex: 99887766554"
            value={form.cnh}
            maxLength={11}
            required
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
            placeholder="Ex: 2027-08-10"
            value={form.cnhExpiresAt}
            required
            onChange={(event) => setForm({ ...form, cnhExpiresAt: event.target.value })}
          />
        </FormField>
        <FormField label="E-mail de login">
          <input
            style={formInputStyle}
            type="email"
            placeholder="Ex: carlos@fleet.local"
            value={form.loginEmail}
            onChange={(event) => setForm({ ...form, loginEmail: event.target.value })}
          />
        </FormField>
        <FormField label="Veículo vinculado">
          <select
            style={formInputStyle}
            value={form.assignedVehicleId}
            onChange={(event) => setForm({ ...form, assignedVehicleId: event.target.value })}
          >
            <option value="">Ex: Nenhum veículo fixo</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {formatPlate(vehicle.plate)} - {vehicle.model}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Status do motorista">
          <select
            style={formInputStyle}
            value={form.employmentStatus}
            onChange={(event) =>
              setForm({ ...form, employmentStatus: event.target.value as DriverEmploymentStatus })
            }
          >
            <option value="ACTIVE">Ativo</option>
            <option value="VACATION">Em férias</option>
            <option value="TERMINATED">Desligado</option>
          </select>
        </FormField>
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.7rem",
          marginTop: "1rem",
          color: "#cbd5e1"
        }}
      >
        <input
          type="checkbox"
          checked={form.allowAnyVehicle}
          onChange={(event) => setForm({ ...form, allowAnyVehicle: event.target.checked })}
        />
        Permitir abastecer qualquer veículo
      </label>
      <p style={{ color: "#94a3b8", marginBottom: 0, marginTop: "0.8rem" }}>
        Motoristas em férias ou desligados perdem o acesso ao sistema, mas o histórico permanece salvo.
      </p>
      {validationError ? <p style={{ color: "#fda4af" }}>{validationError}</p> : null}
      {queuedMessage ? <p style={{ color: "#fbbf24" }}>{queuedMessage}</p> : null}
      {error ? <p style={{ color: "#fda4af" }}>Falha ao salvar motorista.</p> : null}
      <div style={footerActionsStyle}>
        <button style={primarySubmitStyle} type="submit" disabled={loading}>
          {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar motorista"}
        </button>
        {onCancel ? (
          <button style={secondaryActionStyle} type="button" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}

const footerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginTop: "1rem"
};
