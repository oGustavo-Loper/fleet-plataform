import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const capabilities = [
  {
    title: "Gestão de veículos",
    text: "Cadastro completo, status operacional, quilometragem e limites por plano."
  },
  {
    title: "Motoristas com login",
    text: "Perfis com vínculo a veículo, permissão para abastecer qualquer veículo e restrição por conta."
  },
  {
    title: "Abastecimento e manutenção",
    text: "Registro rápido com cálculo de KM rodado, média, custos e campos dinâmicos por tipo de manutenção."
  },
  {
    title: "Relatórios e dashboard",
    text: "Resumo por veículo com custos, consumo, alertas automáticos e exportação futura."
  },
  {
    title: "PWA offline",
    text: "Uso em campo com salvamento local, sincronização e experiência mobile-first."
  },
  {
    title: "Billing recorrente",
    text: "Planos Free, Pro e Empresa com checkout hospedado e ativação após confirmação."
  }
];

const plans = [
  {
    name: "Free",
    price: "R$ 0,00",
    note: "Conta pessoal de entrada com limite inicial."
  },
  {
    name: "Pro",
    price: "R$ 19,90",
    note: "Promocional. Preço cheio: ",
    oldPrice: "R$ 29,90."
  },
  {
    name: "Empresa",
    price: "R$ 59,90",
    note: "Promocional. Preço cheio: ",
    oldPrice: "R$ 79,90."
  }
];

const steps = [
  "Crie a conta da empresa ou pessoa física.",
  "Cadastre o primeiro veículo e motoristas.",
  "Registre abastecimentos e manutenções em campo.",
  "Ative o plano e acompanhe custos e consumo."
];

const audienceCards = [
  {
    title: "Para empresas",
    text: "Tenha controle de frota, permissão por perfil, limite por plano e visão de custos por período."
  },
  {
    title: "Para motoristas",
    text: "Acesso rápido para abastecer e registrar manutenções apenas no veículo permitido pela empresa."
  },
  {
    title: "Para pessoa física",
    text: "Gerencie até o limite do plano gratuito e migre quando precisar ampliar a sua frota."
  }
];

const faqs = [
  {
    question: "O sistema funciona offline?",
    answer: "Sim. A PWA salva informações localmente e sincroniza quando a conexão retorna."
  },
  {
    question: "O motorista ve todos os veículos?",
    answer: "Não. Se estiver vinculado a um veículo, ele fica restrito a ele, salvo permissão especial."
  },
  {
    question: "Como funciona o pagamento?",
    answer: "A cobrança usa checkout hospedado com ativação após confirmação via Mercado Pago."
  }
];

export function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div style={pageStyle}>
      <header style={{ ...topBarStyle, ...(isMobile ? topBarMobileStyle : null) }}>
        <div>
          <p style={eyebrowStyle}>Fleet Platform</p>
          <strong style={brandStyle}>Controle de frota para web, mobile e offline</strong>
        </div>
        <div style={{ ...topActionsStyle, ...(isMobile ? topActionsMobileStyle : null) }}>
          <Link style={ghostLinkStyle} to="/login">
            Entrar
          </Link>
          <Link style={primaryLinkStyle} to="/plans">
            Ver planos
          </Link>
        </div>
      </header>

      <main style={{ ...mainStyle, ...(isMobile ? mainMobileStyle : null) }}>
        <section style={{ ...heroStyle, ...(isMobile ? heroMobileStyle : null) }}>
          <div style={{ ...heroCopyStyle, ...(isMobile ? heroCopyMobileStyle : null) }}>
            <p style={eyebrowStyle}>MVP pronto para demonstração</p>
            <h1 style={headlineStyle}>
              Gestão de veículos com login por perfil, offline e cobrança recorrente.
            </h1>
            <p style={leadStyle}>
              Uma plataforma única para empresas e pessoas físicas controlarem veículos,
              motoristas, abastecimentos, manutenções, consumo, alertas e relatórios.
            </p>
            <div style={heroButtonsStyle}>
              <Link style={primaryLinkStyle} to="/register/company">
                Criar conta empresa
              </Link>
              <Link style={ghostLinkStyle} to="/register/individual">
                Criar conta pessoal
              </Link>
            </div>
          </div>

          <aside style={{ ...heroPanelStyle, ...(isMobile ? heroPanelMobileStyle : null) }}>
            <div style={{ ...statGridStyle, ...(isMobile ? statGridMobileStyle : null) }}>
              <article style={statCardStyle}>
                <strong style={statValueStyle}>PWA</strong>
                <span style={statLabelStyle}>Offline e instalável</span>
              </article>
              <article style={statCardStyle}>
                <strong style={statValueStyle}>RBAC</strong>
                <span style={statLabelStyle}>Admin, empresa, motorista e pessoa física</span>
              </article>
              <article style={statCardStyle}>
                <strong style={statValueStyle}>3 planos</strong>
                <span style={statLabelStyle}>Free, Pro e Empresa</span>
              </article>
              <article style={statCardStyle}>
                <strong style={statValueStyle}>Relatórios</strong>
                <span style={statLabelStyle}>Custos, consumo e manutenção</span>
              </article>
            </div>
          </aside>
        </section>

        <section style={sectionStyle}>
          <p style={sectionKickerStyle}>Funcionalidades</p>
          <div style={{ ...cardGridStyle, ...(isMobile ? responsiveSingleColumnStyle : null) }}>
            {capabilities.map((item) => (
              <article key={item.title} style={featureCardStyle}>
                <strong style={featureTitleStyle}>{item.title}</strong>
                <p style={featureTextStyle}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <p style={sectionKickerStyle}>Para quem serve</p>
          <div style={{ ...cardGridStyle, ...(isMobile ? responsiveSingleColumnStyle : null) }}>
            {audienceCards.map((item) => (
              <article key={item.title} style={featureCardStyle}>
                <strong style={featureTitleStyle}>{item.title}</strong>
                <p style={featureTextStyle}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <p style={sectionKickerStyle}>Como funciona</p>
          <div style={{ ...stepGridStyle, ...(isMobile ? responsiveSingleColumnStyle : null) }}>
            {steps.map((step, index) => (
              <article key={step} style={stepCardStyle}>
                <span style={stepIndexStyle}>0{index + 1}</span>
                <p style={stepTextStyle}>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <p style={sectionKickerStyle}>Planos</p>
          <div style={{ ...planGridStyle, ...(isMobile ? responsiveSingleColumnStyle : null) }}>
            {plans.map((plan) => (
              <article key={plan.name} style={planCardStyle}>
                <strong style={planNameStyle}>{plan.name}</strong>
                <span style={planPriceStyle}>{plan.price}</span>
                <p style={featureTextStyle}>{plan.note}<del>{plan.oldPrice}</del></p>
              </article>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <p style={sectionKickerStyle}>FAQ</p>
          <div style={{ ...faqGridStyle, ...(isMobile ? responsiveSingleColumnStyle : null) }}>
            {faqs.map((item) => (
              <article key={item.question} style={faqCardStyle}>
                <strong style={featureTitleStyle}>{item.question}</strong>
                <p style={featureTextStyle}>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...ctaStyle, ...(isMobile ? ctaMobileStyle : null) }}>
          <div>
            <p style={sectionKickerStyle}>Pronto para o MVP</p>
            <h2 style={ctaTitleStyle}>Abra a conta e teste o fluxo completo.</h2>
          </div>
          <div style={{ ...ctaButtonsStyle, ...(isMobile ? ctaButtonsMobileStyle : null) }}>
            <Link style={primaryLinkStyle} to="/register/company">
              Começar agora
            </Link>
            <Link style={ghostLinkStyle} to="/login">
              Já tenho acesso
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  background:
    "radial-gradient(circle at top left, rgba(251,191,36,0.18), transparent 22%), radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 24%), linear-gradient(180deg, #020617 0%, #0f172a 48%, #111827 100%)"
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "center",
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "1.25rem"
};

const topBarMobileStyle: CSSProperties = {
  alignItems: "flex-start"
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  fontSize: "0.72rem",
  color: "#fbbf24"
};

const brandStyle: CSSProperties = {
  display: "block",
  marginTop: "0.35rem",
  fontSize: "1rem"
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap"
};

const topActionsMobileStyle: CSSProperties = {
  width: "100%"
};

const primaryLinkStyle: CSSProperties = {
  color: "#0f172a",
  background: "#fbbf24",
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  fontWeight: 700
};

const ghostLinkStyle: CSSProperties = {
  color: "#f8fafc",
  borderRadius: "0.9rem",
  padding: "0.9rem 1rem",
  border: "1px solid rgba(248, 250, 252, 0.18)"
};

const mainStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "1rem 1.25rem 3rem",
  display: "grid",
  gap: "1.2rem"
};

const mainMobileStyle: CSSProperties = {
  padding: "0.75rem 1rem 2.25rem"
};

const heroStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.3fr 0.9fr",
  gap: "1rem",
  alignItems: "stretch"
};

const heroMobileStyle: CSSProperties = {
  gridTemplateColumns: "minmax(0, 1fr)"
};

const heroCopyStyle: CSSProperties = {
  padding: "2rem",
  borderRadius: "1.5rem",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const heroCopyMobileStyle: CSSProperties = {
  padding: "1.35rem"
};

const headlineStyle: CSSProperties = {
  margin: "0.5rem 0 0",
  fontSize: "clamp(2.4rem, 5vw, 4.8rem)",
  lineHeight: 1.02
};

const leadStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "1.05rem",
  lineHeight: 1.7,
  maxWidth: "62ch"
};

const heroButtonsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.8rem",
  marginTop: "1.5rem"
};

const heroPanelStyle: CSSProperties = {
  padding: "1.1rem",
  borderRadius: "1.5rem",
  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.82))",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const heroPanelMobileStyle: CSSProperties = {
  padding: "0.9rem"
};

const statGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0.85rem",
  height: "100%"
};

const statGridMobileStyle: CSSProperties = {
  gridTemplateColumns: "minmax(0, 1fr)"
};

const statCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.64)",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const statValueStyle: CSSProperties = {
  display: "block",
  fontSize: "1.15rem",
  marginBottom: "0.35rem"
};

const statLabelStyle: CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5
};

const sectionStyle: CSSProperties = {
  padding: "0.2rem 0"
};

const sectionKickerStyle: CSSProperties = {
  margin: 0,
  color: "#fbbf24",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontSize: "0.72rem"
};

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
  marginTop: "0.8rem"
};

const responsiveSingleColumnStyle: CSSProperties = {
  gridTemplateColumns: "minmax(0, 1fr)"
};

const featureCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const featureTitleStyle: CSSProperties = {
  display: "block",
  marginBottom: "0.45rem"
};

const featureTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  lineHeight: 1.65
};

const stepGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
  marginTop: "0.8rem"
};

const stepCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const stepIndexStyle: CSSProperties = {
  display: "inline-flex",
  width: "2rem",
  height: "2rem",
  borderRadius: "999px",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(251, 191, 36, 0.14)",
  color: "#fbbf24",
  marginBottom: "0.75rem"
};

const stepTextStyle: CSSProperties = {
  margin: 0,
  color: "#cbd5e1"
};

const planGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
  marginTop: "0.8rem"
};

const planCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  display: "grid",
  gap: "0.55rem"
};

const planNameStyle: CSSProperties = {
  color: "#fbbf24"
};

const planPriceStyle: CSSProperties = {
  fontSize: "1.35rem",
  fontWeight: 700
};

const faqGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1rem",
  marginTop: "0.8rem"
};

const faqCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const ctaStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  padding: "1.3rem",
  borderRadius: "1.25rem",
  background: "linear-gradient(135deg, rgba(251,191,36,0.16), rgba(15,23,42,0.82))",
  border: "1px solid rgba(251, 191, 36, 0.22)",
  flexWrap: "wrap"
};

const ctaMobileStyle: CSSProperties = {
  padding: "1.1rem"
};

const ctaTitleStyle: CSSProperties = {
  margin: "0.45rem 0 0"
};

const ctaButtonsStyle: CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap"
};

const ctaButtonsMobileStyle: CSSProperties = {
  width: "100%"
};
