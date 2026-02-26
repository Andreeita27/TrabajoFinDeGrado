import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getAppointment } from "../api/appointmentsApi";
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

  const [item, setItem] = useState<AppointmentDto | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const backTo = isAdminPath ? "/admin/appointments" : "/my-appointments";

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

  useEffect(() => {
    load();
  }, [token, appointmentId]);

  // Soporta el campo actual (referenceImageUrl) y uno futuro tipo array (que no se si lo hare peeeeeero)
  const images: string[] = useMemo(() => {
    const out: string[] = [];
    if (item?.referenceImageUrl) out.push(item.referenceImageUrl);

    const maybeArray = (item as any)?.referenceImageUrls;
    if (Array.isArray(maybeArray)) {
      for (const u of maybeArray) {
        if (typeof u === "string" && u.trim()) out.push(u);
      }
    }

    // unique
    return Array.from(new Set(out));
  }, [item]);

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
          <div
            style={{
              border: "1px solid #333",
              borderRadius: 10,
              padding: 14,
              display: "grid",
              gap: 8,
            }}
          >
            <div>
              <b>Fecha:</b> {formatDate(String(item.startDateTime))}
            </div>

            <div>
              <b>Profesional:</b> {item.professionalName}
            </div>

            {(role === "ADMIN" || isAdminPath) && (
              <div>
                <b>Cliente:</b>{" "}
                {item.clientFullName ??
                  (`${item.clientName ?? ""} ${item.clientSurname ?? ""}`.trim() || `#${item.clientId}`)}
              </div>
            )}

            <div>
              <b>Estado:</b> {item.state}
            </div>

            <div>
              <b>Zona:</b> {item.bodyPlacement}
            </div>

            <div>
              <b>Tamaño:</b> {item.tattooSize}
            </div>

            <div>
              <b>Primera vez:</b> {item.firstTime ? "Sí" : "No"}
            </div>

            <div>
              <b>Duración:</b> {item.durationMinutes} min
            </div>

            <div>
              <b>Señal pagada:</b> {item.depositPaid ? "Sí" : "No"}
            </div>

            <div>
              <b>Descripción idea:</b>
              <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{item.ideaDescription}</div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #333",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Imágenes de inspiración</h2>

            {images.length === 0 ? (
              <div style={{ opacity: 0.85 }}>El cliente no ha subido imágenes.</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                {images.map((url, idx) => (
                  <a
                    key={`${url}-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <img
                      src={url}
                      alt={`Inspiración ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: 220,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: "1px solid #444",
                        display: "block",
                      }}
                      onError={(e) => {
                        // fallback visual si alguna URL está mal
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8, wordBreak: "break-all" }}>
                      Abrir imagen #{idx + 1}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}