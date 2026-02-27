import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getAppointment } from "../api/appointmentsApi";
import { createTattoo } from "../api/tattoosApi";
import { uploadPublicImage } from "../api/filesApi";
import { useAuth } from "../auth/AuthContext";
import type { TattooInDto } from "../types/tattoo";
import type { AppointmentDto } from "../types/appointment";

function toDateOnly(isoDateTime?: string | null) {
  if (!isoDateTime) return "";
  return isoDateTime.split("T")[0];
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

      setTattooDate(toDateOnly((a as any).startDateTime ?? (a as any).startDate ?? ""));
      setTattooDescription((a as any).ideaDescription ?? "");
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e?.message || "Error cargando la cita");
    }
  };

  useEffect(() => {
    load();
  }, [token, appointmentId]);

  const onPickImage = async (file: File) => {
    if (!token) return;
    setError("");
    setOk("");

    try {
      setUploadingImage(true);
      const url = await uploadPublicImage("tattoos", file, token);
      setImageUrl(url);
      setOk("Imagen subida");
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e?.message || "Error subiendo imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError("");
    setOk("");

    if (!appointmentId || !appointment) {
      setError("No se ha podido cargar la cita.");
      return;
    }

    if (appointment.state !== "COMPLETED") {
      setError("Solo se puede registrar un tattoo cuando la cita está COMPLETED.");
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
      setOk("Tattoo registrado");
      setTimeout(() => nav("/admin/tattoos"), 600);
    } catch (e: any) {
      if (e instanceof ApiError) {
        const body: any = e.body;
        const validationMsg = body?.errors
          ? Object.entries(body.errors)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" | ")
          : "";
        setError(validationMsg || e.message || "Error registrando tattoo");
      } else {
        setError(e?.message || "Error registrando tattoo");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!appointmentId) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Registrar tattoo</h1>
        <p style={{ color: "tomato" }}>ID de cita inválido.</p>
      </div>
    );
  }

  const previewUrl = imageUrl ? `${import.meta.env.VITE_API_BASE_URL}${imageUrl}` : "";

  return (
    <div style={{ padding: 16, maxWidth: 560 }}>
      <h1>Registrar tattoo</h1>
      <p style={{ opacity: 0.8 }}>Cita #{appointmentId}</p>

      {error && <div style={{ color: "tomato", marginBottom: 12 }}>{error}</div>}
      {ok && <div style={{ color: "lightgreen", marginBottom: 12 }}>{ok}</div>}

      {!appointment && <p>Cargando cita…</p>}

      {appointment && appointment.state !== "COMPLETED" && (
        <div style={{ border: "1px solid #444", borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <b>Estado actual:</b> {appointment.state}
          <p style={{ margin: "6px 0 0", opacity: 0.85 }}>
            Solo puedes registrar el tattoo cuando la cita esté <b>COMPLETED</b>.
          </p>
          <button onClick={() => nav("/admin/appointments")} style={{ marginTop: 10 }}>
            Volver a citas
          </button>
        </div>
      )}

      {appointment && appointment.state === "COMPLETED" && (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label>
            Estilo
            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
              disabled={loading || uploadingImage}
            />
          </label>

          <label>
            Descripción
            <textarea
              value={tattooDescription}
              onChange={(e) => setTattooDescription(e.target.value)}
              rows={4}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
              disabled={loading || uploadingImage}
            />
          </label>

          <label>
            Fecha
            <input
              type="date"
              value={tattooDate}
              onChange={(e) => setTattooDate(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
              disabled={loading || uploadingImage}
            />
          </label>

          <label>
            Sesiones
            <input
              type="number"
              min={1}
              value={sessions}
              onChange={(e) => setSessions(Number(e.target.value))}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
              disabled={loading || uploadingImage}
            />
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={coverUp}
              onChange={(e) => setCoverUp(e.target.checked)}
              disabled={loading || uploadingImage}
            />
            ¿Cover up?
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={color}
              onChange={(e) => setColor(e.target.checked)}
              disabled={loading || uploadingImage}
            />
            ¿A color?
          </label>

          <label>
            Imagen del tattoo
            <input
              type="file"
              accept="image/*"
              disabled={loading || uploadingImage}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                await onPickImage(f);
                // permite volver a seleccionar el mismo archivo
                e.currentTarget.value = "";
              }}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            />
          </label>

          {imageUrl && (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{imageUrl}</div>
              <img
                src={previewUrl}
                alt="Preview tattoo"
                style={{ maxWidth: 320, borderRadius: 8, border: "1px solid #444" }}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={loading || uploadingImage}>
              {loading ? "Guardando..." : "Registrar tattoo"}
            </button>
            <button type="button" onClick={() => nav("/admin/appointments")} disabled={loading || uploadingImage}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}