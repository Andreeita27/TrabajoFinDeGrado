import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getAppointment } from "../api/appointmentsApi";
import { createTattoo } from "../api/tattoosApi";
import { uploadPublicImage } from "../api/filesApi";
import { useAuth } from "../auth/AuthContext";
import type { TattooInDto } from "../types/tattoo";
import type { AppointmentDto } from "../types/appointment";
import "../styles/adminTattooCreate.css";

function toDateOnly(isoDateTime?: string | null) {
  if (!isoDateTime) return "";
  return isoDateTime.split("T")[0];
}

function withBase(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${import.meta.env.VITE_API_BASE_URL}${url}`;
}

function formatState(state?: string) {
  switch (state) {
    case "PENDING":
      return "Pendiente";
    case "CONFIRMED":
      return "Confirmada";
    case "CANCELLED":
      return "Cancelada";
    case "COMPLETED":
      return "Completada";
    case "NO_SHOW":
      return "No asistió";
    default:
      return state ?? "-";
  }
}

function getStateBadgeClass(state?: string) {
  switch (state) {
    case "PENDING":
      return "admin-tattoo-create-badge admin-tattoo-create-badge--pending";
    case "CONFIRMED":
      return "admin-tattoo-create-badge admin-tattoo-create-badge--confirmed";
    case "CANCELLED":
      return "admin-tattoo-create-badge admin-tattoo-create-badge--cancelled";
    case "COMPLETED":
      return "admin-tattoo-create-badge admin-tattoo-create-badge--completed";
    case "NO_SHOW":
      return "admin-tattoo-create-badge admin-tattoo-create-badge--no-show";
    default:
      return "admin-tattoo-create-badge";
  }
}

export default function AdminTattooCreatePage() {
  const { token } = useAuth();
  const nav = useNavigate();
  const params = useParams();

  const appointmentId = useMemo(() => {
    const n = Number(params.id);
    return Number.isFinite(n) ? n : null;
  }, [params.id]);

  const [appointment, setAppointment] = useState<AppointmentDto | null>(null);

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

  const load = async () => {
    if (!token || !appointmentId) return;
    setError("");

    try {
      const a = await getAppointment(token, appointmentId);
      setAppointment(a);

      setTattooDate(toDateOnly(a.startDateTime));
      setTattooDescription(a.ideaDescription ?? "");
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error cargando la cita");
      }
    }
  };

  useEffect(() => {
    load();
  }, [token, appointmentId]);

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

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setError("");
    setOk("");

    if (!appointmentId || !appointment) {
      setError("No se ha podido cargar la cita.");
      return;
    }

    if (appointment.state !== "COMPLETED") {
      setError("Solo se puede registrar un tattoo cuando la cita está completada.");
      return;
    }

    if (!style.trim()) {
      setError("El estilo es obligatorio.");
      return;
    }

    if (!tattooDescription.trim()) {
      setError("La descripción del tattoo es obligatoria.");
      return;
    }

    if (!tattooDate) {
      setError("La fecha del tattoo es obligatoria.");
      return;
    }

    if (!imageUrl.trim()) {
      setError("Debes subir una imagen.");
      return;
    }

    if (!Number.isFinite(sessions) || sessions < 1) {
      setError("Las sesiones deben ser 1 o más.");
      return;
    }

    const clientId = (appointment as any).clientId;
    const professionalId = (appointment as any).professionalId;

    if (!clientId || !professionalId) {
      setError("La cita no tiene clientId/professionalId, no se puede registrar el tattoo.");
      return;
    }

    const payload: TattooInDto = {
      clientId,
      professionalId,
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
      await createTattoo(token, payload);
      setOk("Tattoo registrado correctamente.");
      setTimeout(() => nav("/showroom"), 600);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        const body = e.body as { errors?: Record<string, string> } | undefined;

        const validationMsg = body?.errors
          ? Object.entries(body.errors)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" | ")
          : "";

        setError(validationMsg || e.message || "Error registrando tattoo");
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error registrando tattoo");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!appointmentId) {
    return (
      <div className="admin-tattoo-create-page">
        <header className="admin-tattoo-create-hero">
          <p className="admin-tattoo-create-kicker">Panel de administración</p>
          <h1 className="admin-tattoo-create-title">Registrar tattoo</h1>
        </header>

        <div className="admin-tattoo-create-feedback admin-tattoo-create-feedback--error">
          ID de cita inválido.
        </div>
      </div>
    );
  }

  const previewUrl = localPreview || withBase(imageUrl);
  const clientName =
    (appointment as any)?.clientFullName ??
    `${(appointment as any)?.clientName ?? ""} ${(appointment as any)?.clientSurname ?? ""}`.trim();
  const professionalName =
    (appointment as any)?.professionalName ?? "(sin profesional)";

  return (
    <div className="admin-tattoo-create-page">
      <button
        type="button"
        onClick={() => nav("/admin/appointments")}
        className="admin-tattoo-create-back"
      >
        ← Volver a citas
      </button>

      <header className="admin-tattoo-create-hero">
        <p className="admin-tattoo-create-kicker">Panel de administración</p>
        <h1 className="admin-tattoo-create-title">Registrar tattoo</h1>
        <p className="admin-tattoo-create-text">
          Crea el tattoo final a partir de una cita terminada y publícalo después
          en el showroom con una imagen cuidada y toda su información completa.
        </p>
      </header>

      {error && (
        <div className="admin-tattoo-create-feedback admin-tattoo-create-feedback--error">
          {error}
        </div>
      )}

      {ok && (
        <div className="admin-tattoo-create-feedback admin-tattoo-create-feedback--success">
          {ok}
        </div>
      )}

      {!appointment ? (
        <div className="admin-tattoo-create-panel">
          <p className="admin-tattoo-create-loading">Cargando cita…</p>
        </div>
      ) : (
        <div className="admin-tattoo-create-grid">
          <section className="admin-tattoo-create-panel">
            <h2 className="admin-tattoo-create-panel__title">Datos de origen</h2>
            <p className="admin-tattoo-create-panel__text">
              Esta información proviene de la cita asociada. Revísala antes de
              registrar el tattoo definitivo.
            </p>

            <div className="admin-tattoo-create-info">
              <div className="admin-tattoo-create-info-row">
                <span className="admin-tattoo-create-info-key">Cita</span>
                <span className="admin-tattoo-create-info-val">#{appointmentId}</span>
              </div>

              <div className="admin-tattoo-create-info-row">
                <span className="admin-tattoo-create-info-key">Estado</span>
                <span className="admin-tattoo-create-info-val">
                  <span className={getStateBadgeClass(appointment.state)}>
                    {formatState(appointment.state)}
                  </span>
                </span>
              </div>

              <div className="admin-tattoo-create-info-row">
                <span className="admin-tattoo-create-info-key">Cliente</span>
                <span className="admin-tattoo-create-info-val">
                  {clientName || "(sin nombre)"}
                </span>
              </div>

              <div className="admin-tattoo-create-info-row">
                <span className="admin-tattoo-create-info-key">Profesional</span>
                <span className="admin-tattoo-create-info-val">
                  {professionalName}
                </span>
              </div>
            </div>

            {appointment.state !== "COMPLETED" ? (
              <div className="admin-tattoo-create-state-box">
                <strong>Estado actual: {formatState(appointment.state)}</strong>
                <p>
                  Solo puedes registrar el tattoo cuando la cita esté
                  <strong> completada</strong>.
                </p>

                <div className="admin-tattoo-create-actions" style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => nav("/admin/appointments")}
                    className="admin-tattoo-create-btn admin-tattoo-create-btn--ghost"
                  >
                    Volver a citas
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="admin-tattoo-create-form">
                <label className="admin-tattoo-create-field">
                  <span className="admin-tattoo-create-label">Estilo</span>
                  <input
                    className="input"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    disabled={loading || uploadingImage}
                  />
                </label>

                <label className="admin-tattoo-create-field">
                  <span className="admin-tattoo-create-label">Descripción</span>
                  <textarea
                    value={tattooDescription}
                    onChange={(e) => setTattooDescription(e.target.value)}
                    rows={5}
                    disabled={loading || uploadingImage}
                  />
                </label>

                <label className="admin-tattoo-create-field">
                  <span className="admin-tattoo-create-label">Fecha</span>
                  <input
                    className="input"
                    type="date"
                    value={tattooDate}
                    onChange={(e) => setTattooDate(e.target.value)}
                    disabled={loading || uploadingImage}
                  />
                </label>

                <label className="admin-tattoo-create-field">
                  <span className="admin-tattoo-create-label">Sesiones</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={sessions}
                    onChange={(e) => setSessions(Number(e.target.value))}
                    disabled={loading || uploadingImage}
                  />
                </label>

                <div className="admin-tattoo-create-checks">
                  <label className="admin-tattoo-create-check">
                    <input
                      type="checkbox"
                      checked={coverUp}
                      onChange={(e) => setCoverUp(e.target.checked)}
                      disabled={loading || uploadingImage}
                    />
                    <span>¿Es un cover up?</span>
                  </label>

                  <label className="admin-tattoo-create-check">
                    <input
                      type="checkbox"
                      checked={color}
                      onChange={(e) => setColor(e.target.checked)}
                      disabled={loading || uploadingImage}
                    />
                    <span>¿Es a color?</span>
                  </label>
                </div>

                <div className="admin-tattoo-create-upload">
                  <label className="admin-tattoo-create-field">
                    <span className="admin-tattoo-create-label">Imagen del tattoo</span>

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

                  <p className="admin-tattoo-create-upload-note">
                    Sube la imagen final que quieres mostrar en el showroom.
                  </p>
                </div>

                <div className="admin-tattoo-create-actions">
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="admin-tattoo-create-btn admin-tattoo-create-btn--primary"
                  >
                    {loading ? "Guardando..." : "Registrar tattoo"}
                  </button>

                  <button
                    type="button"
                    onClick={() => nav("/admin/appointments")}
                    disabled={loading || uploadingImage}
                    className="admin-tattoo-create-btn admin-tattoo-create-btn--ghost"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="admin-tattoo-create-panel">
            <h2 className="admin-tattoo-create-panel__title">Vista previa</h2>
            <p className="admin-tattoo-create-panel__text">
              Comprueba la imagen antes de guardar el tattoo definitivo.
            </p>

            {previewUrl ? (
              <div className="admin-tattoo-create-preview-wrap">
                <div className="admin-tattoo-create-preview-url">{imageUrl}</div>

                <div className="admin-tattoo-create-preview">
                  <img src={previewUrl} alt="Vista previa del tattoo" />
                </div>
              </div>
            ) : (
              <div className="admin-tattoo-create-empty">
                Todavía no has subido una imagen para este tattoo.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}