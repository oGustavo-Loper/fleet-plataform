import { useRef, type CSSProperties } from "react";

import { FormField } from "./FormField";

type Props = {
  label: string;
  accept?: string;
  buttonLabel: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  previewUrl?: string;
  previewAlt?: string;
  onSelect: (file: File | null) => Promise<void> | void;
};

export function FileUploadField({
  label,
  accept,
  buttonLabel,
  hint,
  error,
  loading,
  previewUrl,
  previewAlt,
  onSelect
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <FormField label={label} style={fullWidthStyle}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={hiddenInputStyle}
        onChange={async (event) => {
          const file = event.target.files?.[0] ?? null;
          await onSelect(file);
          event.target.value = "";
        }}
      />
      <div style={uploadBoxStyle}>
        <button
          type="button"
          style={uploadButtonStyle}
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {loading ? "Enviando..." : buttonLabel}
        </button>
        <span style={uploadHintStyle}>{hint ?? "PNG, JPG ou WEBP"}</span>
      </div>
      {error ? <p style={errorStyle}>{error}</p> : null}
      {previewUrl ? <img src={previewUrl} alt={previewAlt ?? label} style={previewStyle} /> : null}
    </FormField>
  );
}

const hiddenInputStyle: CSSProperties = {
  display: "none"
};

const fullWidthStyle: CSSProperties = {
  gridColumn: "1 / -1"
};

const uploadBoxStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.9rem 1rem",
  borderRadius: "0.9rem",
  border: "1px dashed rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.45)"
};

const uploadButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: "0.8rem",
  padding: "0.8rem 0.95rem",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 700
};

const uploadHintStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.92rem"
};

const errorStyle: CSSProperties = {
  color: "#fda4af",
  margin: 0
};

const previewStyle: CSSProperties = {
  marginTop: "0.2rem",
  width: "96px",
  height: "96px",
  objectFit: "cover",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.2)"
};
