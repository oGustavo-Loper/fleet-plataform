import { useEffect, useRef, useState, type CSSProperties } from "react";

type ActionItem = {
  label: string;
  danger?: boolean;
  onSelect: () => void;
};

export function ActionMenu({ actions }: { actions: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div style={{ ...rootStyle, zIndex: open ? 80 : "auto" }} ref={rootRef}>
      <button
        type="button"
        style={triggerStyle}
        aria-label="Abrir ações"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        ...
      </button>
      {open ? (
        <div style={menuStyle} role="menu">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              style={{
                ...itemStyle,
                ...(action.danger ? dangerItemStyle : null)
              }}
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const rootStyle: CSSProperties = {
  position: "relative"
};

const triggerStyle: CSSProperties = {
  minWidth: "2.6rem",
  height: "2.6rem",
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "rgba(15, 23, 42, 0.84)",
  color: "#f8fafc",
  fontSize: "1.1rem",
  letterSpacing: "0.14em",
  lineHeight: 1
};

const menuStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 0.45rem)",
  right: 0,
  minWidth: "220px",
  padding: "0.45rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "#0f172a",
  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.36)",
  display: "grid",
  gap: "0.2rem",
  zIndex: 81
};

const itemStyle: CSSProperties = {
  textAlign: "left",
  border: 0,
  borderRadius: "0.8rem",
  padding: "0.8rem 0.9rem",
  background: "transparent",
  color: "#e2e8f0"
};

const dangerItemStyle: CSSProperties = {
  color: "#fca5a5"
};
