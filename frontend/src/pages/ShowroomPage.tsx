import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTattoos } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";

export default function ShowroomPage() {
  const nav = useNavigate();

  const [items, setItems] = useState<TattooDto[]>([]);
  const [error, setError] = useState("");

  const [style, setStyle] = useState("");
  const [coverUp, setCoverUp] = useState<boolean | undefined>(undefined);
  const [color, setColor] = useState<boolean | undefined>(undefined);

  const load = async () => {
    setError("");
    try {
      const data = await getTattoos({
        style: style || undefined,
        coverUp,
        color,
      });
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Error cargando tattoos");
    }
  };

  useEffect(() => {
    load();
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

        <select
          value={typeof coverUp === "boolean" ? String(coverUp) : ""}
          onChange={(e) => setCoverUp(e.target.value === "" ? undefined : e.target.value === "true")}
        >
          <option value="">Cover Up (todos)</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>

        <select
          value={typeof color === "boolean" ? String(color) : ""}
          onChange={(e) => setColor(e.target.value === "" ? undefined : e.target.value === "true")}
        >
          <option value="">Color (todos)</option>
          <option value="true">Color</option>
          <option value="false">Blanco y negro</option>
        </select>
      </div>

      {error && <div style={{ color: "tomato" }}>{error}</div>}

      <div style={{ display: "grid", gap: 20 }}>
        {items.map((t) => (
          <div
            key={t.id}
            onClick={() => nav(`/showroom/${t.id}`)}
            role="button"
            style={{
              border: "1px solid #333",
              padding: 12,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <img
              src={t.imageUrl}
              alt={t.tattooDescription}
              style={{
                width: "100%",
                height: 220,
                objectFit: "cover",
                borderRadius: 6,
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
              <div>
                <h3 style={{ margin: 0 }}>{t.style}</h3>
                <p style={{ color: "#888", marginTop: 6 }}>
                  {t.professionalName ?? "Estudio 62 Rosas"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}