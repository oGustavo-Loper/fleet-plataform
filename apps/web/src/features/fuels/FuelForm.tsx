import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { liveQuery } from "dexie";
import type { DriverListItem, FuelType, VehicleListItem } from "@fleet/shared-types";

import {
  FormField,
  formGridStyle,
  formInputStyle,
  formPanelStyle,
  primarySubmitStyle,
  secondaryActionStyle
} from "../../components/FormField";
import { FileUploadField } from "../../components/FileUploadField";
import { useAuth } from "../../contexts/AuthContext";
import { CREATE_FUEL_LOG_MUTATION, FUEL_LOGS_QUERY, VEHICLES_QUERY } from "../../lib/queries";
import { appendQueryListItem, upsertQueryListItem } from "../../lib/apollo-cache";
import { isBlank, parseNumber } from "../../lib/form-validation";
import { submitOrQueueOffline } from "../../lib/offline-submit";
import { getPendingMaxOdometerKm } from "../../lib/sync-manager";
import { formatPlate } from "../../lib/masks";
import { captureCurrentLocation, resolveMediaUrl, uploadMediaFile } from "../../lib/media";

type Props = {
  tenantId: string;
  vehicles: VehicleListItem[];
  drivers: DriverListItem[];
  assignedVehicleIds?: string[];
  allowAnyVehicle?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function FuelForm({
  tenantId,
  vehicles,
  drivers,
  assignedVehicleIds: assignedVehicleIdsOverride,
  allowAnyVehicle: allowAnyVehicleOverride,
  onDone,
  onCancel
}: Props) {
  const { auth } = useAuth();
  const isDriver = auth?.role === "DRIVER";
  const assignedVehicleIds = assignedVehicleIdsOverride ?? auth?.assignedVehicleIds ?? [];
  const canFuelAnyVehicle = allowAnyVehicleOverride ?? Boolean(auth?.allowAnyVehicle);
  const allowedVehicles = isDriver && !canFuelAnyVehicle
    ? vehicles.filter((vehicle) => assignedVehicleIds.includes(vehicle.id))
    : vehicles;
  const driverDefault = isDriver && auth?.driverId ? auth.driverId : "";
  const firstVehicle = allowedVehicles[0];
  const [form, setForm] = useState({
    vehicleId: firstVehicle?.id ?? "",
    driverId: driverDefault,
    fueledAt: new Date().toISOString().slice(0, 10),
    odometerKm: firstVehicle ? String(firstVehicle.currentKm + 1) : "",
    fuelType: (firstVehicle?.fuelType ?? "FLEX") as FuelType,
    liters: "",
    pricePerLiter: "",
    stationName: "",
    notes: "",
    receiptPhotoDataUrl: "",
    fuelingAddress: "",
    fuelingLatitude: null as number | null,
    fuelingLongitude: null as number | null
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [queuedMessage, setQueuedMessage] = useState("");

  const selectedVehicle = useMemo(
    () => allowedVehicles.find((vehicle) => vehicle.id === form.vehicleId),
    [allowedVehicles, form.vehicleId]
  );

  const [pendingMaxOdometer, setPendingMaxOdometer] = useState(0);

  useEffect(() => {
    if (!form.vehicleId) {
      setPendingMaxOdometer(0);
      return;
    }

    const subscription = liveQuery(() => getPendingMaxOdometerKm("fuelLog", form.vehicleId)).subscribe({
      next: setPendingMaxOdometer,
      error: () => setPendingMaxOdometer(0)
    });

    return () => subscription.unsubscribe();
  }, [form.vehicleId]);

  const effectiveCurrentKm = selectedVehicle
    ? Math.max(selectedVehicle.currentKm, pendingMaxOdometer)
    : 0;

  useEffect(() => {
    if (!allowedVehicles.length) {
      return;
    }

    setForm((current) => {
      const vehicleStillAllowed = allowedVehicles.some((vehicle) => vehicle.id === current.vehicleId);
      const nextVehicle = vehicleStillAllowed
        ? allowedVehicles.find((vehicle) => vehicle.id === current.vehicleId)
        : allowedVehicles[0];
      const nextDriverId = isDriver && auth?.driverId ? auth.driverId : current.driverId;

      if (
        current.vehicleId === nextVehicle?.id &&
        current.driverId === nextDriverId &&
        current.fuelType === nextVehicle?.fuelType
      ) {
        return current;
      }

      return {
        ...current,
        vehicleId: nextVehicle?.id ?? "",
        driverId: nextDriverId ?? "",
        fuelType: (nextVehicle?.fuelType ?? current.fuelType ?? "FLEX") as FuelType,
        odometerKm: nextVehicle ? String(nextVehicle.currentKm + 1) : current.odometerKm
      };
    });
  }, [allowedVehicles, auth?.driverId, isDriver]);

  const computedTotal = useMemo(() => {
    const liters = Number(form.liters);
    const pricePerLiter = Number(form.pricePerLiter);
    if (!Number.isFinite(liters) || !Number.isFinite(pricePerLiter)) {
      return 0;
    }
    return Number((liters * pricePerLiter).toFixed(2));
  }, [form.liters, form.pricePerLiter]);

  const computedDistance = useMemo(() => {
    const odometerKm = Number(form.odometerKm);
    if (!selectedVehicle || !Number.isFinite(odometerKm)) {
      return 0;
    }
    return Math.max(0, odometerKm - selectedVehicle.currentKm);
  }, [form.odometerKm, selectedVehicle]);

  const computedAverage = useMemo(() => {
    const liters = Number(form.liters);
    if (!computedDistance || !Number.isFinite(liters) || liters <= 0) {
      return 0;
    }
    return Number((computedDistance / liters).toFixed(2));
  }, [computedDistance, form.liters]);

  const [createFuelLog, { loading, error, reset: resetMutation }] = useMutation(CREATE_FUEL_LOG_MUTATION, {
    update(cache, { data }) {
      const fuelLog = data?.createFuelLog;
      if (!fuelLog) {
        return;
      }

      appendQueryListItem({
        cache,
        query: FUEL_LOGS_QUERY,
        variables: { tenantId },
        field: "fuelLogs",
        item: fuelLog
      });

      const currentVehicle = vehicles.find((vehicle) => vehicle.id === fuelLog.vehicleId);
      if (!currentVehicle) {
        return;
      }

      upsertQueryListItem({
        cache,
        query: VEHICLES_QUERY,
        variables: { tenantId },
        field: "vehicles",
        item: {
          ...currentVehicle,
          currentKm: fuelLog.odometerKm,
          fuelType: fuelLog.fuelType
        }
      });
    }
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    setQueuedMessage("");

    const vehicleId = form.vehicleId.trim();
    const fueledAt = form.fueledAt.trim();
    const odometerKm = parseNumber(form.odometerKm);
    const liters = parseNumber(form.liters);
    const pricePerLiter = parseNumber(form.pricePerLiter);
    const stationName = form.stationName.trim();
    const notes = form.notes.trim();
    const fuelingAddress = form.fuelingAddress.trim();

    if (isBlank(vehicleId)) {
      setValidationError("Selecione o veículo do abastecimento.");
      return;
    }

    if (isBlank(fueledAt)) {
      setValidationError("Informe a data do abastecimento.");
      return;
    }

    if (odometerKm === null || !Number.isInteger(odometerKm)) {
      setValidationError("Informe a quilometragem do abastecimento.");
      return;
    }

    if (selectedVehicle && odometerKm <= effectiveCurrentKm) {
      setValidationError(`A quilometragem deve ser maior que ${effectiveCurrentKm}.`);
      return;
    }

    if (liters === null || liters <= 0) {
      setValidationError("Informe uma quantidade de litros maior que zero.");
      return;
    }

    if (pricePerLiter === null || pricePerLiter <= 0) {
      setValidationError("Informe o valor por litro.");
      return;
    }

    if (isBlank(stationName)) {
      setValidationError("Informe o posto do abastecimento.");
      return;
    }

    const input = {
      tenantId,
      vehicleId,
      driverId: form.driverId || null,
      fueledAt,
      odometerKm,
      fuelType: form.fuelType,
      liters,
      totalCost: computedTotal,
      pricePerLiter,
      stationName,
      notes: notes || "",
      receiptPhotoDataUrl: form.receiptPhotoDataUrl,
      fuelingAddress: fuelingAddress || null,
      fuelingLatitude: form.fuelingLatitude,
      fuelingLongitude: form.fuelingLongitude
    };

    const { queued } = await submitOrQueueOffline({
      entity: "fuelLog",
      tenantId,
      payload: input,
      mutate: () => createFuelLog({ variables: { input } })
    });

    if (queued) {
      resetMutation();
      setQueuedMessage(
        "Sem conexão: abastecimento salvo neste dispositivo e será enviado quando a internet voltar."
      );
    }

    setForm({
      vehicleId: firstVehicle?.id ?? "",
      driverId: driverDefault,
      fueledAt: new Date().toISOString().slice(0, 10),
      odometerKm: firstVehicle ? String(firstVehicle.currentKm + 1) : "",
      fuelType: (firstVehicle?.fuelType ?? "FLEX") as FuelType,
      liters: "",
      pricePerLiter: "",
      stationName: "",
      notes: "",
      receiptPhotoDataUrl: "",
      fuelingAddress: "",
      fuelingLatitude: null,
      fuelingLongitude: null
    });

    if (!queued) {
      onDone?.();
    }
  }

  async function handleLocationCapture() {
    setLocationLoading(true);
    setLocationError("");
    try {
      const location = await captureCurrentLocation();
      setForm((current) => ({
        ...current,
        fuelingLatitude: location.latitude,
        fuelingLongitude: location.longitude,
        fuelingAddress: location.address
      }));
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : "Falha ao capturar localização.");
    } finally {
      setLocationLoading(false);
    }
  }

  return (
    <form style={{ ...formPanelStyle, ...drawerFormStyle }} onSubmit={handleSubmit}>
      <div style={{ ...formGridStyle, ...fuelFormGridStyle }}>
        <FormField label="Veículo">
          <select
            style={formInputStyle}
            value={form.vehicleId}
            disabled={isDriver && !canFuelAnyVehicle}
            onChange={(event) => {
              const vehicle = allowedVehicles.find((item) => item.id === event.target.value);
              setForm({
                ...form,
                vehicleId: event.target.value,
                fuelType: (vehicle?.fuelType ?? form.fuelType) as FuelType,
                odometerKm: vehicle ? String(vehicle.currentKm + 1) : form.odometerKm
              });
            }}
          >
            {allowedVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {formatPlate(vehicle.plate)} - {vehicle.model}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Motorista">
          <select
            style={formInputStyle}
            value={form.driverId}
            disabled={isDriver}
            onChange={(event) => setForm({ ...form, driverId: event.target.value })}
          >
            <option value="">Ex: Sem motorista</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.fullName}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Data do abastecimento">
          <input
            style={formInputStyle}
            type="date"
            placeholder="Ex: 2026-04-25"
            value={form.fueledAt}
            required
            onChange={(event) => setForm({ ...form, fueledAt: event.target.value })}
          />
        </FormField>
        <FormField label="Quilometragem">
          <input
            style={formInputStyle}
            type="number"
            min={selectedVehicle ? effectiveCurrentKm + 1 : 0}
            placeholder={
              selectedVehicle
                ? `Ex: ${effectiveCurrentKm + 1}`
                : "Ex: 45210"
            }
            value={form.odometerKm}
            required
            onChange={(event) => setForm({ ...form, odometerKm: event.target.value })}
          />
        </FormField>
        <FormField label="Tipo de combustível">
          <select
            style={formInputStyle}
            value={form.fuelType}
            onChange={(event) => setForm({ ...form, fuelType: event.target.value as FuelType })}
          >
            <option value="FLEX">Flex</option>
            <option value="GASOLINE">Gasolina</option>
            <option value="ETHANOL">Etanol</option>
            <option value="DIESEL">Diesel</option>
            <option value="ELECTRIC">Elétrico</option>
            <option value="HYBRID">Híbrido</option>
          </select>
        </FormField>
        <FormField label="Litros">
          <input
            style={formInputStyle}
            type="number"
            step="0.01"
            placeholder="Ex: 42.50"
            value={form.liters}
            min={0.01}
            required
            onChange={(event) => setForm({ ...form, liters: event.target.value })}
          />
        </FormField>
        <FormField label="Valor total">
          <input
            style={formInputStyle}
            type="number"
            step="0.01"
            readOnly
            placeholder="Ex: 249.90"
            value={computedTotal ? computedTotal.toFixed(2) : ""}
          />
        </FormField>
        <FormField label="Valor por litro">
          <input
            style={formInputStyle}
            type="number"
            step="0.01"
            placeholder="Ex: 5.88"
            value={form.pricePerLiter}
            min={0.01}
            required
            onChange={(event) => setForm({ ...form, pricePerLiter: event.target.value })}
          />
        </FormField>
        <FormField label="Posto">
          <input
            style={formInputStyle}
            placeholder="Ex: Posto Avenida"
            value={form.stationName}
            required
            onChange={(event) => setForm({ ...form, stationName: event.target.value })}
          />
        </FormField>
        <FormField label="Endereço do abastecimento">
          <input
            style={formInputStyle}
            placeholder="Ex: Avenida Paulista, 1000"
            value={form.fuelingAddress}
            onChange={(event) => setForm({ ...form, fuelingAddress: event.target.value })}
          />
          <div style={locationActionsStyle}>
            <button
              type="button"
              style={locationButtonStyle}
              onClick={handleLocationCapture}
              disabled={locationLoading}
            >
              {locationLoading ? "Capturando localização..." : "Capturar localização"}
            </button>
            {form.fuelingLatitude !== null && form.fuelingLongitude !== null ? (
              <span style={locationHintStyle}>
                {form.fuelingLatitude}, {form.fuelingLongitude}
              </span>
            ) : null}
          </div>
          {locationError ? <p style={locationErrorStyle}>{locationError}</p> : null}
        </FormField>
        <FileUploadField
          label="Comprovante de pagamento"
          accept="image/*"
          buttonLabel="Selecionar comprovante"
          hint={receiptLoading ? "Enviando comprovante..." : "Anexe uma foto ou captura do pagamento"}
          error={receiptError}
          loading={receiptLoading}
          previewUrl={resolveMediaUrl(form.receiptPhotoDataUrl)}
          previewAlt="Comprovante"
          onSelect={async (file) => {
            if (!file) {
              setForm({ ...form, receiptPhotoDataUrl: "" });
              return;
            }
            setReceiptLoading(true);
            setReceiptError("");
            try {
              const uploaded = await uploadMediaFile(file, "fuel-receipt");
              setForm({ ...form, receiptPhotoDataUrl: uploaded.url });
            } catch (uploadError) {
              setReceiptError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar comprovante.");
            } finally {
              setReceiptLoading(false);
            }
          }}
        />
        <FormField label="Observações" style={fullWidthFieldStyle}>
          <input
            style={formInputStyle}
            placeholder="Ex: Abastecimento de rotina"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </FormField>
      </div>
      {selectedVehicle ? (
        <div style={summaryCardStyle}>
          <p style={summaryTitleStyle}>Resumo do abastecimento</p>
          <div style={summaryGridStyle}>
            <div style={summaryItemStyle}>
              <span style={summaryLabelStyle}>Veículo</span>
              <strong style={summaryValueStyle}>
                {formatPlate(selectedVehicle.plate)} • {selectedVehicle.model}
              </strong>
            </div>
            <div style={summaryItemStyle}>
              <span style={summaryLabelStyle}>KM mínimo</span>
              <strong style={summaryValueStyle}>{effectiveCurrentKm + 1}</strong>
            </div>
            <div style={summaryItemStyle}>
              <span style={summaryLabelStyle}>Distância estimada</span>
              <strong style={summaryValueStyle}>
                {computedDistance > 0 ? `${computedDistance.toLocaleString("pt-BR")} km` : "—"}
              </strong>
            </div>
            <div style={summaryItemStyle}>
              <span style={summaryLabelStyle}>Consumo médio</span>
              <strong style={summaryValueStyle}>
                {computedAverage > 0 ? `${computedAverage.toFixed(2)} km/l` : "—"}
              </strong>
            </div>
            <div style={summaryItemStyle}>
              <span style={summaryLabelStyle}>Valor total</span>
              <strong style={summaryValueStyle}>
                {computedTotal > 0 ? formatCurrency(computedTotal) : "—"}
              </strong>
            </div>
          </div>
          {isDriver ? (
            <p style={summaryNoteStyle}>
              {canFuelAnyVehicle
                ? "Motorista com permissão para abastecer qualquer veículo."
                : "Motorista restrito ao veículo vinculado pela empresa."}
            </p>
          ) : null}
        </div>
      ) : null}
      {validationError ? (
        <p style={{ ...supportingPanelStyle, color: "#fda4af" }}>{validationError}</p>
      ) : null}
      {queuedMessage ? (
        <p style={{ ...supportingPanelStyle, color: "#fbbf24" }}>{queuedMessage}</p>
      ) : null}
      {error ? (
        <p style={{ ...supportingPanelStyle, color: "#fda4af" }}>
          Falha ao registrar abastecimento. {error.message}
        </p>
      ) : null}
      <div style={footerActionsStyle}>
        <button style={primarySubmitStyle} type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar abastecimento"}
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
  gap: "1.25rem",
  marginBottom: 0
};

const fuelFormGridStyle: CSSProperties = {
  columnGap: "1.5rem",
  rowGap: "1.4rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
};

const fullWidthFieldStyle: CSSProperties = {
  gridColumn: "1 / -1"
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
  color: "#94a3b8",
  lineHeight: 1.5
};

const summaryCardStyle: CSSProperties = {
  display: "grid",
  gap: "0.9rem",
  padding: "1.1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.55)",
  border: "1px solid rgba(251, 191, 36, 0.22)"
};

const summaryTitleStyle: CSSProperties = {
  margin: 0,
  color: "#fbbf24",
  fontSize: "0.82rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gap: "0.9rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))"
};

const summaryItemStyle: CSSProperties = {
  display: "grid",
  gap: "0.3rem"
};

const summaryLabelStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.82rem"
};

const summaryValueStyle: CSSProperties = {
  color: "#f8fafc",
  fontSize: "1rem"
};

const summaryNoteStyle: CSSProperties = {
  margin: 0,
  paddingTop: "0.6rem",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)",
  color: "#94a3b8",
  lineHeight: 1.5
};

const locationActionsStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  gap: "0.75rem",
  marginTop: "0.75rem"
};

const locationButtonStyle = {
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.8rem 0.95rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const locationHintStyle = {
  color: "#94a3b8"
};

const locationErrorStyle = {
  color: "#fda4af",
  margin: "0.5rem 0 0"
};

const footerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginTop: "1rem"
};
