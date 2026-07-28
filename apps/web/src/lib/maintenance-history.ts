export const MAINTENANCE_HISTORY_HIGHLIGHT_MS = 850;

type HistorySectionTarget = {
  scrollIntoView: (options?: ScrollIntoViewOptions) => void;
};

type ScheduleTimeout = (handler: () => void, timeoutMs: number) => unknown;

export function revealMaintenanceHistory(
  target: HistorySectionTarget | null,
  setHighlight: (value: boolean) => void,
  scheduleTimeout: ScheduleTimeout = (handler, timeoutMs) => window.setTimeout(handler, timeoutMs)
) {
  if (!target) {
    return false;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest"
  });
  setHighlight(true);
  scheduleTimeout(() => setHighlight(false), MAINTENANCE_HISTORY_HIGHLIGHT_MS);
  return true;
}
