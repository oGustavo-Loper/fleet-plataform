import { useRef, type CSSProperties } from "react";

type Props = {
  photoUrl?: string;
  alt: string;
  loading?: boolean;
  error?: string;
  onSelect: (file: File | null) => Promise<void> | void;
};

export function AvatarPickerField({ photoUrl, alt, loading, error, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div style={wrapperStyle}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={hiddenInputStyle}
        onChange={async (event) => {
          const file = event.target.files?.[0] ?? null;
          await onSelect(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        style={avatarButtonStyle}
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        aria-label="Selecionar foto"
      >
        {photoUrl ? (
          <img src={photoUrl} alt={alt} style={avatarImageStyle} />
        ) : (
          <span style={avatarPlaceholderStyle}>📷</span>
        )}
        <span style={avatarBadgeStyle}>{loading ? "…" : "✎"}</span>
      </button>
      {error ? (
        <p style={errorStyle} role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const wrapperStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "0.5rem",
  marginBottom: "0.5rem"
};

const hiddenInputStyle: CSSProperties = {
  display: "none"
};

const avatarButtonStyle: CSSProperties = {
  position: "relative",
  width: "5.5rem",
  height: "5.5rem",
  borderRadius: "999px",
  border: "1px dashed rgba(148, 163, 184, 0.4)",
  background: "rgba(15, 23, 42, 0.6)",
  padding: 0,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  overflow: "visible"
};

const avatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "999px",
  objectFit: "cover"
};

const avatarPlaceholderStyle: CSSProperties = {
  fontSize: "1.6rem",
  color: "#94a3b8"
};

const avatarBadgeStyle: CSSProperties = {
  position: "absolute",
  bottom: "-0.15rem",
  right: "-0.15rem",
  width: "1.6rem",
  height: "1.6rem",
  borderRadius: "999px",
  background: "#fbbf24",
  color: "#0f172a",
  display: "grid",
  placeItems: "center",
  fontSize: "0.8rem",
  border: "2px solid #0f172a"
};

const errorStyle: CSSProperties = {
  color: "#fda4af",
  margin: 0,
  fontSize: "0.85rem"
};
