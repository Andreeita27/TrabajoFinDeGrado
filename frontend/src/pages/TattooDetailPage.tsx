import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTattooById } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";

export default function TattooDetailPage() {
  const { id } = useParams();
  const tattooId = Number(id);

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

      <h1 style={{ marginTop: 12 }}>{tattoo.tattooDescription}</h1>

      <img
        src={tattoo.imageUrl}
        alt={tattoo.tattooDescription}
        style={{ width: 320, maxWidth: "100%", margin: "12px 0" }}
      />

      <div style={{ display: "grid", gap: 8 }}>
        <div><strong>Estilo:</strong> {tattoo.style}</div>
        <div><strong>Fecha:</strong> {new Date(tattoo.tattooDate).toLocaleDateString()}</div>
        <div><strong>Profesional:</strong> {tattoo.professionalName ?? "Estudio 62 Rosas"}</div>
        <div><strong>Sesiones:</strong> {tattoo.sessions}</div>
        <div><strong>Cover Up:</strong> {tattoo.coverUp ? "Sí" : "No"}</div>
        <div><strong>Color:</strong> {tattoo.color ? "Sí" : "No"}</div>
      </div>
    </div>
  );
}