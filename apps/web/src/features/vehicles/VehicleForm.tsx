import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useMutation } from "@apollo/client/react";
import type {
  AccountType,
  FuelType,
  VehicleListItem,
  VehicleStatus,
  VehicleType
} from "@fleet/shared-types";

import {
  FormField,
  formGridStyle,
  formInputStyle,
  formPanelStyle,
  primarySubmitStyle,
  secondaryActionStyle
} from "../../components/FormField";
import {
  CREATE_VEHICLE_MUTATION,
  UPDATE_VEHICLE_MUTATION,
  VEHICLES_QUERY
} from "../../lib/queries";
import { upsertQueryListItem } from "../../lib/apollo-cache";
import { isBlank, parseNumber } from "../../lib/form-validation";
import { formatPlate } from "../../lib/masks";
import { submitOrQueueOffline } from "../../lib/offline-submit";

type Props = {
  tenantId: string;
  tenantName: string;
  tenantAccountType: AccountType;
  vehicleLimit?: number;
  vehicleCount: number;
  initialVehicle?: VehicleListItem | null;
  onDone?: () => void;
  onCancel?: () => void;
};

function getInitialForm(vehicle?: VehicleListItem | null) {
  return {
    plate: formatPlate(vehicle?.plate ?? ""),
    vehicleType: vehicle?.vehicleType ?? "CAR",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    year: String(vehicle?.year ?? new Date().getFullYear()),
    fuelType: vehicle?.fuelType ?? "FLEX",
    currentKm: String(vehicle?.currentKm ?? 0),
    ownerName: vehicle?.ownerName ?? "",
    companyName: "",
    status: vehicle?.status ?? "ACTIVE"
  };
}

export function VehicleForm({
  tenantId,
  tenantName,
  tenantAccountType,
  vehicleLimit,
  vehicleCount,
  initialVehicle,
  onDone,
  onCancel
}: Props) {
  const isEditing = Boolean(initialVehicle?.id);
  const [form, setForm] = useState(getInitialForm(initialVehicle));
  const [validationError, setValidationError] = useState("");
  const [queuedMessage, setQueuedMessage] = useState("");

  useEffect(() => {
    setForm(getInitialForm(initialVehicle));
  }, [initialVehicle]);

  const [mutateVehicle, { loading, error, reset: resetMutation }] = useMutation(
    isEditing ? UPDATE_VEHICLE_MUTATION : CREATE_VEHICLE_MUTATION,
    {
      update(cache, { data }) {
        const vehicle = data?.createVehicle ?? data?.updateVehicle;
        if (!vehicle) {
          return;
        }

        upsertQueryListItem({
          cache,
          query: VEHICLES_QUERY,
          variables: { tenantId },
          field: "vehicles",
          item: {
            ...vehicle,
            year: Number(form.year),
            fuelType: form.fuelType,
            ownerName: tenantAccountType === "INDIVIDUAL" ? tenantName : form.ownerName
          }
        });
      }
    }
  );

  const limitReached =
    tenantAccountType === "INDIVIDUAL" &&
    vehicleLimit !== undefined &&
    vehicleCount >= vehicleLimit &&
    !isEditing;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    setQueuedMessage("");

    if (limitReached) {
      return;
    }

    const plate = form.plate.trim();
    const plateDigits = plate.replace(/\s/g, "");
    const brand = form.brand.trim();
    const model = form.model.trim();
    const year = parseNumber(form.year);
    const currentKm = parseNumber(form.currentKm);
    const ownerName =
      tenantAccountType === "INDIVIDUAL" ? tenantName.trim() : form.ownerName.trim();
    const companyName = form.companyName.trim();

    if (isBlank(plate) || plateDigits.length < 7) {
      setValidationError("Informe uma placa válida.");
      return;
    }

    if (isBlank(brand)) {
      setValidationError("Informe a marca do veículo.");
      return;
    }

    if (isBlank(model)) {
      setValidationError("Informe o modelo do veículo.");
      return;
    }

    if (!Number.isInteger(year) || (year ?? 0) < 1900) {
      setValidationError("Informe um ano válido.");
      return;
    }

    if (currentKm === null || currentKm < 0) {
      setValidationError("Informe a quilometragem atual do veículo.");
      return;
    }

    if (tenantAccountType !== "INDIVIDUAL" && isBlank(ownerName)) {
      setValidationError("Informe o proprietário do veículo.");
      return;
    }

    if (isEditing) {
      await mutateVehicle({
        variables: {
          input: {
            id: initialVehicle?.id,
            plate,
            vehicleType: form.vehicleType,
            brand,
            model,
            year: Number(year),
            fuelType: form.fuelType,
            currentKm: Number(currentKm),
            ownerName,
            companyName,
            status: form.status
          }
        }
      });

      setForm(getInitialForm(null));
      onDone?.();
      return;
    }

    const input = {
      tenantId,
      plate,
      vehicleType: form.vehicleType,
      brand,
      model,
      year: Number(year),
      fuelType: form.fuelType,
      currentKm: Number(currentKm),
      ownerName,
      companyName,
      status: form.status
    };

    const { queued } = await submitOrQueueOffline({
      entity: "vehicle",
      tenantId,
      payload: input,
      mutate: () => mutateVehicle({ variables: { input } })
    });

    if (queued) {
      resetMutation();
      setQueuedMessage(
        "Sem conexão: veículo salvo neste dispositivo e será enviado quando a internet voltar."
      );
    }

    setForm(getInitialForm(null));

    if (!queued) {
      onDone?.();
    }
  }

  return (
    <form style={{ ...formPanelStyle, ...drawerFormStyle }} onSubmit={handleSubmit}>
      <div style={formGridStyle}>
        <FormField label="Placa">
          <input
            style={formInputStyle}
            placeholder="Ex: ISH 2C08"
            value={form.plate}
            required
            onChange={(event) => setForm({ ...form, plate: formatPlate(event.target.value) })}
          />
        </FormField>
        <FormField label="Tipo de veículo">
          <select
            style={formInputStyle}
            value={form.vehicleType}
            onChange={(event) =>
              setForm({ ...form, vehicleType: event.target.value as VehicleType })
            }
          >
            <option value="CAR">Carro</option>
            <option value="MOTORCYCLE">Moto</option>
            <option value="TRUCK">Caminhão</option>
            <option value="BUS">Ônibus</option>
          </select>
        </FormField>
        <FormField label="Marca">
          <input
            style={formInputStyle}
            placeholder="Ex: Fiat"
            value={form.brand}
            required
            onChange={(event) => setForm({ ...form, brand: event.target.value })}
          />
        </FormField>
        <FormField label="Modelo">
          <input
            style={formInputStyle}
            placeholder="Ex: Strada"
            value={form.model}
            required
            onChange={(event) => setForm({ ...form, model: event.target.value })}
          />
        </FormField>
        <FormField label="Ano">
          <input
            style={formInputStyle}
            type="number"
            placeholder="Ex: 2024"
            value={form.year}
            min={1900}
            required
            onChange={(event) => setForm({ ...form, year: event.target.value })}
          />
        </FormField>
        <FormField label="Tipo de combustível">
          <select
            style={formInputStyle}
            value={form.fuelType}
            onChange={(event) =>
              setForm({ ...form, fuelType: event.target.value as FuelType })
            }
          >
            <option value="FLEX">Flex</option>
            <option value="GASOLINE">Gasolina</option>
            <option value="ETHANOL">Etanol</option>
            <option value="DIESEL">Diesel</option>
            <option value="ELECTRIC">Elétrico</option>
            <option value="HYBRID">Híbrido</option>
          </select>
        </FormField>
        <FormField label="KM atual">
          <input
            style={formInputStyle}
            type="number"
            placeholder="Ex: 45210"
            value={form.currentKm}
            min={0}
            required
            onChange={(event) => setForm({ ...form, currentKm: event.target.value })}
          />
        </FormField>
        {tenantAccountType === "INDIVIDUAL" ? null : (
          <FormField label="Proprietário">
            <input
              style={formInputStyle}
              placeholder="Ex: Transportes Sol"
              value={form.ownerName}
              required
              onChange={(event) => setForm({ ...form, ownerName: event.target.value })}
            />
          </FormField>
        )}
        <FormField label="Status do veículo">
          <select
            style={formInputStyle}
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as VehicleStatus })
            }
          >
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="MAINTENANCE">Manutenção</option>
            <option value="SOLD">Vendido</option>
          </select>
        </FormField>
      </div>
      {tenantAccountType === "INDIVIDUAL" ? (
        <p style={{ ...supportingPanelStyle, color: limitReached ? "#fda4af" : "#94a3b8" }}>
          Conta pessoa física: limite atual de {vehicleLimit ?? "veículos ilimitados"}. Para
          adicionar além disso, será necessário assinar um plano pago.
        </p>
      ) : null}
      {validationError ? (
        <p style={{ ...supportingPanelStyle, color: "#fda4af" }}>{validationError}</p>
      ) : null}
      {queuedMessage ? (
        <p style={{ ...supportingPanelStyle, color: "#fbbf24" }}>{queuedMessage}</p>
      ) : null}
      {error ? <p style={{ ...supportingPanelStyle, color: "#fda4af" }}>Falha ao salvar veículo.</p> : null}
      <div style={footerActionsStyle}>
        <button style={primarySubmitStyle} type="submit" disabled={loading || limitReached}>
          {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar veículo"}
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

const drawerFormStyle: CSSProperties = {
  display: "grid",
  gap: "1rem",
  marginBottom: 0
};

const helperTextStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  lineHeight: 1.5
};

const supportingPanelStyle: CSSProperties = {
  margin: 0,
  padding: "0.95rem 1rem",
  borderRadius: "0.95rem",
  background: "rgba(15, 23, 42, 0.46)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  lineHeight: 1.5
};

const footerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginTop: "1rem"
};
