import { useEffect, useState } from "react";
import { getTattoos } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";

export default function ShowroomPage() {
  const [items, setItems] = useState<TattooDto[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getTattoos()
      .then(setItems)
      .catch((e) => setError(e?.message || "Error cargando tattoos"));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Showroom</h1>

      {error && <div style={{ color: "tomato" }}>{error}</div>}

      <div style={{ display: "grid", gap: 20 }}>
        {items.map((t) => (
          <div key={t.id} style={{ border: "1px solid #333", padding: 12 }}>
            
            <img
              src={t.imageUrl}
              alt={t.tattooDescription}
              style={{ width: 200 }}
            />

            <h3>{t.tattooDescription}</h3>

            <p>Estilo: {t.style}</p>

            <p>
              Profesional: {t.professionalName ?? "Estudio 62 Rosas"}
            </p>

            <p>Fecha: {new Date(t.tattooDate).toLocaleDateString()}</p>

            <p>
              {t.color ? "Color" : "Blanco y negro"} —{" "}
              {t.coverUp ? "Cover Up" : "No Cover Up"}
            </p>

            <p>Sesiones: {t.sessions}</p>
          </div>
        ))}
      </div>
    </div>
  );
}