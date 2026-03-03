import { useRef, useState } from "react";

type Props = {
  label: string;
  accept?: string;
  disabled?: boolean;
  initialUrl?: string; // "/uploads/..."
  onUpload: (file: File) => Promise<string>; // devuelve url
  onChangeUrl: (url: string) => void;
};

export default function ImageUploadField({
  label,
  accept = "image/*",
  disabled,
  initialUrl,
  onUpload,
  onChangeUrl,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(initialUrl || "");
  const [error, setError] = useState("");

  const handlePick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const newUrl = await onUpload(file);
      setUrl(newUrl);
      onChangeUrl(newUrl);
    } catch (err: any) {
      setError(err?.message || "Error subiendo imagen");
    } finally {
      setUploading(false);
      // permite volver a seleccionar el mismo archivo
      e.target.value = "";
    }
  };

  const fullUrl = url ? `${import.meta.env.VITE_API_BASE_URL}${url}` : "";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label style={{ fontWeight: 600 }}>{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled || uploading}
        onChange={handleChange}
        style={{ display: "none" }}
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={handlePick} disabled={disabled || uploading}>
          {uploading ? "Subiendo..." : "Seleccionar imagen"}
        </button>

        {url && (
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            {url}
          </span>
        )}
      </div>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {fullUrl && (
        <img
          src={fullUrl}
          alt="Preview"
          style={{ maxWidth: 320, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)" }}
        />
      )}
    </div>
  );
}