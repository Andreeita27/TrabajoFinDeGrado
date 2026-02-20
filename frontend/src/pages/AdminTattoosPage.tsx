import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/apiFetch";
import { deleteTattoo, getAllTattoos } from "../api/tattoosApi";
import type { TattooDto } from "../types/tattoo";

export default function AdminTattoosPage() {
  const { token } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState<TattooDto[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const data = await getAllTattoos(token);
      setItems(data);
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : (e?.message || "Error cargando tattoos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const onDelete = async (id: number) => {
    if (!token) return;
    const ok = window.confirm("¿Seguro que quieres eliminar este tattoo?");
    if (!ok) return;

    setError("");
    try {
      await deleteTattoo(token, id);
      await load();
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : (e?.message || "Error eliminando tattoo"));
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Gestionar tattoos</h1>
      <p style={{ opacity: 0.85 }}>
        Para registrar un tattoo nuevo, ve a <b>Gestionar citas</b> y marca una cita como <b>COMPLETED</b>.
      </p>

      {error && <div style={{ color: "tomato", marginBottom: 12 }}>{error}</div>}
      {loading && <p>Cargando...</p>}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((t) => (
          <div
            key={t.id}
            style={{
              border: "1px solid #333",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <div>
              <b>#{t.id}</b> — {t.style}
            </div>
            <div style={{ opacity: 0.9 }}>{t.tattooDescription}</div>
            <div style={{ opacity: 0.75 }}>
              Fecha: {t.tattooDate} | clientId: {t.clientId} | professionalId: {t.professionalId}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button onClick={() => nav(`/admin/tattoos/${t.id}/edit`)}>
                Editar
              </button>

              <button onClick={() => onDelete(t.id)}>Eliminar</button>
            </div>
          </div>
        ))}

        {!loading && items.length === 0 && <p style={{ opacity: 0.8 }}>No hay tattoos registrados.</p>}
      </div>
    </div>
  );
}