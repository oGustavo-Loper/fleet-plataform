import type { CSSProperties } from "react";

import { EmptyState } from "../../components/ScreenState";
import type {
  ReportPerformanceInsight,
  ReportPerformanceTrendPoint
} from "../../lib/report-performance";

export function ReportPerformancePanel({
  insights,
  trend
}: {
  insights: ReportPerformanceInsight[];
  trend: ReportPerformanceTrendPoint[];
}) {
  if (!insights.length && !trend.length) {
    return (
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Desempenho no período</h2>
        <EmptyState message="Sem dados suficientes para montar os indicadores de desempenho." />
      </section>
    );
  }

  const maxDistance = Math.max(...trend.map((item) => item.distanceKm), 1);
  const maxAverage = Math.max(...trend.map((item) => item.averageConsumption), 1);

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Desempenho no período</h2>
      {insights.length ? (
        <div style={insightsGridStyle}>
          {insights.map((insight) => (
            <article key={insight.id} style={insightCardStyle}>
              <p style={insightLabelStyle}>{insight.label}</p>
              <strong style={insightValueStyle}>{insight.value}</strong>
              <p style={insightDetailStyle}>{insight.detail}</p>
            </article>
          ))}
        </div>
      ) : null}
      {trend.length ? (
        <div style={chartPanelStyle}>
          <p style={chartSubtitleStyle}>Evolução diária (últimos registros do período)</p>
          <div style={trendRowsStyle}>
            {trend.map((point) => (
              <article key={point.date} style={trendRowStyle}>
                <header style={trendHeaderStyle}>
                  <strong>{new Date(point.date).toLocaleDateString("pt-BR")}</strong>
                  <span style={trendHeaderDetailStyle}>
                    R$ {point.totalCost.toFixed(2)} • {point.liters.toFixed(2)} L
                  </span>
                </header>
                <div style={metricRowStyle}>
                  <span style={metricLabelStyle}>Distância</span>
                  <div style={barTrackStyle}>
                    <div
                      style={{
                        ...distanceBarStyle,
                        width: `${Math.max(6, (point.distanceKm / maxDistance) * 100)}%`
                      }}
                    />
                  </div>
                  <span style={metricValueStyle}>{point.distanceKm.toLocaleString("pt-BR")} km</span>
                </div>
                <div style={metricRowStyle}>
                  <span style={metricLabelStyle}>Média</span>
                  <div style={barTrackStyle}>
                    <div
                      style={{
                        ...averageBarStyle,
                        width: `${Math.max(6, (point.averageConsumption / maxAverage) * 100)}%`
                      }}
                    />
                  </div>
                  <span style={metricValueStyle}>{point.averageConsumption.toFixed(2)} km/l</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const sectionStyle: CSSProperties = {
  marginTop: "1.25rem"
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0
};

const insightsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "0.8rem",
  marginBottom: "1rem"
};

const insightCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  display: "grid",
  gap: "0.35rem"
};

const insightLabelStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8"
};

const insightValueStyle: CSSProperties = {
  fontSize: "1.2rem"
};

const insightDetailStyle: CSSProperties = {
  margin: 0,
  color: "#cbd5e1"
};

const chartPanelStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const chartSubtitleStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8"
};

const trendRowsStyle: CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  marginTop: "0.85rem"
};

const trendRowStyle: CSSProperties = {
  padding: "0.75rem",
  borderRadius: "0.95rem",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  background: "rgba(15, 23, 42, 0.44)",
  display: "grid",
  gap: "0.55rem"
};

const trendHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.75rem",
  flexWrap: "wrap"
};

const trendHeaderDetailStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.84rem"
};

const metricRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "70px 1fr auto",
  alignItems: "center",
  gap: "0.65rem"
};

const metricLabelStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: "0.85rem"
};

const barTrackStyle: CSSProperties = {
  height: "10px",
  borderRadius: "999px",
  background: "rgba(148, 163, 184, 0.16)",
  overflow: "hidden"
};

const distanceBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)"
};

const averageBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)"
};

const metricValueStyle: CSSProperties = {
  color: "#e2e8f0",
  fontSize: "0.85rem"
};
