import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getTattoo, updateTattoo } from "../api/tattoosApi";
import { useAuth } from "../auth/AuthContext";
import type { TattooInDto, TattooDto } from "../types/tattoo";

export default function AdminTattooEditPage() {
  const { token } = useAuth();
  const nav = useNavigate();
  const params = useParams();

  const tattooId = useMemo(() => {
    const n = Number(params.id);
    return Number.isFinite(n) ? n : null;
  }, [params.id]);

  const [original, setOriginal] = useState<TattooDto | null>(null);

  const [style, setStyle] = useState("");
  const [tattooDescription, setTattooDescription] = useState("");
  const [tattooDate, setTattooDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token || !tattooId) return;
    setError("");
    try {
      const t = await getTattoo(token, tattooId);
      setOriginal(t);

      setStyle(t.style ?? "");
      setTattooDescription(t.tattooDescription ?? "");
      setTattooDate(t.tattooDate ?? "");
      setImageUrl(t.imageUrl ?? "");
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : (e?.message || "Error cargando tattoo"));
    }
  };

  useEffect(() => {
    load();
  }, [token, tattooId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !tattooId || !original) return;

    setError("");
    setOk("");

    if (!style.trim()) {
      setError("El estilo es obligatorio.");
      return;
    }
    if (!tattooDescription.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (!tattooDate) {
      setError("La fecha es obligatoria.");
      return;
    }

    const payload: TattooInDto = {
      clientId: original.clientId,
      professionalId: original.professionalId,
      style: style.trim(),
      tattooDescription: tattooDescription.trim(),
      tattooDate,
      imageUrl: imageUrl.trim() ? imageUrl.trim() : null,
    };

    try {
      setLoading(true);
      await updateTattoo(token, tattooId, payload);
      setOk("Cambios guardados");
      setTimeout(() => nav("/admin/tattoos"), 500);
    } catch (e: any) {
      if (e instanceof ApiError) {
        const body: any = e.body;
        const validationMsg =
          body?.errors
            ? Object.entries(body.errors).map(([k, v]) => `${k}: ${v}`).join(" | ")
            : "";
        setError(validationMsg || e.message || "Error actualizando tattoo");
      } else {
        setError(e?.message || "Error actualizando tattoo");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tattooId) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Editar tattoo</h1>
        <p style={{ color: "tomato" }}>ID inválido</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 560 }}>
      <h1>Editar tattoo</h1>

      {error && <div style={{ color: "tomato", marginBottom: 12 }}>{error}</div>}
      {ok && <div style={{ color: "lightgreen", marginBottom: 12 }}>{ok}</div>}

      {!original && <p>Cargando…</p>}

      {original && (
        <>
          <p style={{ opacity: 0.8 }}>
            #{original.id} | clientId: {original.clientId} | professionalId: {original.professionalId}
          </p>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <label>
              Estilo
              <input
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                disabled={loading}
              />
            </label>

            <label>
              Descripción
              <textarea
                value={tattooDescription}
                onChange={(e) => setTattooDescription(e.target.value)}
                rows={4}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                disabled={loading}
              />
            </label>

            <label>
              Fecha
              <input
                type="date"
                value={tattooDate}
                onChange={(e) => setTattooDate(e.target.value)}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                disabled={loading}
              />
            </label>

            <label>
              Image URL (opcional)
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                disabled={loading}
              />
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" onClick={() => nav("/admin/tattoos")} disabled={loading}>
                Cancelar
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}