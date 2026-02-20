import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { createReview } from "../api/reviewsApi";
import { useAuth } from "../auth/AuthContext";

export default function ReviewCreatePage() {
  const { token, role } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const appointmentId = useMemo(() => {
    const raw = params.get("appointmentId");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [params]);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const canUse = !!token && role === "CLIENT" && typeof appointmentId === "number";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!token) {
      nav("/login", { replace: true, state: { from: `/reviews/new?appointmentId=${appointmentId ?? ""}` } });
      return;
    }

    if (role !== "CLIENT") {
      setError("Solo un cliente puede crear una reseña.");
      return;
    }

    if (!appointmentId) {
      setError("Falta appointmentId.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("La puntuación debe estar entre 1 y 5.");
      return;
    }

    if (!comment.trim()) {
      setError("Describe tu experiencia.");
      return;
    }

    try {
      setLoading(true);
      await createReview(token, { appointmentId, rating, comment: comment.trim(), wouldRecommend });
      setOk("¡Reseña enviada! Gracias 🖤");
      setTimeout(() => nav("/my-appointments"), 600);
    } catch (e: any) {
      if (e instanceof ApiError) {
        const body: any = e.body;
        const validationMsg =
          body?.errors
            ? Object.entries(body.errors).map(([k, v]) => `${k}: ${v}`).join(" | ")
            : "";

        setError(validationMsg || e.message || "Error creando reseña");
      } else {
        setError(e?.message || "Error creando reseña");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Dejar reseña</h1>
        <p>Para dejar una reseña tienes que iniciar sesión.</p>
        <button onClick={() => nav("/login", { state: { from: `/reviews/new?appointmentId=${appointmentId ?? ""}` } })}>
          Ir a login
        </button>
      </div>
    );
  }

  if (role !== "CLIENT") {
    return (
      <div style={{ padding: 16 }}>
        <h1>Dejar reseña</h1>
        <p>Solo un cliente puede crear reseñas.</p>
      </div>
    );
  }

  if (!appointmentId) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Dejar reseña</h1>
        <p style={{ color: "tomato" }}>Falta appointmentId en la URL.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 520 }}>
      <h1>Dejar reseña</h1>
      <p style={{ opacity: 0.8 }}>Cita #{appointmentId}</p>

      {error && <div style={{ color: "tomato", marginBottom: 12 }}>{error}</div>}
      {ok && <div style={{ color: "lightgreen", marginBottom: 12 }}>{ok}</div>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Puntuación (1-5)
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            disabled={!canUse || loading}
          />
        </label>

        <label>
          Comentario
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
            disabled={!canUse || loading}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={wouldRecommend}
            onChange={(e) => setWouldRecommend(e.target.checked)}
            disabled={!canUse || loading}
          />
          Recomendaría el estudio
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={!canUse || loading}>
            {loading ? "Enviando..." : "Enviar reseña"}
          </button>
          <button type="button" onClick={() => nav("/my-appointments")} disabled={loading}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}