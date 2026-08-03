import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { CenteredShell } from "../components/CenteredShell";
import { FormField, formInputStyle } from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import { apolloClient } from "../lib/apollo";
import { isBlank } from "../lib/form-validation";
import { CONFIRM_BILLING_PAYMENT_MUTATION } from "../lib/queries";

export function BillingCheckoutPage() {
  const navigate = useNavigate();
  const { auth, login } = useAuth();
  const [params] = useSearchParams();
  const tenantId = params.get("tenantId") ?? auth?.tenantId ?? "";
  const planCode = params.get("planCode") ?? "INDIVIDUAL_PRO";
  const customerName = params.get("customerName") ?? auth?.fullName ?? "Cliente";
  const [paymentId, setPaymentId] = useState("mp-demo-payment-001");
  const [validationError, setValidationError] = useState("");
  const [confirmPayment, { loading, error }] = useMutation(CONFIRM_BILLING_PAYMENT_MUTATION);
  const planLabel = useMemo(() => {
    if (planCode === "COMPANY_PRO") {
      return "Empresa Pro";
    }
    return "Plano Pro";
  }, [planCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const normalizedPaymentId = paymentId.trim();
    if (isBlank(normalizedPaymentId)) {
      setValidationError("Informe o ID do pagamento.");
      return;
    }

    const result = await confirmPayment({
      variables: {
        input: {
          tenantId,
          planCode,
          paymentId: normalizedPaymentId,
          status: "approved"
        }
      }
    });

    const tenant = result.data?.confirmBillingPayment;
    if (tenant && auth) {
      await apolloClient.clearStore();
      login({
        ...auth,
        tenantId: tenant.id,
        rememberMe: auth.rememberMe
      });
    }

    navigate("/dashboard");
  }

  return (
    <CenteredShell
      title="Checkout Hospedado"
      subtitle="Confirme o pagamento do plano para ativar a assinatura."
    >
      <form style={cardStyle} onSubmit={handleSubmit}>
        <p style={mutedStyle}>
          Cliente: <strong>{customerName}</strong>
        </p>
        <p style={mutedStyle}>
          Plano: <strong>{planLabel}</strong>
        </p>
        <FormField label="ID do pagamento">
          <input
            style={formInputStyle}
            placeholder="Ex: mp-demo-payment-001"
            value={paymentId}
            required
            onChange={(event) => setPaymentId(event.target.value)}
          />
        </FormField>
        <p style={hintStyle}>
          No ambiente real, o Mercado Pago confirma o pagamento via webhook. Aqui usamos esse fluxo
          para simular a confirmação local.
        </p>
        {validationError ? <p style={errorStyle}>{validationError}</p> : null}
        {error ? <p style={errorStyle}>Falha ao confirmar o pagamento.</p> : null}
        <button type="submit" className="btn-primary" style={buttonStyle} disabled={loading}>
          {loading ? "Confirmando..." : "Confirmar pagamento"}
        </button>
      </form>
    </CenteredShell>
  );
}

const cardStyle: CSSProperties = {
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

const mutedStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0
};

const hintStyle: CSSProperties = {
  color: "#94a3b8",
  margin: 0
};

const errorStyle: CSSProperties = {
  color: "#fda4af",
  margin: 0
};

const buttonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.95rem 1.2rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};
