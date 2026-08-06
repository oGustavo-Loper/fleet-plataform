import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { usePageMeta } from "../hooks/usePageMeta";

type IconProps = { size?: number };

function CarIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16V11.5L6 6.5C6.3 5.7 7.1 5.2 8 5.2h8c.9 0 1.7.5 2 1.3l2 5V16" />
      <path d="M4 16h16v2.5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1V17H7.5v1.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V16Z" />
      <circle cx="7.5" cy="13" r="1.1" />
      <circle cx="16.5" cy="13" r="1.1" />
    </svg>
  );
}

function IdBadgeIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="14" rx="2.2" />
      <circle cx="9.5" cy="11" r="1.9" />
      <path d="M6.5 16c.5-1.6 1.7-2.4 3-2.4s2.5.8 3 2.4" />
      <path d="M14.5 10h3M14.5 13h3" />
    </svg>
  );
}

function FuelIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 20V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 13 6v14" />
      <path d="M4.5 20h10" />
      <path d="M13 9.5h1.5L17 12v4.5a1.5 1.5 0 0 0 3 0V10a4 4 0 0 0-1.4-3.1L17 5.5" />
      <path d="M6 11h7" />
    </svg>
  );
}

function ChartIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <rect x="7" y="13" width="2.6" height="7" rx="0.6" />
      <rect x="12" y="9" width="2.6" height="11" rx="0.6" />
      <rect x="17" y="5.5" width="2.6" height="14.5" rx="0.6" />
    </svg>
  );
}

function CloudSyncIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 18a4 4 0 0 1-.6-7.95A5 5 0 0 1 16.4 9.1 3.7 3.7 0 0 1 16 16.5" />
      <path d="M9.5 15.5 12 13l2.5 2.5" />
      <path d="M12 13v6" />
    </svg>
  );
}

function CardIcon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M7 14.2h4" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms ease", flexShrink: 0 }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

const capabilities: Array<{ title: string; text: string; icon: (props: IconProps) => ReactNode; accent: string }> = [
  {
    title: "Gestão de veículos",
    text: "Cadastro completo, status operacional, quilometragem e limites por plano.",
    icon: CarIcon,
    accent: "#fbbf24"
  },
  {
    title: "Motoristas com login",
    text: "Perfis com vínculo a veículo, permissão para abastecer qualquer veículo e restrição por conta.",
    icon: IdBadgeIcon,
    accent: "#38bdf8"
  },
  {
    title: "Abastecimento e manutenção",
    text: "Registro rápido com cálculo de KM rodado, média, custos e campos dinâmicos por tipo de manutenção.",
    icon: FuelIcon,
    accent: "#fb923c"
  },
  {
    title: "Relatórios e painel",
    text: "Resumo por veículo com custos, consumo, alertas automáticos e exportação futura.",
    icon: ChartIcon,
    accent: "#4ade80"
  },
  {
    title: "PWA offline",
    text: "Uso em campo com fila local, sincronização automática e experiência mobile-first.",
    icon: CloudSyncIcon,
    accent: "#a78bfa"
  },
  {
    title: "Cobrança recorrente",
    text: "Planos Free, Pro e Empresa com checkout hospedado e ativação após confirmação.",
    icon: CardIcon,
    accent: "#f472b6"
  }
];

// Planos/preços escondidos temporariamente até o pagamento real (Mercado
// Pago) estar 100% funcionando — reative junto com a seção de preços e os
// links "/plans" mais abaixo neste arquivo.
// const plans = [
//   {
//     name: "Free",
//     price: "R$ 0,00",
//     period: "",
//     features: ["Até 3 veículos", "1 usuário administrador", "Abastecimentos e manutenções ilimitados"]
//   },
//   {
//     name: "Pro",
//     price: "R$ 19,90",
//     period: "/mês",
//     oldPrice: "R$ 29,90",
//     highlight: true,
//     features: ["Até 20 veículos", "Motoristas com login próprio", "Relatórios por veículo e período"]
//   },
//   {
//     name: "Empresa",
//     price: "R$ 59,90",
//     period: "/mês",
//     oldPrice: "R$ 79,90",
//     features: ["Veículos ilimitados", "Multiusuário com permissões", "Suporte prioritário"]
//   }
// ];

const steps = [
  "Crie a conta da empresa ou pessoa física.",
  "Cadastre o primeiro veículo e motoristas.",
  "Registre abastecimentos e manutenções em campo.",
  "Ative o plano e acompanhe custos e consumo."
];

const audienceCards = [
  {
    title: "Para empresas",
    text: "Controle de frota, permissão por perfil, limite por plano e visão de custos por período.",
    accent: "#fbbf24"
  },
  {
    title: "Para motoristas",
    text: "Acesso rápido para abastecer e registrar manutenções apenas no veículo permitido pela empresa.",
    accent: "#38bdf8"
  },
  {
    title: "Para pessoa física",
    text: "Gerencie até o limite do plano gratuito e migre quando precisar ampliar a sua frota.",
    accent: "#4ade80"
  }
];

const faqs = [
  {
    question: "O sistema funciona offline?",
    answer:
      "Sim. A PWA guarda os registros localmente quando não há conexão e sincroniza sozinha assim que a internet volta."
  },
  {
    question: "O motorista vê todos os veículos?",
    answer: "Não. Se estiver vinculado a um veículo, ele fica restrito a ele, salvo permissão especial da empresa."
  },
  // Escondidas junto com a seção de preços — reative junto.
  // {
  //   question: "Como funciona o pagamento?",
  //   answer: "A cobrança usa checkout hospedado com ativação automática após confirmação via Mercado Pago."
  // },
  // {
  //   question: "Dá para trocar de plano depois?",
  //   answer: "Sim, o upgrade é feito a qualquer momento direto na tela de planos, sem perder o histórico já registrado."
  // }
];

export function LandingPage() {
  usePageMeta(
    "Gestão de frota sem depender de sinal",
    "Gestão de frota, combustível, quilometragem e manutenção com suporte offline para empresas e motoristas autônomos no Brasil."
  );
  const [isMobile, setIsMobile] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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
        <div style={brandRowStyle}>
          <span style={brandMarkStyle}>FP</span>
          <div>
            <p style={eyebrowStyle}>Fleet Platform</p>
            <strong style={brandStyle}>Controle de frota para web, mobile e offline</strong>
          </div>
        </div>
        <div style={{ ...topActionsStyle, ...(isMobile ? topActionsMobileStyle : null) }}>
          <Link style={ghostLinkStyle} to="/login">
            Entrar
          </Link>
          {/* Reative junto com a seção de preços abaixo.
          <Link style={primaryLinkStyle} to="/plans">
            Ver planos
          </Link>
          */}
        </div>
      </header>

      <main style={{ ...mainStyle, ...(isMobile ? mainMobileStyle : null) }}>
        <section style={{ ...heroStyle, ...(isMobile ? heroMobileStyle : null) }}>
          <div style={{ ...heroCopyStyle, ...(isMobile ? heroCopyMobileStyle : null) }}>
            <p style={eyebrowStyle}>Gestão de frota, do jeito certo</p>
            <h1 style={headlineStyle}>
              Sua frota sob controle, <span style={headlineAccentStyle}>mesmo sem sinal</span>.
            </h1>
            <p style={leadStyle}>
              Uma plataforma única para empresas e pessoas físicas controlarem veículos,
              motoristas, abastecimentos, manutenções, consumo, alertas e relatórios — com
              login por perfil e sincronização automática quando a conexão volta.
            </p>
            <div style={heroButtonsStyle}>
              <Link style={primaryLinkStyle} to="/register/company">
                Criar conta empresarial
              </Link>
              <Link style={ghostLinkStyle} to="/register/individual">
                Criar conta pessoal
              </Link>
            </div>
            <ul style={trustListStyle}>
              {["Sem cartão de crédito no plano Free", "Funciona offline em campo", "Cancele quando quiser"].map(
                (item) => (
                  <li key={item} style={trustItemStyle}>
                    <span style={trustCheckStyle}>
                      <CheckIcon size={13} />
                    </span>
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <aside style={{ ...previewPanelStyle, ...(isMobile ? previewPanelMobileStyle : null) }}>
            <div style={previewHeaderStyle}>
              <div>
                <p style={previewEyebrowStyle}>Painel de operação</p>
                <strong style={previewTitleStyle}>Transportes Sol</strong>
              </div>
              <span style={previewBadgeStyle}>Prévia</span>
            </div>

            <div style={previewStatusRowStyle}>
              <span style={statusPillStyle("#22c55e")}>
                <span style={statusDotStyle("#22c55e")} />
                Sincronização online
              </span>
              <span style={statusPillStyle("#22c55e")}>
                <span style={statusDotStyle("#22c55e")} />
                API online
              </span>
            </div>

            <div style={{ ...previewMetricGridStyle, ...(isMobile ? previewMetricGridMobileStyle : null) }}>
              <div style={previewMetricStyle}>
                <p style={previewMetricLabelStyle}>Veículos</p>
                <strong style={previewMetricValueStyle}>12</strong>
              </div>
              <div style={previewMetricStyle}>
                <p style={previewMetricLabelStyle}>Ativos</p>
                <strong style={previewMetricValueStyle}>9</strong>
              </div>
              <div style={previewMetricStyle}>
                <p style={previewMetricLabelStyle}>Custos do mês</p>
                <strong style={previewMetricValueStyle}>R$ 4.320</strong>
              </div>
              <div style={previewMetricStyle}>
                <p style={previewMetricLabelStyle}>Consumo médio</p>
                <strong style={previewMetricValueStyle}>11,4 km/l</strong>
              </div>
            </div>

            <div style={previewAlertsStyle}>
              <p style={previewAlertsTitleStyle}>Alertas</p>
              <div style={previewAlertRowStyle}>
                <span>Manutenção próxima por KM</span>
                <span style={previewTagStyle("#fbbf24")}>Atenção</span>
              </div>
              <div style={previewAlertRowStyle}>
                <span>CNH vence em 7 dias</span>
                <span style={previewTagStyle("#fbbf24")}>Atenção</span>
              </div>
            </div>
            <p style={previewCaptionStyle}>Ilustração do painel real do produto.</p>
          </aside>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            <p style={sectionKickerStyle}>Funcionalidades</p>
            <h2 style={sectionTitleStyle}>Tudo que a operação de frota precisa, em um só lugar</h2>
          </div>
          <div style={{ ...featureGridStyle, ...(isMobile ? responsiveSingleColumnStyle : null) }}>
            {capabilities.map((item, index) => (
              <article
                key={item.title}
                style={{
                  ...featureCardStyle,
                  borderTopColor: item.accent,
                  ...(!isMobile ? lastRowCenteringStyle(index, capabilities.length) : null)
                }}
              >
                <span style={featureIconStyle(item.accent)}>
                  <item.icon size={28} />
                </span>
                <strong style={featureTitleStyle}>{item.title}</strong>
                <p style={featureTextStyle}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            <p style={sectionKickerStyle}>Para quem serve</p>
            <h2 style={sectionTitleStyle}>Um fluxo pensado para cada perfil de acesso</h2>
          </div>
          <div style={{ ...cardGridStyle, ...(isMobile ? responsiveSingleColumnStyle : null) }}>
            {audienceCards.map((item) => (
              <article key={item.title} style={{ ...audienceCardStyle, borderTopColor: item.accent }}>
                <span style={{ ...audienceDotStyle, background: item.accent }} />
                <strong style={featureTitleStyle}>{item.title}</strong>
                <p style={featureTextStyle}>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            <p style={sectionKickerStyle}>Como funciona</p>
            <h2 style={sectionTitleStyle}>Do cadastro ao primeiro relatório em minutos</h2>
          </div>
          <div style={{ ...stepGridStyle, ...(isMobile ? responsiveSingleColumnStyle : null) }}>
            {steps.map((step, index) => (
              <article key={step} style={stepCardStyle}>
                <div style={stepHeaderStyle}>
                  <span style={stepIndexStyle}>0{index + 1}</span>
                  {!isMobile && index < steps.length - 1 ? <span style={stepArrowStyle}>→</span> : null}
                </div>
                <p style={stepTextStyle}>{step}</p>
              </article>
            ))}
          </div>
        </section>

        {/*
          Seção de preços escondida temporariamente até o pagamento real
          (Mercado Pago) estar 100% funcionando. Reative junto com o
          array `plans` e os links "/plans" no topo/rodapé deste arquivo.

        <section style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            <p style={sectionKickerStyle}>Planos</p>
            <h2 style={sectionTitleStyle}>Comece de graça, cresça quando precisar</h2>
          </div>
          <div style={{ ...planGridStyle, ...(isMobile ? responsiveSingleColumnStyle : null) }}>
            {plans.map((plan) => (
              <article
                key={plan.name}
                style={{ ...planCardStyle, ...(plan.highlight ? planCardHighlightStyle : null) }}
              >
                {plan.highlight ? <span style={planBadgeStyle}>Mais popular</span> : null}
                <strong style={planNameStyle}>{plan.name}</strong>
                <div style={planPriceRowStyle}>
                  <span style={planPriceStyle}>{plan.price}</span>
                  {plan.period ? <span style={planPeriodStyle}>{plan.period}</span> : null}
                </div>
                {plan.oldPrice ? (
                  <p style={planOldPriceStyle}>
                    Preço cheio: <del>{plan.oldPrice}</del>
                  </p>
                ) : (
                  <p style={planOldPriceStyle}>&nbsp;</p>
                )}
                <ul style={planFeatureListStyle}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={planFeatureItemStyle}>
                      <span style={trustCheckStyle}>
                        <CheckIcon size={12} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  style={plan.highlight ? primaryLinkStyle : ghostLinkStyle}
                  to={plan.name === "Empresa" ? "/register/company" : "/register/individual"}
                >
                  {plan.name === "Free" ? "Começar de graça" : `Assinar ${plan.name}`}
                </Link>
              </article>
            ))}
          </div>
        </section>

        */}

        <section style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            <p style={sectionKickerStyle}>Dúvidas frequentes</p>
            <h2 style={sectionTitleStyle}>Perguntas que recebemos com frequência</h2>
          </div>
          <div style={faqListStyle}>
            {faqs.map((item, index) => {
              const open = openFaqIndex === index;
              return (
                <div key={item.question} style={faqItemStyle}>
                  <button
                    type="button"
                    style={faqButtonStyle}
                    onClick={() => setOpenFaqIndex(open ? null : index)}
                    aria-expanded={open}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span style={faqQuestionStyle}>{item.question}</span>
                    <ChevronIcon open={open} />
                  </button>
                  {open ? (
                    <p id={`faq-answer-${index}`} style={faqAnswerStyle}>
                      {item.answer}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ ...ctaStyle, ...(isMobile ? ctaMobileStyle : null) }}>
          <div style={ctaGlowStyle} />
          <div style={ctaContentStyle}>
            <p style={sectionKickerStyle}>Pronto para começar</p>
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

      <footer style={{ ...footerStyle, ...(isMobile ? footerMobileStyle : null) }}>
        <div style={brandRowStyle}>
          <span style={brandMarkStyle}>FP</span>
          <div>
            <strong style={brandStyle}>Fleet Platform</strong>
            <p style={footerTextStyle}>Gestão de frota com login por perfil e uso offline.</p>
          </div>
        </div>
        <nav style={footerLinksStyle}>
          {/* Reative junto com a seção de preços acima.
          <Link style={footerLinkStyle} to="/plans">
            Planos
          </Link>
          */}
          <Link style={footerLinkStyle} to="/login">
            Entrar
          </Link>
          <Link style={footerLinkStyle} to="/register/individual">
            Criar conta
          </Link>
        </nav>
        <p style={footerCopyStyle}>© {new Date().getFullYear()} Fleet Platform.</p>
      </footer>
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

const brandRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem"
};

const brandMarkStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: "2.5rem",
  height: "2.5rem",
  borderRadius: "0.85rem",
  background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
  color: "#0f172a",
  fontWeight: 800,
  fontSize: "0.85rem",
  letterSpacing: "0.02em",
  flexShrink: 0
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#0f172a",
  background: "#fbbf24",
  borderRadius: "0.9rem",
  padding: "0.9rem 1.1rem",
  fontWeight: 700
};

const ghostLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#f8fafc",
  borderRadius: "0.9rem",
  padding: "0.9rem 1.1rem",
  border: "1px solid rgba(248, 250, 252, 0.18)"
};

const mainStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "1rem 1.25rem 3rem",
  display: "grid",
  gap: "3.5rem"
};

const mainMobileStyle: CSSProperties = {
  padding: "0.75rem 1rem 2.25rem",
  gap: "2.75rem"
};

const heroStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.15fr 0.95fr",
  gap: "1.5rem",
  alignItems: "stretch"
};

const heroMobileStyle: CSSProperties = {
  gridTemplateColumns: "minmax(0, 1fr)"
};

const heroCopyStyle: CSSProperties = {
  padding: "2.25rem",
  borderRadius: "1.5rem",
  background: "rgba(15, 23, 42, 0.74)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center"
};

const heroCopyMobileStyle: CSSProperties = {
  padding: "1.5rem"
};

const headlineStyle: CSSProperties = {
  margin: "0.6rem 0 0",
  fontSize: "clamp(2.3rem, 4.6vw, 3.6rem)",
  lineHeight: 1.08
};

const headlineAccentStyle: CSSProperties = {
  color: "#fbbf24"
};

const leadStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "1.05rem",
  lineHeight: 1.7,
  maxWidth: "56ch",
  marginTop: "1rem"
};

const heroButtonsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.8rem",
  marginTop: "1.75rem"
};

const trustListStyle: CSSProperties = {
  listStyle: "none",
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem 1.25rem",
  margin: "1.5rem 0 0",
  padding: 0
};

const trustItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  color: "#94a3b8",
  fontSize: "0.88rem"
};

const trustCheckStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.15rem",
  height: "1.15rem",
  borderRadius: "999px",
  background: "rgba(74, 222, 128, 0.16)",
  color: "#4ade80",
  flexShrink: 0
};

const previewPanelStyle: CSSProperties = {
  padding: "1.35rem",
  borderRadius: "1.5rem",
  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.86))",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  boxShadow: "0 30px 60px -30px rgba(0,0,0,0.6)",
  display: "grid",
  gap: "1rem",
  alignContent: "start"
};

const previewPanelMobileStyle: CSSProperties = {
  padding: "1.1rem"
};

const previewHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "0.75rem"
};

const previewEyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em"
};

const previewTitleStyle: CSSProperties = {
  display: "block",
  marginTop: "0.3rem",
  fontSize: "1.05rem"
};

const previewBadgeStyle: CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: "999px",
  background: "rgba(251, 191, 36, 0.14)",
  color: "#fbbf24",
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const previewStatusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem"
};

function statusPillStyle(color: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.35rem 0.65rem",
    borderRadius: "999px",
    background: "rgba(15, 23, 42, 0.72)",
    border: `1px solid ${color}`,
    fontSize: "0.78rem",
    color: "#f8fafc"
  };
}

function statusDotStyle(color: string): CSSProperties {
  return {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color
  };
}

const previewMetricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "0.7rem"
};

const previewMetricGridMobileStyle: CSSProperties = {
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
};

const previewMetricStyle: CSSProperties = {
  padding: "0.85rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(148, 163, 184, 0.14)"
};

const previewMetricLabelStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "0.78rem"
};

const previewMetricValueStyle: CSSProperties = {
  display: "block",
  marginTop: "0.35rem",
  fontSize: "1.25rem"
};

const previewAlertsStyle: CSSProperties = {
  padding: "0.9rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.5)",
  border: "1px solid rgba(148, 163, 184, 0.12)",
  display: "grid",
  gap: "0.55rem"
};

const previewAlertsTitleStyle: CSSProperties = {
  margin: 0,
  color: "#cbd5e1",
  fontSize: "0.82rem",
  fontWeight: 700
};

const previewAlertRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.75rem",
  fontSize: "0.82rem",
  color: "#cbd5e1"
};

function previewTagStyle(color: string): CSSProperties {
  return {
    padding: "0.2rem 0.5rem",
    borderRadius: "999px",
    background: `${color}26`,
    color,
    fontSize: "0.7rem",
    fontWeight: 700,
    flexShrink: 0
  };
}

const previewCaptionStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "0.74rem",
  textAlign: "center"
};

const sectionStyle: CSSProperties = {};

const sectionHeadingStyle: CSSProperties = {
  display: "grid",
  gap: "0.5rem",
  maxWidth: "56ch",
  marginBottom: "1.5rem"
};

const sectionKickerStyle: CSSProperties = {
  margin: 0,
  color: "#fbbf24",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontSize: "0.72rem"
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)",
  lineHeight: 1.25
};

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1rem"
};

const responsiveSingleColumnStyle: CSSProperties = {
  gridTemplateColumns: "minmax(0, 1fr)"
};

const FEATURE_GRID_COLUMNS = 4;

const featureGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: `repeat(${FEATURE_GRID_COLUMNS}, minmax(0, 1fr))`,
  gap: "1rem"
};

// Centers a trailing partial row (e.g. 6 items in a 4-column grid leaves 2
// orphaned on their own row, flush left by default) by placing those items
// under the middle column(s) instead of column 1.
function lastRowCenteringStyle(index: number, total: number): CSSProperties {
  const itemsInLastRow = total % FEATURE_GRID_COLUMNS;
  const lastRowStart = total - itemsInLastRow;
  if (itemsInLastRow === 0 || index < lastRowStart) {
    return {};
  }

  const positionInRow = index - lastRowStart;
  const startColumn = Math.floor((FEATURE_GRID_COLUMNS - itemsInLastRow) / 2) + 1 + positionInRow;
  return { gridColumn: `${startColumn} / ${startColumn + 1}` };
}

const featureCardStyle: CSSProperties = {
  padding: "1.35rem",
  borderRadius: "1.1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderTopWidth: "3px",
  borderTopStyle: "solid"
};

function featureIconStyle(color: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "3.6rem",
    height: "3.6rem",
    borderRadius: "1.1rem",
    background: `linear-gradient(160deg, ${color}33, ${color}0d)`,
    border: `1px solid ${color}40`,
    boxShadow: `0 10px 26px -14px ${color}b3`,
    color,
    marginBottom: "1rem"
  };
}

const featureTitleStyle: CSSProperties = {
  display: "block",
  marginBottom: "0.45rem"
};

const featureTextStyle: CSSProperties = {
  color: "#cbd5e1",
  margin: 0,
  lineHeight: 1.65
};

const audienceCardStyle: CSSProperties = {
  padding: "1.35rem",
  borderRadius: "1.1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderTopWidth: "3px",
  borderTopStyle: "solid"
};

const audienceDotStyle: CSSProperties = {
  display: "inline-block",
  width: "0.55rem",
  height: "0.55rem",
  borderRadius: "999px",
  marginBottom: "0.9rem"
};

const stepGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "1rem"
};

const stepCardStyle: CSSProperties = {
  padding: "1.1rem",
  borderRadius: "1.1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)"
};

const stepHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "0.75rem"
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
  fontSize: "0.85rem",
  fontWeight: 700
};

const stepArrowStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "1.1rem"
};

const stepTextStyle: CSSProperties = {
  margin: 0,
  color: "#cbd5e1",
  lineHeight: 1.55
};

const planGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1.25rem",
  alignItems: "stretch"
};

const planCardStyle: CSSProperties = {
  position: "relative",
  padding: "1.5rem",
  borderRadius: "1.25rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  display: "grid",
  gap: "0.7rem",
  alignContent: "start"
};

const planCardHighlightStyle: CSSProperties = {
  border: "1px solid rgba(251, 191, 36, 0.4)",
  background: "linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.85))",
  boxShadow: "0 24px 48px -28px rgba(251, 191, 36, 0.35)"
};

const planBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-0.75rem",
  right: "1.25rem",
  padding: "0.3rem 0.65rem",
  borderRadius: "999px",
  background: "#fbbf24",
  color: "#0f172a",
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};

const planNameStyle: CSSProperties = {
  color: "#fbbf24"
};

const planPriceRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "0.35rem"
};

const planPriceStyle: CSSProperties = {
  fontSize: "1.7rem",
  fontWeight: 800
};

const planPeriodStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.88rem"
};

const planOldPriceStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "0.85rem"
};

const planFeatureListStyle: CSSProperties = {
  listStyle: "none",
  margin: "0.3rem 0 0.6rem",
  padding: 0,
  display: "grid",
  gap: "0.55rem"
};

const planFeatureItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
  color: "#cbd5e1",
  fontSize: "0.9rem"
};

const faqListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "0.85rem",
  width: "100%"
};

const faqItemStyle: CSSProperties = {
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  overflow: "hidden"
};

const faqButtonStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "1.1rem 1.25rem",
  background: "transparent",
  border: 0,
  color: "#f8fafc",
  textAlign: "left",
  cursor: "pointer"
};

const faqQuestionStyle: CSSProperties = {
  fontWeight: 600
};

const faqAnswerStyle: CSSProperties = {
  margin: 0,
  padding: "0 1.25rem 1.1rem",
  color: "#cbd5e1",
  lineHeight: 1.65
};

const ctaStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  padding: "2rem",
  borderRadius: "1.5rem",
  background: "linear-gradient(135deg, rgba(251,191,36,0.14), rgba(15,23,42,0.86))",
  border: "1px solid rgba(251, 191, 36, 0.22)",
  flexWrap: "wrap",
  overflow: "hidden"
};

const ctaGlowStyle: CSSProperties = {
  position: "absolute",
  top: "-40%",
  right: "-10%",
  width: "22rem",
  height: "22rem",
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(251,191,36,0.22), transparent 70%)",
  pointerEvents: "none"
};

const ctaContentStyle: CSSProperties = {
  position: "relative"
};

const ctaMobileStyle: CSSProperties = {
  padding: "1.5rem"
};

const ctaTitleStyle: CSSProperties = {
  margin: "0.45rem 0 0",
  fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)"
};

const ctaButtonsStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap"
};

const ctaButtonsMobileStyle: CSSProperties = {
  width: "100%"
};

const footerStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "2rem 1.25rem 2.5rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1.5rem",
  flexWrap: "wrap",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)"
};

const footerMobileStyle: CSSProperties = {
  padding: "1.75rem 1rem 2rem",
  flexDirection: "column",
  alignItems: "flex-start"
};

const footerTextStyle: CSSProperties = {
  margin: "0.3rem 0 0",
  color: "#94a3b8",
  fontSize: "0.85rem"
};

const footerLinksStyle: CSSProperties = {
  display: "flex",
  gap: "1.25rem",
  flexWrap: "wrap"
};

const footerLinkStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "0.9rem"
};

const footerCopyStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "0.82rem"
};
