import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getAppointment, uploadAppointmentReferenceImage, fetchAppointmentReferenceImageBlob } from "../api/appointmentsApi";
import { useAuth } from "../auth/AuthContext";
import type { AppointmentDto } from "../types/appointment";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES");
  } catch {
    return iso;
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

  const [refUrl, setRefUrl] = useState<string>(""); // objectURL
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
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        nav("/login", { replace: true, state: { from: loc.pathname } });
        return;
      }
      setError(e?.message || "Error cargando el detalle de la cita");
    } finally {
      setLoading(false);
    }
  };

  // Carga principal
  useEffect(() => {
    load();
  }, [token, appointmentId]);

  // Cargar la imagen privada como blob cuando haya cita
  useEffect(() => {
    // Limpieza del objectURL anterior
    if (refUrl) URL.revokeObjectURL(refUrl);
    setRefUrl("");
    setRefError("");

    if (!token) return;
    if (!appointmentId) return;

    setRefLoading(true);

    fetchAppointmentReferenceImageBlob(token, appointmentId)
      .then((blob) => {
        if (!blob || blob.size === 0) return;
        const url = URL.createObjectURL(blob);
        setRefUrl(url);
      })
      .catch((e: any) => {
        // Si no hay imagen aún
        if (e instanceof ApiError && e.status === 404) return;
        setRefError(e?.message || "No se pudo cargar la imagen de referencia");
      })
      .finally(() => setRefLoading(false));

  }, [token, appointmentId]);

  const onUploadReference = async (e: React.FormEvent) => {
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
      await uploadAppointmentReferenceImage(token, appointmentId, file);

      // refrescamos: recargar cita + recargar blob
      await load();

      // Fuerza recarga del blob: reseteo state y vuelvo a pedirlo
      if (refUrl) URL.revokeObjectURL(refUrl);
      setRefUrl("");

      setRefLoading(true);
      const blob = await fetchAppointmentReferenceImageBlob(token, appointmentId);
      if (blob && blob.size > 0) setRefUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true, state: { from: loc.pathname } });
        return;
      }
      setRefError(e?.message || "Error subiendo imagen de referencia");
    } finally {
      setUploading(false);
      setRefLoading(false);

      // Limpia el input para poder re-subir la misma imagen si quieres
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => nav(backTo)}>Volver</button>
        <h1 style={{ margin: 0 }}>Detalle de cita</h1>
      </div>

      {loading && <div style={{ marginTop: 12, opacity: 0.8 }}>Cargando…</div>}
      {error && <div style={{ marginTop: 12, color: "tomato" }}>{error}</div>}

      {!loading && !error && !item && <div style={{ marginTop: 12 }}>No encontrada.</div>}

      {item && (
        <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
          <div style={{ border: "1px solid #333", borderRadius: 10, padding: 14, display: "grid", gap: 8 }}>
            <div>
              <b>Fecha:</b> {formatDate(String(item.startDateTime))}
            </div>

            <div>
              <b>Tipo:</b> {item.appointmentType === "CONSULTATION" ? "Consulta" : "Sesión de tatuaje"}
            </div>

            <div>
              <b>Profesional:</b> {item.professionalName}
            </div>

            {canSeeClientInfo && (
              <div>
                <b>Cliente:</b>{" "}
                {item.clientFullName ?? (`${item.clientName ?? ""} ${item.clientSurname ?? ""}`.trim() || `#${item.clientId}`)}
              </div>
            )}

            <div>
              <b>Estado:</b> {item.state}
            </div>

            {item.appointmentType === "TATTOO" && (
              <div>
                <b>Zona:</b> {item.bodyPlacement}
              </div>
            )}

            {item.appointmentType === "TATTOO" && (
              <div>
                <b>Tamaño:</b> {item.tattooSize}
              </div>
            )}

            <div>
              <b>Primera vez:</b> {item.firstTime ? "Sí" : "No"}
            </div>

            <div>
              <b>Duración:</b> {item.durationMinutes} min
            </div>

            {item.appointmentType === "TATTOO" && (
              <div>
                <b>Señal pagada:</b> {item.depositPaid ? "Sí" : "No"}
              </div>
            )}

            <div>
              <b>Descripción idea:</b>
              <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{item.ideaDescription}</div>
            </div>
          </div>

          <div style={{ border: "1px solid #333", borderRadius: 10, padding: 14 }}>
            <h2 style={{ marginTop: 0 }}>Imágenes de inspiración</h2>

            {refError && <div style={{ color: "tomato", marginBottom: 10 }}>{refError}</div>}

            <div style={{ display: "grid", gap: 12 }}>
              {/* Preview */}
              {refLoading ? (
                <div style={{ opacity: 0.85 }}>Cargando imagen…</div>
              ) : refUrl ? (
                <img
                  src={refUrl}
                  alt="Imagen de referencia"
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    height: 320,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid #444",
                  }}
                />
              ) : (
                <div style={{ opacity: 0.85 }}>El cliente no ha subido imágenes.</div>
              )}

              {/* Subida */}
              <form onSubmit={onUploadReference} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input ref={fileRef} type="file" accept="image/*" disabled={uploading || !token} />
                <button type="submit" disabled={uploading || !token}>
                  {uploading ? "Subiendo..." : "Subir imagen"}
                </button>
              </form>

              <div style={{ fontSize: 12, opacity: 0.75 }}>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}