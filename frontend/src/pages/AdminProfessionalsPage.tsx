import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { createProfessional, deleteProfessional, updateProfessional } from "../api/professionalsApi";
import { getProfessionals } from "../api/showroomApi";
import { useAuth } from "../auth/AuthContext";
import type { ProfessionalDto } from "../types/professional";

type FormState = Omit<ProfessionalDto, "id">;

const emptyForm: FormState = {
  professionalName: "",
  birthDate: "",
  description: "",
  profilePhoto: "",
  booksOpened: true,
  yearsExperience: 0,
};

export default function AdminProfessionalsPage() {
  const { token } = useAuth();

  const [items, setItems] = useState<ProfessionalDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [searchName, setSearchName] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [showForm, setShowForm] = useState(false);

  const isEditing = useMemo(() => typeof editingId === "number", [editingId]);

  const load = async () => {
    setError("");
    setOk("");
    setLoading(true);
    try {
      const data = await getProfessionals(
        searchName.trim() ? { professionalName: searchName.trim() } : undefined
      );
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

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOk("");
    setError("");
    setShowForm(false);
  };

  const startEdit = (p: ProfessionalDto) => {
    setEditingId(p.id);
    setForm({
      professionalName: p.professionalName ?? "",
      birthDate: p.birthDate ?? "",
      description: p.description ?? "",
      profilePhoto: p.profilePhoto ?? "",
      booksOpened: !!p.booksOpened,
      yearsExperience: Number.isFinite(p.yearsExperience) ? p.yearsExperience : 0,
    });
    setOk("");
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validate = (): string | null => {
    if (!form.professionalName.trim()) return "El nombre del profesional es obligatorio.";
    if (!form.birthDate) return "La fecha de nacimiento es obligatoria.";
    if (!form.description.trim()) return "La descripción es obligatoria.";
    if (!form.profilePhoto.trim()) return "La URL de la foto de perfil es obligatoria.";
    if (!Number.isFinite(form.yearsExperience) || form.yearsExperience < 0)
      return "Los años de experiencia deben ser 0 o más.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!token) {
      setError("Inicia sesión como admin.");
      return;
    }

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);

      if (isEditing && editingId !== null) {
        const payload: ProfessionalDto = { id: editingId, ...form };
        await updateProfessional(token, editingId, payload);
        setOk("Profesional actualizado");
      } else {
        await createProfessional(token, form);
        setOk("Profesional creado");
      }

      resetForm();
      await load();
    } catch (e: any) {
      if (e instanceof ApiError) {
        const body: any = e.body;
        const validationMsg =
          body?.errors
            ? Object.entries(body.errors).map(([k, v]) => `${k}: ${v}`).join(" | ")
            : "";
        setError(validationMsg || e.message || "Error guardando profesional");
      } else {
        setError(e?.message || "Error guardando profesional");
      }
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!token) {
      setError("Inicia sesión como admin.");
      return;
    }

    const okConfirm = window.confirm("¿Seguro que quieres eliminar este profesional?");
    if (!okConfirm) return;

    setError("");
    setOk("");

    try {
      setLoading(true);
      await deleteProfessional(token, id);
      setOk("Profesional eliminado");
      await load();
    } catch (e: any) {
      if (e instanceof ApiError) setError(e.message || "Error eliminando profesional");
      else setError(e?.message || "Error eliminando profesional");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Gestionar Profesionales</h1>

      <div style={{ marginBottom: 12 }}>
        <Link to="/admin">Volver al panel</Link>
      </div>

      {error && <div style={{ color: "tomato", marginBottom: 12 }}>{error}</div>}
      {ok && <div style={{ color: "lightgreen", marginBottom: 12 }}>{ok}</div>}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          placeholder="Buscar por nombre…"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          style={{ padding: 8, width: 260 }}
        />
        <button onClick={load} disabled={loading}>
          Buscar
        </button>
        <button
          onClick={() => {
            setSearchName("");
            setTimeout(load, 0);
          }}
          disabled={loading}
        >
          Limpiar
        </button>

        <div style={{ flex: 1 }} />
        {!showForm ? (
          <button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setError("");
              setOk("");
              setShowForm(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={loading || !token}
          >
            Añadir profesional
          </button>
        ) : (
          <button onClick={resetForm} disabled={loading}>
            Cerrar formulario
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ border: "1px solid #333", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>{isEditing ? "Editar profesional" : "Crear profesional"}</h2>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 700 }}>
            <label>
              Nombre profesional
              <input
                value={form.professionalName}
                onChange={(e) => setForm({ ...form, professionalName: e.target.value })}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                disabled={loading}
              />
            </label>

            <label>
              Fecha de nacimiento
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                disabled={loading}
              />
            </label>

            <label>
              Años de experiencia
              <input
                type="number"
                min={0}
                value={form.yearsExperience}
                onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                disabled={loading}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.booksOpened}
                onChange={(e) => setForm({ ...form, booksOpened: e.target.checked })}
                disabled={loading}
              />
              Agenda abierta
            </label>

            <label>
              Descripción
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                disabled={loading}
              />
            </label>

            <label>
              Foto de perfil
              <input
                value={form.profilePhoto}
                onChange={(e) => setForm({ ...form, profilePhoto: e.target.value })}
                style={{ display: "block", width: "100%", padding: 8, marginTop: 6 }}
                disabled={loading}
              />
            </label>

            {form.profilePhoto.trim() && (
              <img
                src={form.profilePhoto}
                alt="preview"
                style={{ width: 160, border: "1px solid #333", borderRadius: 8 }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={loading || !token}>
                {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear profesional"}
              </button>

              <button type="button" onClick={resetForm} disabled={loading}>
                Cancelar
              </button>
            </div>

            {!token && (
              <div style={{ color: "tomato" }}>
                Inicia sesión como admin para crear/editar/borrar.
              </div>
            )}
          </form>
        </div>
      )}

      <h2>Listado</h2>
      {loading && <p>Cargando…</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid #333",
              borderRadius: 8,
              padding: 12,
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <b>{p.professionalName}</b>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(p)} disabled={loading || !token}>
                  Editar
                </button>
                <button onClick={() => onDelete(p.id)} disabled={loading || !token}>
                  Eliminar
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <img
                src={p.profilePhoto}
                alt={p.professionalName}
                style={{ width: 120, borderRadius: 8, border: "1px solid #333" }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ opacity: 0.85 }}>{p.description}</div>
                <div style={{ opacity: 0.75, marginTop: 6 }}>
                  Nacimiento: {p.birthDate} · Experiencia: {p.yearsExperience} años ·{" "}
                  {p.booksOpened ? "Agenda abierta" : "Agenda cerrada"}
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