import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfessionals } from "../api/showroomApi";
import type { ProfessionalDto } from "../types/professional";

export default function ProfessionalsPage() {
  const nav = useNavigate();

  const [items, setItems] = useState<ProfessionalDto[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await getProfessionals();
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Error cargando profesionales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Profesionales</h1>

      {error && <div style={{ color: "tomato", marginBottom: 10 }}>{error}</div>}
      {loading && <div style={{ opacity: 0.85, marginBottom: 10 }}>Cargando…</div>}

      <div style={{ display: "grid", gap: 16 }}>
        {items.map((p) => (
          <div
            key={p.id}
            role="button"
            onClick={() => nav(`/professionals/${p.id}`)}
            style={{
              border: "1px solid #333",
              padding: 12,
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <img
                src={p.profilePhoto}
                alt={p.professionalName}
                style={{
                  width: 100,
                  height: 100,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #333",
                  flexShrink: 0,
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>{p.professionalName}</h3>

                <div style={{ marginTop: 6, opacity: 0.9 }}>
                  <b>Estilo:</b> {p.style}
                </div>

                <div style={{ marginTop: 6, opacity: 0.85 }}>
                  <b>Agenda:</b> {p.booksOpened ? "Abierta" : "Cerrada"}
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && items.length === 0 && <p style={{ opacity: 0.8 }}>No hay profesionales.</p>}
      </div>
    </div>
  );
}