import type { CSSProperties } from "react";

export function ReportSummaryGrid({
  cards
}: {
  cards: Array<{ label: string; value: string | number }>;
}) {
  return (
    <section style={summaryGridStyle}>
      {cards.map((card) => (
        <article key={card.label} style={summaryCardStyle}>
          <p style={summaryLabelStyle}>{card.label}</p>
          <strong style={summaryValueStyle}>{card.value}</strong>
        </article>
      ))}
    </section>
  );
}

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "1rem",
  marginBottom: "1rem"
};

const summaryCardStyle: CSSProperties = {
  padding: "1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const summaryLabelStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8"
};

const summaryValueStyle: CSSProperties = {
  display: "block",
  marginTop: "0.55rem",
  fontSize: "1.1rem"
};
