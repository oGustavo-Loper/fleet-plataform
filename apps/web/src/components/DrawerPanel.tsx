import { useEffect, type CSSProperties, type PropsWithChildren } from "react";

export function DrawerPanel({
  open,
  title,
  subtitle,
  width = "min(560px, 100vw)",
  onClose,
  children
}: PropsWithChildren<{
  open: boolean;
  title: string;
  subtitle?: string;
  width?: string;
  onClose: () => void;
}>) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <aside style={{ ...panelStyle, width }} aria-modal="true" role="dialog">
        <header style={headerStyle}>
          <div>
            <h2 style={titleStyle}>{title}</h2>
            {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
          </div>
          <button type="button" style={closeButtonStyle} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div style={contentStyle}>{children}</div>
      </aside>
    </>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2, 6, 23, 0.6)",
  zIndex: 49
};

const panelStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  maxWidth: "100vw",
  background: "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
  borderLeft: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "-24px 0 48px rgba(15, 23, 42, 0.38)",
  zIndex: 50,
  display: "flex",
  flexDirection: "column",
  overscrollBehavior: "contain"
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  alignItems: "flex-start",
  padding: "1.35rem 1.35rem 1rem",
  borderBottom: "1px solid rgba(148, 163, 184, 0.12)"
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "1.2rem"
};

const subtitleStyle: CSSProperties = {
  margin: "0.35rem 0 0",
  color: "#94a3b8"
};

const closeButtonStyle: CSSProperties = {
  width: "2.6rem",
  height: "2.6rem",
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#f8fafc",
  fontSize: "1.4rem",
  lineHeight: 1
};

const contentStyle: CSSProperties = {
  padding: "1.35rem",
  overflowY: "auto",
  display: "grid",
  gap: "1rem",
  alignContent: "start",
  WebkitOverflowScrolling: "touch"
};
