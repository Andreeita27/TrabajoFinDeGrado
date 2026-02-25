import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTattooById } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";
import { useAuth } from "../auth/AuthContext";
import { deleteTattoo } from "../api/tattoosApi";
import { ApiError } from "../api/apiFetch";

export default function TattooDetailPage() {
  const { id } = useParams();
  const tattooId = Number(id);

  const nav = useNavigate();
  const { role, token } = useAuth();
  const isAdmin = role === "ADMIN";

  const [tattoo, setTattoo] = useState<TattooDto | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setTattoo(null);

    if (!Number.isFinite(tattooId)) {
      setError("ID de tattoo inválido.");
      return;
    }

    getTattooById(tattooId)
      .then(setTattoo)
      .catch((e) => setError(e?.message || "Error cargando el tattoo"));
  }, [tattooId]);

  const onEdit = () => {
    if (!isAdmin) return;
    nav(`/admin/tattoos/${tattooId}/edit`);
  };

  const onDelete = async () => {
    if (!isAdmin) return;

    if (!token) {
      nav("/login", { replace: true, state: { from: `/showroom/${tattooId}` } });
      return;
    }

    const ok = window.confirm("¿Seguro que quieres eliminar este tattoo?");
    if (!ok) return;

    setError("");
    try {
      await deleteTattoo(token, tattooId);
      nav("/showroom", { replace: true });
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        nav("/login", { replace: true });
        return;
      }
      setError(err?.message || "Error eliminando tattoo");
    }
  };

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <p style={{ color: "tomato" }}>{error}</p>
        <Link to="/showroom">← Volver al showroom</Link>
      </div>
    );
  }

  if (!tattoo) {
    return <div style={{ padding: 16 }}>Cargando tattoo…</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <Link to="/showroom">← Volver al showroom</Link>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <h1 style={{ marginTop: 12, marginBottom: 6 }}>{tattoo.tattooDescription}</h1>

        {isAdmin && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onEdit}>Editar</button>
            <button type="button" onClick={onDelete}>Eliminar</button>
          </div>
        )}
      </div>

      <img
        src={tattoo.imageUrl}
        alt={tattoo.tattooDescription}
        style={{ width: 320, maxWidth: "100%", margin: "12px 0" }}
      />

      <div style={{ display: "grid", gap: 8 }}>
        <div><strong>Estilo:</strong> {tattoo.style}</div>

        <div>
          <strong>Fecha:</strong>{" "}
          {tattoo.tattooDate ? new Date(tattoo.tattooDate).toLocaleDateString() : "—"}
        </div>

        <div><strong>Profesional:</strong> {tattoo.professionalName ?? "Estudio 62 Rosas"}</div>
        <div><strong>Sesiones:</strong> {tattoo.sessions}</div>
        <div><strong>Cover Up:</strong> {tattoo.coverUp ? "Sí" : "No"}</div>
        <div><strong>Color:</strong> {tattoo.color ? "Sí" : "No"}</div>
      </div>
    </div>
  );
}