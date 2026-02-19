import { useEffect, useState } from "react";
import { getTattoos } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";

export default function ShowroomPage() {
  const [items, setItems] = useState<TattooDto[]>([]);
  const [error, setError] = useState("");

  const [style, setStyle] = useState("");
  const [coverUp, setCoverUp] = useState<boolean | undefined>(undefined);
  const [color, setColor] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    getTattoos({
      style: style || undefined,
      coverUp,
      color
    })
      .then(setItems)
      .catch((e) => setError(e?.message || "Error cargando tattoos"));
  }, [style, coverUp, color]);

  return (
    <div style={{ padding: 16 }}>
      <h1>Showroom</h1>

      <div style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          placeholder="Filtrar por estilo"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        />

        <select onChange={(e) => setCoverUp(
          e.target.value === "" ? undefined : e.target.value === "true"
        )}>
          <option value="">Cover Up (todos)</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>

        <select onChange={(e) => setColor(
          e.target.value === "" ? undefined : e.target.value === "true"
        )}>
          <option value="">Color (todos)</option>
          <option value="true">Color</option>
          <option value="false">Blanco y negro</option>
        </select>
      </div>

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

            <p>
              {t.color ? "Color" : "Blanco y negro"} —{" "}
              {t.coverUp ? "Cover Up" : "No Cover Up"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}