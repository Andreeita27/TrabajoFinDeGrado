import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import {
  getAppointment,
  uploadAppointmentReferenceImage,
  fetchAppointmentReferenceImageUrl,
} from "../api/appointmentsApi";
import { useAuth } from "../auth/AuthContext";
import type { AppointmentDto } from "../types/appointment";
import "../styles/appointmentDetail.css";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatAppointmentType(type?: string) {
  return type === "CONSULTATION" ? "Consulta" : "Sesión de tatuaje";
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
    default:
      return state ?? "-";
  }
}

function getStateBadgeClass(state?: string) {
  switch (state) {
    case "PENDING":
      return "apdStatus apdStatus--pending";
    case "CONFIRMED":
      return "apdStatus apdStatus--confirmed";
    case "CANCELLED":
      return "apdStatus apdStatus--cancelled";
    case "COMPLETED":
      return "apdStatus apdStatus--completed";
    case "NO_SHOW":
      return "apdStatus apdStatus--no-show";
    default:
      return "apdStatus";
  }
}

function formatTattooSize(size?: string) {
  switch (size) {
    case "SMALL":
      return "Pequeño";
    case "MEDIUM":
      return "Mediano";
    case "LARGE":
      return "Grande";
    case "XL":
      return "Extra grande";
    default:
      return size ?? "-";
  }
}

export default function AppointmentDetailPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();
  const params = useParams();
  const loc = useLocation();

  const appointmentId = useMemo(() => {
    const n = Number(params.id);
    return Number.isFinite(n) ? n : null;
  }, [params.id]);

  const isAdminPath = loc.pathname.startsWith("/admin");
  const backTo = isAdminPath ? "/admin/appointments" : "/my-appointments";

  const [item, setItem] = useState<AppointmentDto | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [refUrl, setRefUrl] = useState<string>("");
  const [localRefPreview, setLocalRefPreview] = useState<string>("");
  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const canSeeClientInfo = role === "ADMIN" || isAdminPath;

  const load = async () => {
    if (!token) return;

    if (!appointmentId) {
      setError("ID de cita inválido.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await getAppointment(token, appointmentId);
      setItem(data);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 401) {
        nav("/login", { replace: true, state: { from: loc.pathname } });
        return;
      }

      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error cargando el detalle de la cita");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, appointmentId]);

  useEffect(() => {
    setRefUrl("");
    setRefError("");

    if (!token || !appointmentId) return;
    if (!item?.referenceImageUrl) return;

    let alive = true;
    setRefLoading(true);

    fetchAppointmentReferenceImageUrl(token, appointmentId)
      .then((data) => {
        if (!alive) return;
        if (!data?.referenceImageUrl) return;
        setRefUrl(data.referenceImageUrl);
      })
      .catch((e: any) => {
        if (!alive) return;
        setRefError(e?.message || "No se pudo cargar la imagen de referencia");
      })
      .finally(() => {
        if (alive) setRefLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token, appointmentId, item?.referenceImageUrl]);

  useEffect(() => {
    return () => {
      if (localRefPreview) {
        URL.revokeObjectURL(localRefPreview);
      }
    };
  }, [localRefPreview]);

  const onUploadReference = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !appointmentId) return;

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setRefError("Selecciona una imagen.");
      return;
    }

    setRefError("");

    try {
      setUploading(true);
      const uploaded = await uploadAppointmentReferenceImage(token, appointmentId, file);

      await load();

      if (localRefPreview) {
        URL.revokeObjectURL(localRefPreview);
      }
      setLocalRefPreview("");

      setRefUrl(uploaded.referenceImageUrl || "");
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true, state: { from: loc.pathname } });
        return;
      }

      if (e instanceof Error) {
        setRefError(e.message);
      } else {
        setRefError("Error subiendo imagen de referencia");
      }
    } finally {
      setUploading(false);
      setRefLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clientText =
    item?.clientFullName ??
    (`${item?.clientName ?? ""} ${item?.clientSurname ?? ""}`.trim() ||
      (item?.clientId ? `#${item.clientId}` : "-"));

  return (
    <div className="apd">
      <button type="button" onClick={() => nav(backTo)} className="apdBack">
        ← Volver
      </button>

      <header className="apdHeader">
        <p className="apdKicker">Gestión de citas</p>

        <div className="apdTitleRow">
          <div>
            <h1 className="apdTitle">Detalle de cita</h1>
            <p className="apdSubtitle">
              Consulta toda la información de la reserva, revisa la idea del
              tatuaje y gestiona la imagen de referencia desde un mismo sitio.
            </p>
          </div>

          {item?.state && (
            <div className={getStateBadgeClass(item.state)}>
              {formatState(item.state)}
            </div>
          )}
        </div>
      </header>

      {loading && (
        <div className="apdFeedback apdFeedback--muted">
          <span className="apdLoading">Cargando detalle de la cita…</span>
        </div>
      )}

      {error && (
        <div className="apdFeedback apdFeedback--error">{error}</div>
      )}

      {!loading && !error && !item && (
        <div className="apdFeedback apdFeedback--muted">
          No se ha encontrado la cita.
        </div>
      )}

      {item && (
        <div className="apdGrid">
          <section className="apdCard">
            <div className="apdCard__body">
              <h2 className="apdSectionTitle">Información de la cita</h2>

              <div className="apdMeta">
                <div className="apdMetaRow">
                  <span className="apdMetaKey">Fecha y hora</span>
                  <span className="apdMetaVal">
                    {formatDate(String(item.startDateTime))}
                  </span>
                </div>

                <div className="apdMetaRow">
                  <span className="apdMetaKey">Tipo</span>
                  <span className="apdMetaVal">
                    {formatAppointmentType(item.appointmentType)}
                  </span>
                </div>

                <div className="apdMetaRow">
                  <span className="apdMetaKey">Profesional</span>
                  <span className="apdMetaVal">{item.professionalName}</span>
                </div>

                {canSeeClientInfo && (
                  <div className="apdMetaRow">
                    <span className="apdMetaKey">Cliente</span>
                    <span className="apdMetaVal">{clientText}</span>
                  </div>
                )}

                <div className="apdMetaRow">
                  <span className="apdMetaKey">Estado</span>
                  <span className="apdMetaVal">{formatState(item.state)}</span>
                </div>

                <div className="apdMetaRow">
                  <span className="apdMetaKey">Primera vez</span>
                  <span className="apdMetaVal">
                    {item.firstTime ? "Sí" : "No"}
                  </span>
                </div>

                <div className="apdMetaRow">
                  <span className="apdMetaKey">Duración</span>
                  <span className="apdMetaVal">
                    {item.durationMinutes} min
                  </span>
                </div>

                {item.appointmentType === "TATTOO" && (
                  <div className="apdMetaRow">
                    <span className="apdMetaKey">Zona</span>
                    <span className="apdMetaVal">
                      {item.bodyPlacement || "-"}
                    </span>
                  </div>
                )}

                {item.appointmentType === "TATTOO" && (
                  <div className="apdMetaRow">
                    <span className="apdMetaKey">Tamaño</span>
                    <span className="apdMetaVal">
                      {formatTattooSize(item.tattooSize)}
                    </span>
                  </div>
                )}

                {item.appointmentType === "TATTOO" && (
                  <div className="apdMetaRow">
                    <span className="apdMetaKey">Señal pagada</span>
                    <span className="apdMetaVal">
                      {item.depositPaid ? "Sí" : "No"}
                    </span>
                  </div>
                )}
              </div>

              <div className="apdDescription">
                <p className="apdDescriptionLabel">Descripción de la idea</p>
                <p className="apdDescriptionText">
                  {item.ideaDescription || "No se ha indicado ninguna descripción."}
                </p>
              </div>
            </div>
          </section>

          <section className="apdCard">
            {item.referenceImageUrl ? (
              <div className="apdHeroMedia">
                {refLoading ? (
                  <div className="apdEmptyMedia">
                    <div className="apdEmptyBox">Cargando imagen de referencia…</div>
                  </div>
                ) : (localRefPreview || refUrl) ? (
                  <>
                    <img src={localRefPreview || refUrl} alt="Imagen de referencia de la cita" />
                    <div className="apdHeroShade" />
                    <div className="apdHeroBadge">Imagen de referencia</div>
                  </>
                ) : (
                  <div className="apdEmptyMedia">
                    <div className="apdEmptyBox">
                      No se ha podido mostrar la imagen de referencia.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="apdEmptyMedia">
                <div className="apdEmptyBox">
                  {role === "CLIENT" ? (
                    <>
                      <strong>Aún no has subido ninguna imagen.</strong>
                      <br />
                      Puedes añadir una imagen de referencia para que el
                      tatuador entienda mejor tu idea y la adapte al diseño.
                    </>
                  ) : (
                    <>
                      <strong>Sin imagen de referencia.</strong>
                      <br />
                      El cliente todavía no ha subido ninguna imagen para esta cita.
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="apdUploadArea">
              <h2 className="apdSectionTitle" style={{ marginBottom: "0.5rem" }}>
                Imagen de referencia
              </h2>
              <p className="apdSectionText">
                Aquí puedes revisar la imagen asociada a la cita o añadir una
                nueva.
              </p>

              {refError && (
                <div
                  className="apdFeedback apdFeedback--error"
                  style={{ marginTop: "1rem", marginBottom: "0" }}
                >
                  {refError}
                </div>
              )}

              {role === "CLIENT" && (
                <form
                  onSubmit={onUploadReference}
                  className="apdUploadForm"
                  style={{ marginTop: "1rem" }}
                >
                  <label className="file-upload">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      disabled={uploading || !token}
                      className="apdFileInput"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (localRefPreview) {
                          URL.revokeObjectURL(localRefPreview);
                        }

                        const preview = URL.createObjectURL(file);
                        setLocalRefPreview(preview);
                        setRefError("");
                      }}
                    />

                    <span className="file-upload__button">
                      Seleccionar imagen
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={uploading || !token}
                    className="apdButton apdButton--primary"
                  >
                    {uploading ? "Subiendo..." : "Subir imagen"}
                  </button>
                </form>
              )}

              <p className="apdUploadNote">
                {role === "CLIENT"
                  ? "Puedes subir una imagen para que el profesional tenga una referencia visual más clara."
                  : "Las imágenes de referencia ayudan a preparar mejor el diseño antes de la sesión."}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}