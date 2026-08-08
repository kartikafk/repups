import { C } from "../trainer/theme";

/**
 * Shared profile photo component.
 *
 * Used in TWO places:
 *   1. Trainer's own profile edit view -> <Avatar editable onFileSelect={...} />
 *   2. Client-facing trainer profile view -> <Avatar src={trainer.photoUrl} name={trainer.name} />
 *      (no `editable` prop, so it's automatically read-only there)
 *
 * Because both views read `photoUrl` off the same trainer object returned by
 * your API, whatever the trainer uploads shows up on the client view with
 * zero extra wiring — there is nothing to update per-view later.
 */
export default function Avatar({
  src,
  name = "",
  size = 80,
  editable = false,
  uploading = false,
  error = "",
  onFileSelect,
}) {
  const initials = name
    ? name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "?";

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: src ? `center/cover no-repeat url(${src})` : C.limeGlow,
    border: `2px solid ${C.lime}44`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: size * 0.35,
    fontWeight: 800,
    color: C.lime,
    flexShrink: 0,
    position: "relative",
    overflow: "hidden",
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) onFileSelect(file);
    e.target.value = ""; // allow re-selecting the same file later
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <div style={circleStyle}>
          {!src && initials}
          {uploading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#000000a0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff",
                textAlign: "center",
              }}
            >
              Uploading…
            </div>
          )}
        </div>

        {editable && !uploading && (
          <label
            title="Change photo"
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: C.lime,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: `2px solid ${C.bg || "#0d0d0d"}`,
              fontSize: 13,
            }}
          >
            📷
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={handleChange}
            />
          </label>
        )}
      </div>

      {editable && error && (
        <div style={{ fontSize: 11, color: C.red, maxWidth: size + 60 }}>{error}</div>
      )}
    </div>
  );
}