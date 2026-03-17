import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getTattoo, updateTattoo } from "../api/tattoosApi";
import { uploadPublicImage } from "../api/publicFilesApi";
import { useAuth } from "../auth/AuthContext";
import type { TattooInDto, TattooDto } from "../types/tattoo";
import "../styles/adminTattooEdit.css";

function withBase(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${import.meta.env.VITE_API_BASE_URL}${url}`;
}

function formatBoolean(value?: boolean) {
  return value ? "Sí" : "No";
}

export default function AdminTattooEditPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();
  const params = useParams();

  const tattooId = useMemo(() => {
    const n = Number(params.id);
    return Number.isFinite(n) ? n : null;
  }, [params.id]);

  const [original, setOriginal] = useState<TattooDto | null>(null);

  const [style, setStyle] = useState("");
  const [tattooDescription, setTattooDescription] = useState("");
  const [tattooDate, setTattooDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [localPreview, setLocalPreview] = useState("");

  const [sessions, setSessions] = useState<number>(1);
  const [coverUp, setCoverUp] = useState(false);
  const [color, setColor] = useState(false);

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const backTo = tattooId ? `/showroom/${tattooId}` : "/showroom";

  const load = async () => {
    if (!token || !tattooId) return;
    setError("");
    try {
      const t = await getTattoo(token, tattooId);
      setOriginal(t);

      setStyle(t.style ?? "");
      setTattooDescription(t.tattooDescription ?? "");
      setTattooDate(t.tattooDate ?? "");
      setImageUrl(t.imageUrl ?? "");

      setSessions(typeof t.sessions === "number" && t.sessions > 0 ? t.sessions : 1);
      setCoverUp(!!t.coverUp);
      setColor(!!t.color);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error cargando tattoo");
      }
    }
  };

  useEffect(() => {
    if (!token) {
      nav("/login", { replace: true, state: { from: backTo } });
      return;
    }
    if (role !== "ADMIN") {
      nav("/showroom", { replace: true });
      return;
    }
  }, [token, role, nav, backTo]);

  useEffect(() => {
    if (!token || role !== "ADMIN") return;
    load();
  }, [token, role, tattooId]);

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const onPickImage = async (file: File) => {
    if (!token) return;

    setError("");
    setOk("");

    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);

    try {
      setUploadingImage(true);
      const url = await uploadPublicImage("tattoos", file, token);
      setImageUrl(url);
      setOk("Imagen subida correctamente.");
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error subiendo imagen");
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || role !== "ADMIN" || !tattooId || !original) return;

    setError("");
    setOk("");

    if (!style.trim()) return setError("El estilo es obligatorio.");
    if (!tattooDescription.trim()) return setError("La descripción es obligatoria.");
    if (!tattooDate) return setError("La fecha es obligatoria.");
    if (!imageUrl.trim()) return setError("Debes subir una imagen.");
    if (!Number.isFinite(sessions) || sessions < 1) {
      return setError("Las sesiones deben ser 1 o más.");
    }

    const payload: TattooInDto = {
      clientId: original.clientId,
      professionalId: original.professionalId,
      style: style.trim(),
      tattooDescription: tattooDescription.trim(),
      tattooDate,
      imageUrl: imageUrl.trim(),
      sessions,
      coverUp,
      color,
    };

    try {
      setLoading(true);
      await updateTattoo(token, tattooId, payload);
      setOk("Cambios guardados correctamente.");

      setTimeout(() => nav(backTo, { replace: true }), 300);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        const body = e.body as { errors?: Record<string, string> } | undefined;

        const validationMsg = body?.errors
          ? Object.entries(body.errors)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" | ")
          : "";

        setError(validationMsg || e.message || "Error actualizando tattoo");
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error actualizando tattoo");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tattooId) {
    return (
      <div className="admin-tattoo-edit-page">
        <header className="admin-tattoo-edit-hero">
          <p className="admin-tattoo-edit-kicker">Panel de administración</p>
          <h1 className="admin-tattoo-edit-title">Editar tattoo</h1>
        </header>

        <div className="admin-tattoo-edit-feedback admin-tattoo-edit-feedback--error">
          ID inválido.
        </div>
      </div>
    );
  }

  const previewUrl = localPreview || withBase(imageUrl);

  return (
    <div className="admin-tattoo-edit-page">
      <button
        type="button"
        onClick={() => nav(backTo)}
        className="admin-tattoo-edit-back"
      >
        ← Volver
      </button>

      <header className="admin-tattoo-edit-hero">
        <p className="admin-tattoo-edit-kicker">Panel de administración</p>
        <h1 className="admin-tattoo-edit-title">Editar tattoo</h1>
        <p className="admin-tattoo-edit-text">
          Actualiza la información del tattoo, sustituye la imagen pública si lo
          necesitas y revisa rápidamente los datos asociados al cliente y al profesional.
        </p>
      </header>

      {error && (
        <div className="admin-tattoo-edit-feedback admin-tattoo-edit-feedback--error">
          {error}
        </div>
      )}

      {ok && (
        <div className="admin-tattoo-edit-feedback admin-tattoo-edit-feedback--success">
          {ok}
        </div>
      )}

      {!original ? (
        <div className="admin-tattoo-edit-panel">
          <p className="admin-tattoo-edit-loading">Cargando tattoo…</p>
        </div>
      ) : (
        <div className="admin-tattoo-edit-grid">
          <section className="admin-tattoo-edit-panel">
            <h2 className="admin-tattoo-edit-panel__title">Datos del tattoo</h2>
            <p className="admin-tattoo-edit-panel__text">
              Modifica el contenido que se mostrará en el showroom público.
            </p>

            <div className="admin-tattoo-edit-info" style={{ marginBottom: "1rem" }}>
              <div className="admin-tattoo-edit-info-row">
                <span className="admin-tattoo-edit-info-key">Cliente</span>
                <span className="admin-tattoo-edit-info-val">
                  {original.clientName || "(sin nombre)"}
                </span>
              </div>

              <div className="admin-tattoo-edit-info-row">
                <span className="admin-tattoo-edit-info-key">Profesional</span>
                <span className="admin-tattoo-edit-info-val">
                  {original.professionalName || "(sin profesional)"}
                </span>
              </div>

              <div className="admin-tattoo-edit-info-row">
                <span className="admin-tattoo-edit-info-key">Cover up actual</span>
                <span className="admin-tattoo-edit-info-val">
                  {formatBoolean(original.coverUp)}
                </span>
              </div>

              <div className="admin-tattoo-edit-info-row">
                <span className="admin-tattoo-edit-info-key">Color actual</span>
                <span className="admin-tattoo-edit-info-val">
                  {formatBoolean(original.color)}
                </span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="admin-tattoo-edit-form">
              <label className="admin-tattoo-edit-field">
                <span className="admin-tattoo-edit-label">Estilo</span>
                <input
                  className="input"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  disabled={loading || uploadingImage}
                />
              </label>

              <label className="admin-tattoo-edit-field">
                <span className="admin-tattoo-edit-label">Descripción</span>
                <textarea
                  value={tattooDescription}
                  onChange={(e) => setTattooDescription(e.target.value)}
                  rows={5}
                  disabled={loading || uploadingImage}
                />
              </label>

              <label className="admin-tattoo-edit-field">
                <span className="admin-tattoo-edit-label">Fecha</span>
                <input
                  className="input"
                  type="date"
                  value={tattooDate}
                  onChange={(e) => setTattooDate(e.target.value)}
                  disabled={loading || uploadingImage}
                />
              </label>

              <label className="admin-tattoo-edit-field">
                <span className="admin-tattoo-edit-label">Sesiones</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={sessions}
                  onChange={(e) => setSessions(Number(e.target.value))}
                  disabled={loading || uploadingImage}
                />
              </label>

              <div className="admin-tattoo-edit-checks">
                <label className="admin-tattoo-edit-check">
                  <input
                    type="checkbox"
                    checked={coverUp}
                    onChange={(e) => setCoverUp(e.target.checked)}
                    disabled={loading || uploadingImage}
                  />
                  <span>¿Es un cover up?</span>
                </label>

                <label className="admin-tattoo-edit-check">
                  <input
                    type="checkbox"
                    checked={color}
                    onChange={(e) => setColor(e.target.checked)}
                    disabled={loading || uploadingImage}
                  />
                  <span>¿Es a color?</span>
                </label>
              </div>

              <div className="admin-tattoo-edit-upload">
                <label className="admin-tattoo-edit-field">
                  <span className="admin-tattoo-edit-label">Imagen del tattoo</span>

                  <label className="file-upload">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={loading || uploadingImage}
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        await onPickImage(f);
                        e.currentTarget.value = "";
                      }}
                    />

                    <span className="file-upload__button">
                      {uploadingImage ? "Subiendo..." : "Seleccionar imagen"}
                    </span>
                  </label>
                </label>

                <p className="admin-tattoo-edit-upload-note">
                  Sube una nueva imagen si quieres reemplazar la actual del showroom.
                </p>
              </div>

              <div className="admin-tattoo-edit-actions">
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="admin-tattoo-edit-btn admin-tattoo-edit-btn--primary"
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  onClick={() => nav(backTo)}
                  disabled={loading || uploadingImage}
                  className="admin-tattoo-edit-btn admin-tattoo-edit-btn--ghost"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>

          <section className="admin-tattoo-edit-panel">
            <h2 className="admin-tattoo-edit-panel__title">Vista previa</h2>
            <p className="admin-tattoo-edit-panel__text">
              Comprueba la imagen que se mostrará al público antes de guardar.
            </p>

            {previewUrl ? (
              <div className="admin-tattoo-edit-preview-wrap">
                <div className="admin-tattoo-edit-preview-url">{imageUrl}</div>

                <div className="admin-tattoo-edit-preview">
                  <img src={previewUrl} alt="Vista previa del tattoo" />
                </div>
              </div>
            ) : (
              <div className="admin-tattoo-edit-empty">
                Todavía no hay una imagen seleccionada para este tattoo.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}