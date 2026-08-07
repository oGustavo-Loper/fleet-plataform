import type { CSSProperties } from "react";
import type { DriverEmploymentStatus } from "@fleet/shared-types";

export const DRIVER_STATUS_TONE: Record<
  DriverEmploymentStatus,
  { fg: string; bg: string; border: string; label: string }
> = {
  ACTIVE: { fg: "#4ade80", bg: "rgba(74, 222, 128, 0.12)", border: "rgba(74, 222, 128, 0.28)", label: "Ativo" },
  VACATION: { fg: "#fbbf24", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.28)", label: "Em férias" },
  TERMINATED: { fg: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.24)", label: "Desligado" }
};

export function DriverStatusPill({ status }: { status: DriverEmploymentStatus }) {
  const tone = DRIVER_STATUS_TONE[status];
  return (
    <span style={{ ...pillStyle, color: tone.fg, background: tone.bg, border: `1px solid ${tone.border}` }}>
      <span style={{ ...dotStyle, background: tone.fg }} />
      {tone.label}
    </span>
  );
}

const pillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.3rem 0.65rem 0.3rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.72rem",
  fontWeight: 700
};

const dotStyle: CSSProperties = {
  width: "0.4rem",
  height: "0.4rem",
  borderRadius: "999px"
};
