import type { CSSProperties } from "react";
import { useMutation } from "@apollo/client/react";
import { Link, useNavigate } from "react-router-dom";

import { CenteredShell } from "../components/CenteredShell";
import { useAuth } from "../contexts/AuthContext";
import { useTenant } from "../hooks/useTenant";
import { upsertQueryListItem } from "../lib/apollo-cache";
import {
  CREATE_CHECKOUT_SESSION_MUTATION,
  TENANT_QUERY,
  TENANTS_QUERY,
  UPGRADE_PLAN_MUTATION
} from "../lib/queries";

type PlanCard = {
  code: string;
  name: string;
  currentPrice: string;
  regularPrice: string;
  description: string;
  highlight?: boolean;
};

const plans: PlanCard[] = [
  {
    code: "ESSENTIAL_FREE",
    name: "Free",
    currentPrice: "R$ 0,00",
    regularPrice: "R$ 0,00",
    description: "Conta pessoal com limite inicial de 3 veículos."
  },
  {
    code: "INDIVIDUAL_PRO",
    name: "Pro",
    currentPrice: "R$ 19,90",
    regularPrice: "R$ 29,90",
    description: "Ideal para conta pessoal que precisa expandir a frota.",
    highlight: true
  },
  {
    code: "COMPANY_START",
    name: "Empresa Start",
    currentPrice: "R$ 0,00",
    regularPrice: "R$ 0,00",
    description: "Plano de entrada para empresas com limite de 3 veículos até pagamento."
  },
  {
    code: "COMPANY_PRO",
    name: "Empresa Pro",
    currentPrice: "R$ 59,90",
    regularPrice: "R$ 79,90",
    description: "Plano recorrente para frota empresarial em expansão."
  }
];

export function PlansPage() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { activeTenant } = useTenant();
  const [createCheckoutSession, { loading: checkoutLoading }] = useMutation(
    CREATE_CHECKOUT_SESSION_MUTATION
  );
  const [upgradePlan, { loading: demoLoading }] = useMutation(UPGRADE_PLAN_MUTATION, {
    update(cache, { data }) {
      const tenant = data?.upgradePlan;
      if (!tenant) {
        return;
      }

      cache.updateQuery<{ tenant: typeof tenant | null }>(
        { query: TENANT_QUERY, variables: { id: tenant.id } },
        (current) => ({
          tenant: {
            ...(current?.tenant ?? {}),
            ...tenant
          }
        })
      );

      upsertQueryListItem({
        cache,
        query: TENANTS_QUERY,
        variables: {},
        field: "tenants",
        item: tenant
      });
    }
  });

  const hasTenant = Boolean(activeTenant?.id);
  const activePlanCode = activeTenant?.planCode;

  if (!auth) {
    return (
      <div style={publicPageStyle}>
        <main style={publicMainStyle}>
          <Link style={backLinkStyle} to="/">
            ← Voltar para a home
          </Link>
          <article style={publicHeroStyle}>
            <strong style={heroKickerStyle}>Planos Fleet Platform</strong>
            <h1 style={heroTitleStyle}>Escolha o plano ideal para sua frota</h1>
            <p style={heroTextStyle}>
              Controle veículos, motoristas, abastecimentos, manutenções, alertas e relatórios em
              uma experiência pronta para web e mobile.
            </p>
            <div style={heroActionsStyle}>
              <Link className="btn-primary" style={heroLinkStyle} to="/register/individual">
                Criar conta pessoal
              </Link>
              <Link className="btn-primary" style={heroLinkStyle} to="/register/company">
                Criar conta empresa
              </Link>
            </div>
          </article>

          <section style={gridStyle}>
            {plans.map((plan) => (
              <article
                key={plan.code}
                style={{
                  ...cardStyle,
                  ...(plan.highlight ? highlightedCardStyle : null)
                }}
              >
                <p style={planNameStyle}>{plan.name}</p>
                <strong style={priceStyle}>{plan.currentPrice}</strong>
                <p style={strikeStyle}>De {plan.regularPrice}</p>
                <p style={descriptionStyle}>{plan.description}</p>
                <Link
                  className="btn-primary"
                  style={buttonLinkStyle}
                  to={plan.code === "COMPANY_START" ? "/register/company" : "/register/individual"}
                >
                  {plan.code === "COMPANY_START" ? "Criar conta empresa" : "Criar conta pessoal"}
                </Link>
              </article>
            ))}
          </section>
        </main>
      </div>
    );
  }

  async function openCheckout(planCode: string) {
    const tenantId = activeTenant?.id ?? "";
    if (!tenantId) {
      return;
    }

    try {
      const result = await createCheckoutSession({
        variables: {
          input: {
            tenantId,
            planCode
          }
        }
      });
      const url = result.data?.createCheckoutSession?.checkoutUrl;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
    } catch {
      // Fallback para o checkout local quando o servidor ainda não expuser a URL externa.
    }

    const fallbackUrl = new URL("/billing/checkout", window.location.origin);
    fallbackUrl.searchParams.set("tenantId", tenantId);
    fallbackUrl.searchParams.set("planCode", planCode);
    fallbackUrl.searchParams.set("customerName", activeTenant?.name ?? "");
    navigate(`${fallbackUrl.pathname}?${fallbackUrl.searchParams.toString()}`);
  }

  return (
    <CenteredShell
      title="Planos"
      subtitle="Escolha o plano ideal para uso pessoal ou empresarial."
    >
      {hasTenant ? (
        <article style={currentPlanCardStyle}>
          <strong>Plano atual</strong>
          <p style={heroTextStyle}>
            {activeTenant?.name} • {activeTenant?.planCode} •{" "}
            {activeTenant?.planStatus === "ACTIVE" ? "Ativo" : "Em avaliação"}
          </p>
        </article>
      ) : null}

      <section style={gridStyle}>
        {plans.map((plan) => (
          <article
            key={plan.code}
            style={{
              ...cardStyle,
              ...(plan.highlight ? highlightedCardStyle : null),
              ...(activePlanCode === plan.code ? activePlanCardStyle : null)
            }}
          >
            <p style={planNameStyle}>{plan.name}</p>
            <strong style={priceStyle}>{plan.currentPrice}</strong>
            <p style={strikeStyle}>De {plan.regularPrice}</p>
            <p style={descriptionStyle}>{plan.description}</p>
            <div style={cardActionsStyle}>
              {hasTenant ? (
                <>
                  {plan.code === "COMPANY_PRO" || plan.code === "INDIVIDUAL_PRO" ? (
                    <button
                      type="button"
                      className="btn-primary"
                      style={buttonStyle}
                      disabled={checkoutLoading}
                      onClick={() => openCheckout(plan.code)}
                    >
                      {checkoutLoading ? "Abrindo checkout..." : "Assinar agora"}
                    </button>
                  ) : (
                    <span style={mutedLabelStyle}>Plano base</span>
                  )}
                  <button
                    type="button"
                    style={ghostButtonStyle}
                    disabled={demoLoading || activePlanCode === plan.code}
                    onClick={() =>
                      upgradePlan({
                        variables: {
                    input: {
                            tenantId: activeTenant?.id ?? "",
                            planCode: plan.code
                          }
                        }
                      })
                    }
                  >
                    {demoLoading
                      ? "Atualizando..."
                      : activePlanCode === plan.code
                        ? "Plano atual"
                        : "Ativar demo"}
                  </button>
                </>
              ) : (
                <Link className="btn-primary" style={buttonLinkStyle} to={plan.code === "COMPANY_START" ? "/register/company" : "/register/individual"}>
                  {plan.code === "COMPANY_START" ? "Criar conta empresa" : "Criar conta pessoal"}
                </Link>
              )}
            </div>
          </article>
        ))}
      </section>
    </CenteredShell>
  );
}

const backLinkStyle: CSSProperties = {
  justifySelf: "start",
  color: "#cbd5e1",
  fontSize: "0.9rem"
};

const publicHeroStyle: CSSProperties = {
  padding: "1.25rem",
  borderRadius: "1rem",
  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.8))",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  marginBottom: "1rem"
};

const publicPageStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(251,191,36,0.12), transparent 24%), linear-gradient(180deg, #020617 0%, #0f172a 58%, #111827 100%)",
  color: "#f8fafc"
};

const publicMainStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "2rem 1.25rem 3rem",
  display: "grid",
  gap: "1rem",
  justifyItems: "center"
};

const heroKickerStyle: CSSProperties = {
  display: "block",
  color: "#fbbf24",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontSize: "0.72rem",
  marginBottom: "0.55rem"
};

const heroTitleStyle: CSSProperties = {
  margin: "0 0 0.75rem",
  fontSize: "clamp(2.2rem, 4vw, 4rem)",
  lineHeight: 1.02
};

const heroTextStyle: CSSProperties = {
  color: "#cbd5e1",
  marginBottom: 0
};

const heroActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  marginTop: "1rem"
};

const heroLinkStyle: CSSProperties = {
  color: "#0f172a",
  background: "#fbbf24",
  borderRadius: "0.85rem",
  padding: "0.8rem 1rem",
  fontWeight: 700
};

const currentPlanCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  marginBottom: "1rem"
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1rem",
  width: "100%"
};

const cardStyle: CSSProperties = {
  padding: "1.2rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  display: "grid",
  gap: "0.8rem"
};

const highlightedCardStyle: CSSProperties = {
  border: "1px solid rgba(251, 191, 36, 0.28)",
  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.78))"
};

const activePlanCardStyle: CSSProperties = {
  borderColor: "#22c55e"
};

const planNameStyle: CSSProperties = {
  margin: 0,
  color: "#fbbf24",
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const priceStyle: CSSProperties = {
  fontSize: "1.6rem",
  fontWeight: 800,
  marginBottom: 0
};

const strikeStyle: CSSProperties = {
  marginBottom: 0,
  color: "#94a3b8",
  textDecoration: "line-through"
};

const descriptionStyle: CSSProperties = {
  marginBottom: 0,
  color: "#cbd5e1"
};

const cardActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem"
};

const buttonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "transparent",
  color: "#f8fafc",
  border: "1px solid rgba(148, 163, 184, 0.22)"
};

const buttonLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const mutedLabelStyle: CSSProperties = {
  color: "#94a3b8",
  alignSelf: "center"
};
