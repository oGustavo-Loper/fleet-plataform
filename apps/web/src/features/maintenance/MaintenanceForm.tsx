import { useMutation } from "@apollo/client/react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { liveQuery } from "dexie";
import type { VehicleListItem } from "@fleet/shared-types";

import {
  FormField,
  formGridStyle,
  formInputStyle,
  formPanelStyle,
  primarySubmitStyle,
  secondaryActionStyle
} from "../../components/FormField";
import { useAuth } from "../../contexts/AuthContext";
import { CREATE_MAINTENANCE_MUTATION, MAINTENANCE_LOGS_QUERY } from "../../lib/queries";
import { appendQueryListItem } from "../../lib/apollo-cache";
import { isBlank, parseNumber } from "../../lib/form-validation";
import { formatPlate } from "../../lib/masks";
import { submitOrQueueOffline } from "../../lib/offline-submit";
import { getPendingMaxOdometerKm } from "../../lib/sync-manager";

function getAutoTitle(type: string) {
  const titles: Record<string, string> = {
    PREVENTIVE: "Manutenção preventiva",
    CORRECTIVE: "Manutenção corretiva",
    OIL_CHANGE: "Troca de óleo",
    BRAKES: "Serviço de freios",
    TIRES: "Troca de pneus",
    BATTERY: "Troca de bateria",
    BELTS: "Troca de correias",
    OTHER_PARTS: "Troca de peças"
  };

  return titles[type] ?? "Manutenção";
}

export function MaintenanceForm({
  tenantId,
  vehicles,
  assignedVehicleIds: assignedVehicleIdsOverride,
  allowAnyVehicle: allowAnyVehicleOverride,
  onDone,
  onCancel
}: {
  tenantId: string;
  vehicles: VehicleListItem[];
  assignedVehicleIds?: string[];
  allowAnyVehicle?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const { auth } = useAuth();
  const isDriver = auth?.role === "DRIVER";
  const assignedVehicleIds = assignedVehicleIdsOverride ?? auth?.assignedVehicleIds ?? [];
  const canMaintainAnyVehicle = allowAnyVehicleOverride ?? Boolean(auth?.allowAnyVehicle);
  const allowedVehicles = useMemo(
    () =>
      isDriver && !canMaintainAnyVehicle
        ? vehicles.filter((vehicle) => assignedVehicleIds.includes(vehicle.id))
        : vehicles,
    [assignedVehicleIds, canMaintainAnyVehicle, isDriver, vehicles]
  );
  const firstVehicle = allowedVehicles[0];
  const [form, setForm] = useState({
    vehicleId: firstVehicle?.id ?? "",
    title: "",
    maintenanceType: "PREVENTIVE",
    performedAt: new Date().toISOString().slice(0, 10),
    odometerKm: firstVehicle ? String(firstVehicle.currentKm + 1) : "",
    totalCost: "",
    supplierName: "",
    notes: "",
    nextMaintenanceAt: "",
    nextMaintenanceKm: "",
    oilType: "",
    oilBrand: "",
    oilCost: "",
    previousOilChangeAt: "",
    previousOilChangeKm: "",
    previousOilChangeNotes: "",
    changedOilFilter: false,
    changedAirFilter: false,
    changedFuelFilter: false,
    tireBrand: "",
    tireQuantity: "",
    tireUnitCost: "",
    batteryBrand: "",
    batteryCost: "",
    batteryVoltage: "",
    brakeService: "",
    beltChanged: false,
    partName: "",
    partBrand: "",
    partCost: ""
  });
  const [validationError, setValidationError] = useState("");
  const [queuedMessage, setQueuedMessage] = useState("");

  useEffect(() => {
    if (!allowedVehicles.length) {
      return;
    }

    setForm((current) => {
      const vehicleStillAllowed = allowedVehicles.some((vehicle) => vehicle.id === current.vehicleId);
      if (vehicleStillAllowed) {
        return current;
      }

      return {
        ...current,
        vehicleId: allowedVehicles[0]?.id ?? "",
        odometerKm: allowedVehicles[0] ? String(allowedVehicles[0].currentKm + 1) : ""
      };
    });
  }, [allowedVehicles]);

  const selectedVehicle = allowedVehicles.find((vehicle) => vehicle.id === form.vehicleId);

  const [pendingMaxOdometer, setPendingMaxOdometer] = useState(0);

  useEffect(() => {
    if (!form.vehicleId) {
      setPendingMaxOdometer(0);
      return;
    }

    const subscription = liveQuery(() => getPendingMaxOdometerKm("maintenance", form.vehicleId)).subscribe({
      next: setPendingMaxOdometer,
      error: () => setPendingMaxOdometer(0)
    });

    return () => subscription.unsubscribe();
  }, [form.vehicleId]);

  const effectiveCurrentKm = selectedVehicle
    ? Math.max(selectedVehicle.currentKm, pendingMaxOdometer)
    : 0;

  const computedTotal = useMemo(() => {
    if (form.maintenanceType === "OIL_CHANGE") {
      return Number(form.oilCost || 0);
    }
    if (form.maintenanceType === "TIRES") {
      return Number(form.tireQuantity || 0) * Number(form.tireUnitCost || 0);
    }
    if (form.maintenanceType === "BATTERY") {
      return Number(form.batteryCost || 0);
    }
    if (form.maintenanceType === "OTHER_PARTS") {
      return Number(form.partCost || 0);
    }
    return Number(form.totalCost || 0);
  }, [
    form.batteryCost,
    form.maintenanceType,
    form.oilCost,
    form.partCost,
    form.tireQuantity,
    form.tireUnitCost,
    form.totalCost
  ]);

  useEffect(() => {
    setForm((current) => {
      const suggestedTitle = getAutoTitle(current.maintenanceType);
      if (current.title && current.title !== getAutoTitle(current.maintenanceType)) {
        return current;
      }

      return {
        ...current,
        title: suggestedTitle
      };
    });
  }, [form.maintenanceType]);

  const [createMaintenance, { loading, error, reset: resetMutation }] = useMutation(CREATE_MAINTENANCE_MUTATION, {
    update(cache, { data }) {
      const maintenance = data?.createMaintenance;
      if (!maintenance) {
        return;
      }

      appendQueryListItem({
        cache,
        query: MAINTENANCE_LOGS_QUERY,
        variables: { tenantId },
        field: "maintenanceLogs",
        item: maintenance
      });
    }
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    setQueuedMessage("");

    const vehicleId = form.vehicleId.trim();
    const title = form.title.trim();
    const performedAt = form.performedAt.trim();
    const supplierName = form.supplierName.trim();
    const notes = form.notes.trim();
    const odometerKm = parseNumber(form.odometerKm);
    const totalCost = Number(computedTotal.toFixed(2));

    if (isBlank(vehicleId)) {
      setValidationError("Selecione o veículo da manutenção.");
      return;
    }

    if (isBlank(title)) {
      setValidationError("Informe o título da manutenção.");
      return;
    }

    if (isBlank(performedAt)) {
      setValidationError("Informe a data da manutenção.");
      return;
    }

    if (odometerKm === null || !Number.isInteger(odometerKm)) {
      setValidationError("Informe a quilometragem da manutenção.");
      return;
    }

    if (selectedVehicle && odometerKm <= effectiveCurrentKm) {
      setValidationError(`A quilometragem deve ser maior que ${effectiveCurrentKm}.`);
      return;
    }

    if (totalCost <= 0) {
      setValidationError("Informe o valor gasto da manutenção.");
      return;
    }

    if (form.maintenanceType === "OIL_CHANGE") {
      if (isBlank(form.oilType) || isBlank(form.oilBrand) || (parseNumber(form.oilCost) ?? 0) <= 0) {
        setValidationError("Preencha os detalhes da troca de óleo.");
        return;
      }
    }

    if (form.maintenanceType === "TIRES") {
      if (
        isBlank(form.tireBrand) ||
        (parseNumber(form.tireQuantity) ?? 0) <= 0 ||
        (parseNumber(form.tireUnitCost) ?? 0) <= 0
      ) {
        setValidationError("Preencha os detalhes dos pneus.");
        return;
      }
    }

    if (form.maintenanceType === "BATTERY") {
      if (
        isBlank(form.batteryBrand) ||
        isBlank(form.batteryVoltage) ||
        (parseNumber(form.batteryCost) ?? 0) <= 0
      ) {
        setValidationError("Preencha os detalhes da bateria.");
        return;
      }
    }

    if (form.maintenanceType === "BRAKES" && isBlank(form.brakeService)) {
      setValidationError("Descreva o serviço realizado nos freios.");
      return;
    }

    if (form.maintenanceType === "OTHER_PARTS") {
      if (
        isBlank(form.partName) ||
        isBlank(form.partBrand) ||
        (parseNumber(form.partCost) ?? 0) <= 0
      ) {
        setValidationError("Preencha os detalhes da peça.");
        return;
      }
    }

    const input = {
      tenantId,
      vehicleId,
      title,
      maintenanceType: form.maintenanceType,
      performedAt,
      odometerKm,
      totalCost,
      supplierName: supplierName || "",
      notes: notes || "",
      nextMaintenanceAt: form.nextMaintenanceAt || null,
      nextMaintenanceKm: form.nextMaintenanceKm ? Number(form.nextMaintenanceKm) : null,
      oilType: form.oilType || null,
      oilBrand: form.oilBrand || null,
      oilCost: form.oilCost ? Number(form.oilCost) : null,
      previousOilChangeAt: form.previousOilChangeAt || null,
      previousOilChangeKm: form.previousOilChangeKm ? Number(form.previousOilChangeKm) : null,
      previousOilChangeNotes: form.previousOilChangeNotes || null,
      changedOilFilter: form.changedOilFilter,
      changedAirFilter: form.changedAirFilter,
      changedFuelFilter: form.changedFuelFilter,
      tireBrand: form.tireBrand || null,
      tireQuantity: form.tireQuantity ? Number(form.tireQuantity) : null,
      tireUnitCost: form.tireUnitCost ? Number(form.tireUnitCost) : null,
      batteryBrand: form.batteryBrand || null,
      batteryCost: form.batteryCost ? Number(form.batteryCost) : null,
      batteryVoltage: form.batteryVoltage || null,
      brakeService: form.brakeService || null,
      beltChanged: form.beltChanged,
      partName: form.partName || null,
      partBrand: form.partBrand || null,
      partCost: form.partCost ? Number(form.partCost) : null
    };

    const { queued } = await submitOrQueueOffline({
      entity: "maintenance",
      tenantId,
      payload: input,
      mutate: () => createMaintenance({ variables: { input } })
    });

    if (queued) {
      resetMutation();
      setQueuedMessage(
        "Sem conexão: manutenção salva neste dispositivo e será enviada quando a internet voltar."
      );
    }

    setForm({
      vehicleId: firstVehicle?.id ?? "",
      title: "",
      maintenanceType: "PREVENTIVE",
      performedAt: new Date().toISOString().slice(0, 10),
      odometerKm: firstVehicle ? String(firstVehicle.currentKm + 1) : "",
      totalCost: "",
      supplierName: "",
      notes: "",
      nextMaintenanceAt: "",
      nextMaintenanceKm: "",
      oilType: "",
      oilBrand: "",
      oilCost: "",
      previousOilChangeAt: "",
      previousOilChangeKm: "",
      previousOilChangeNotes: "",
      changedOilFilter: false,
      changedAirFilter: false,
      changedFuelFilter: false,
      tireBrand: "",
      tireQuantity: "",
      tireUnitCost: "",
      batteryBrand: "",
      batteryCost: "",
      batteryVoltage: "",
      brakeService: "",
      beltChanged: false,
      partName: "",
      partBrand: "",
      partCost: ""
    });

    if (!queued) {
      onDone?.();
    }
  }

  if (!allowedVehicles.length) {
    return (
      <section style={formPanelStyle}>
        <h2 style={{ marginTop: 0 }}>Nova manutenção</h2>
        <p style={{ color: "#94a3b8", marginBottom: 0 }}>
          Nenhum veículo está liberado para este perfil no momento. Peça à empresa para vincular um
          veículo ou liberar acesso completo.
        </p>
        {onCancel ? (
          <button style={secondaryActionStyle} type="button" onClick={onCancel}>
            Fechar
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <form style={formPanelStyle} onSubmit={handleSubmit}>
      <h2 style={{ marginTop: 0 }}>Nova manutenção</h2>
      <div style={formGridStyle}>
        <FormField label="Veículo">
          <select
            style={formInputStyle}
            disabled={isDriver && !canMaintainAnyVehicle}
            value={form.vehicleId}
            onChange={(event) => {
              const vehicle = allowedVehicles.find((item) => item.id === event.target.value);
              setForm({
                ...form,
                vehicleId: event.target.value,
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
        <FormField label="Tipo de manutenção">
          <select
            style={formInputStyle}
            value={form.maintenanceType}
            onChange={(event) =>
              setForm({
                ...form,
                maintenanceType: event.target.value,
                title: getAutoTitle(event.target.value)
              })
            }
          >
            <option value="PREVENTIVE">Preventiva</option>
            <option value="CORRECTIVE">Corretiva</option>
            <option value="OIL_CHANGE">Troca de óleo</option>
            <option value="BRAKES">Freios</option>
            <option value="TIRES">Pneus</option>
            <option value="BATTERY">Bateria</option>
            <option value="BELTS">Correias</option>
            <option value="OTHER_PARTS">Outras peças</option>
          </select>
        </FormField>
        <FormField label="Título">
          <input
            style={formInputStyle}
            placeholder="Ex: Troca de óleo"
            value={form.title}
            required
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </FormField>
        <FormField label="Data da manutenção">
          <input
            style={formInputStyle}
            type="date"
            value={form.performedAt}
            required
            onChange={(event) => setForm({ ...form, performedAt: event.target.value })}
          />
        </FormField>
        <FormField label="Quilometragem">
          <input
            style={formInputStyle}
            type="number"
            min={selectedVehicle ? effectiveCurrentKm + 1 : 0}
            placeholder={
              selectedVehicle ? `Ex: ${effectiveCurrentKm + 1}` : "Ex: 45211"
            }
            value={form.odometerKm}
            required
            onChange={(event) => setForm({ ...form, odometerKm: event.target.value })}
          />
        </FormField>
        <FormField label="Valor gasto">
          <input
            style={formInputStyle}
            type="number"
            step="0.01"
            placeholder="Ex: 320.00"
            value={computedTotal ? computedTotal.toFixed(2) : form.totalCost}
            readOnly={["OIL_CHANGE", "TIRES", "BATTERY", "OTHER_PARTS"].includes(form.maintenanceType)}
            min={0}
            onChange={(event) => setForm({ ...form, totalCost: event.target.value })}
          />
        </FormField>
        <FormField label="Oficina / fornecedor">
          <input
            style={formInputStyle}
            placeholder="Ex: Oficina Central"
            value={form.supplierName}
            onChange={(event) => setForm({ ...form, supplierName: event.target.value })}
          />
        </FormField>
        <FormField label="Próxima manutenção por data">
          <input
            style={formInputStyle}
            type="date"
            value={form.nextMaintenanceAt}
            onChange={(event) => setForm({ ...form, nextMaintenanceAt: event.target.value })}
          />
        </FormField>
        <FormField label="Próxima manutenção por KM">
          <input
            style={formInputStyle}
            type="number"
            placeholder="Ex: 50000"
            value={form.nextMaintenanceKm}
            onChange={(event) => setForm({ ...form, nextMaintenanceKm: event.target.value })}
          />
        </FormField>
        <FormField label="Observações">
          <input
            style={formInputStyle}
            placeholder="Ex: Troca de óleo e filtro"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </FormField>
      </div>
      {form.maintenanceType === "OIL_CHANGE" ? (
        <div style={dynamicPanelStyle}>
          <h3 style={dynamicTitleStyle}>Detalhes da troca de óleo</h3>
          <div style={formGridStyle}>
            <FormField label="Tipo do óleo">
              <input
                style={formInputStyle}
                placeholder="Ex: 5W30 sintético"
                value={form.oilType}
                onChange={(event) => setForm({ ...form, oilType: event.target.value })}
              />
            </FormField>
            <FormField label="Marca do óleo">
              <input
                style={formInputStyle}
                placeholder="Ex: Shell Helix"
                value={form.oilBrand}
                onChange={(event) => setForm({ ...form, oilBrand: event.target.value })}
              />
            </FormField>
            <FormField label="Valor do óleo">
              <input
                style={formInputStyle}
                type="number"
                step="0.01"
                placeholder="Ex: 220.00"
                value={form.oilCost}
                onChange={(event) => setForm({ ...form, oilCost: event.target.value })}
              />
            </FormField>
            <FormField label="Última troca de óleo">
              <input
                style={formInputStyle}
                type="date"
                value={form.previousOilChangeAt}
                onChange={(event) =>
                  setForm({ ...form, previousOilChangeAt: event.target.value })
                }
              />
            </FormField>
            <FormField label="KM da última troca">
              <input
                style={formInputStyle}
                type="number"
                placeholder="Ex: 43000"
                value={form.previousOilChangeKm}
                onChange={(event) =>
                  setForm({ ...form, previousOilChangeKm: event.target.value })
                }
              />
            </FormField>
            <FormField label="Histórico da última troca">
              <input
                style={formInputStyle}
                placeholder="Ex: Troca realizada antes do sistema"
                value={form.previousOilChangeNotes}
                onChange={(event) =>
                  setForm({ ...form, previousOilChangeNotes: event.target.value })
                }
              />
            </FormField>
          </div>
          <div style={checkboxRowStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={form.changedOilFilter}
                onChange={(event) => setForm({ ...form, changedOilFilter: event.target.checked })}
              />
              Filtro de óleo trocado
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={form.changedAirFilter}
                onChange={(event) => setForm({ ...form, changedAirFilter: event.target.checked })}
              />
              Filtro de ar trocado
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={form.changedFuelFilter}
                onChange={(event) => setForm({ ...form, changedFuelFilter: event.target.checked })}
              />
              Filtro de combustível trocado
            </label>
          </div>
        </div>
      ) : null}
      {form.maintenanceType === "TIRES" ? (
        <div style={dynamicPanelStyle}>
          <h3 style={dynamicTitleStyle}>Detalhes dos pneus</h3>
          <div style={formGridStyle}>
            <FormField label="Marca do pneu">
              <input
                style={formInputStyle}
                placeholder="Ex: Michelin"
                value={form.tireBrand}
                onChange={(event) => setForm({ ...form, tireBrand: event.target.value })}
              />
            </FormField>
            <FormField label="Quantidade de pneus">
              <input
                style={formInputStyle}
                type="number"
                placeholder="Ex: 2"
                value={form.tireQuantity}
                onChange={(event) => setForm({ ...form, tireQuantity: event.target.value })}
              />
            </FormField>
            <FormField label="Valor unitário do pneu">
              <input
                style={formInputStyle}
                type="number"
                step="0.01"
                placeholder="Ex: 480.00"
                value={form.tireUnitCost}
                onChange={(event) => setForm({ ...form, tireUnitCost: event.target.value })}
              />
            </FormField>
          </div>
        </div>
      ) : null}
      {form.maintenanceType === "BATTERY" ? (
        <div style={dynamicPanelStyle}>
          <h3 style={dynamicTitleStyle}>Detalhes da bateria</h3>
          <div style={formGridStyle}>
            <FormField label="Marca da bateria">
              <input
                style={formInputStyle}
                placeholder="Ex: Moura"
                value={form.batteryBrand}
                onChange={(event) => setForm({ ...form, batteryBrand: event.target.value })}
              />
            </FormField>
            <FormField label="Voltagem">
              <input
                style={formInputStyle}
                placeholder="Ex: 12V"
                value={form.batteryVoltage}
                onChange={(event) => setForm({ ...form, batteryVoltage: event.target.value })}
              />
            </FormField>
            <FormField label="Valor da bateria">
              <input
                style={formInputStyle}
                type="number"
                step="0.01"
                placeholder="Ex: 650.00"
                value={form.batteryCost}
                onChange={(event) => setForm({ ...form, batteryCost: event.target.value })}
              />
            </FormField>
          </div>
        </div>
      ) : null}
      {form.maintenanceType === "BRAKES" ? (
        <div style={dynamicPanelStyle}>
          <h3 style={dynamicTitleStyle}>Detalhes dos freios</h3>
          <FormField label="Serviço realizado">
            <input
              style={formInputStyle}
              placeholder="Ex: Troca de pastilhas dianteiras"
              value={form.brakeService}
              onChange={(event) => setForm({ ...form, brakeService: event.target.value })}
            />
          </FormField>
        </div>
      ) : null}
      {form.maintenanceType === "BELTS" ? (
        <div style={dynamicPanelStyle}>
          <h3 style={dynamicTitleStyle}>Detalhes das correias</h3>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={form.beltChanged}
              onChange={(event) => setForm({ ...form, beltChanged: event.target.checked })}
            />
            Correia trocada nesta manutenção
          </label>
        </div>
      ) : null}
      {form.maintenanceType === "OTHER_PARTS" ? (
        <div style={dynamicPanelStyle}>
          <h3 style={dynamicTitleStyle}>Detalhes da peça</h3>
          <div style={formGridStyle}>
            <FormField label="Nome da peça">
              <input
                style={formInputStyle}
                placeholder="Ex: Amortecedor dianteiro"
                value={form.partName}
                onChange={(event) => setForm({ ...form, partName: event.target.value })}
              />
            </FormField>
            <FormField label="Marca da peça">
              <input
                style={formInputStyle}
                placeholder="Ex: Cofap"
                value={form.partBrand}
                onChange={(event) => setForm({ ...form, partBrand: event.target.value })}
              />
            </FormField>
            <FormField label="Valor da peça">
              <input
                style={formInputStyle}
                type="number"
                step="0.01"
                placeholder="Ex: 390.00"
                value={form.partCost}
                onChange={(event) => setForm({ ...form, partCost: event.target.value })}
              />
            </FormField>
          </div>
        </div>
      ) : null}
      {selectedVehicle ? (
        <p style={{ color: "#94a3b8", marginBottom: 0 }}>
          Veículo selecionado: {formatPlate(selectedVehicle.plate)} • {selectedVehicle.model} • KM mínimo{" "}
          {effectiveCurrentKm + 1}
        </p>
      ) : null}
      {isDriver ? (
        <p style={{ color: "#94a3b8", marginBottom: 0 }}>
          {canMaintainAnyVehicle
            ? "Motorista com permissão para registrar manutenção em qualquer veículo."
            : "Motorista restrito ao veículo vinculado pela empresa."}
        </p>
      ) : null}
      {validationError ? <p style={{ color: "#fda4af" }}>{validationError}</p> : null}
      {queuedMessage ? <p style={{ color: "#fbbf24" }}>{queuedMessage}</p> : null}
      {error ? <p style={{ color: "#fda4af" }}>Falha ao registrar manutenção.</p> : null}
      <div style={actionsRowStyle}>
        <button style={primarySubmitStyle} type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar manutenção"}
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

const dynamicPanelStyle = {
  marginTop: "1rem",
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.52)",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const dynamicTitleStyle = {
  marginTop: 0,
  marginBottom: "1rem"
};

const checkboxRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "0.9rem",
  marginTop: "1rem"
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
  color: "#cbd5e1"
};

const actionsRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "0.75rem",
  marginTop: "0.5rem"
};
