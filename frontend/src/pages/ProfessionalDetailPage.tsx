import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getTattoos } from "../api/showroomApi";
import { deleteProfessional, getProfessional, updateProfessional } from "../api/professionalsApi";
import { uploadPublicImage } from "../api/filesApi";
import { useAuth } from "../auth/AuthContext";
import type { ProfessionalDto } from "../types/professional";
import type { TattooDto } from "../types/tattoo";

type FormState = Omit<ProfessionalDto, "id">;

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function withBase(url?: string | null) {
  if (!url) return "";
  // Si ya es absoluta (http...) la dejo tal cual
  if (/^https?:\/\//i.test(url)) return url;
  // Si es relativa (/uploads/...), la convierto a absoluta
  return `${BASE_URL}${url}`;
}

export default function ProfessionalDetailPage() {
  const nav = useNavigate();
  const params = useParams();
  const { role, token } = useAuth();
  const isAdmin = role === "ADMIN";

  const professionalId = useMemo(() => {
    const n = Number(params.id);
    return Number.isFinite(n) ? n : null;
  }, [params.id]);

  const [pro, setPro] = useState<ProfessionalDto | null>(null);
  const [latest, setLatest] = useState<TattooDto[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);

  const formatBirthDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      const d = new Date(`${iso}T00:00:00`);
      if (Number.isNaN(d.getTime())) return iso;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return iso;
    }
  };

  // Edición
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState<FormState>({
    professionalName: "",
    style: "",
    birthDate: "",
    description: "",
    profilePhoto: "",
    booksOpened: true,
    yearsExperience: 0,
  });

  const validate = (): string | null => {
    if (!form.professionalName.trim()) return "El nombre del profesional es obligatorio.";
    if (!form.style.trim()) return "El estilo es obligatorio.";
    if (!form.birthDate) return "La fecha de nacimiento es obligatoria.";
    if (!form.description.trim()) return "La descripción es obligatoria.";
    if (!form.profilePhoto.trim()) return "Debes subir una foto de perfil.";
    if (!Number.isFinite(form.yearsExperience) || form.yearsExperience < 0)
      return "Los años de experiencia deben ser 0 o más.";
    return null;
  };

  const loadPro = async () => {
    if (!professionalId) {
      setError("ID inválido");
      setLoading(false);
      return;
    }

    setError("");
    setOk("");
    setLoading(true);

    try {
      const p = await getProfessional(professionalId);
      setPro(p);
      setForm({
        professionalName: p.professionalName ?? "",
        style: p.style ?? "",
        birthDate: p.birthDate ?? "",
        description: p.description ?? "",
        profilePhoto: p.profilePhoto ?? "",
        booksOpened: !!p.booksOpened,
        yearsExperience: Number.isFinite(p.yearsExperience) ? p.yearsExperience : 0,
      });
    } catch (e: any) {
      setError(e?.message || "Error cargando profesional");
    } finally {
      setLoading(false);
    }
  };

  const loadLatest = async () => {
    if (!professionalId) return;

    try {
      const res = await getTattoos({ professionalId });
      const sorted = [...res].sort((a, b) => {
        const ad = (a as any).tattooDate ? Date.parse((a as any).tattooDate) : NaN;
        const bd = (b as any).tattooDate ? Date.parse((b as any).tattooDate) : NaN;
        if (Number.isFinite(ad) && Number.isFinite(bd)) return bd - ad;
        return (b.id ?? 0) - (a.id ?? 0);
      });
      setLatest(sorted.slice(0, 3));
    } catch {
      setLatest([]);
    }
  };

  useEffect(() => {
    loadPro();
  }, [professionalId]);

  useEffect(() => {
    loadLatest();
  }, [professionalId]);

  const onStartEdit = () => {
    if (!isAdmin) return;
    setError("");
    setOk("");
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onCancelEdit = () => {
    if (!pro) return;
    setError("");
    setOk("");
    setEditing(false);
    setForm({
      professionalName: pro.professionalName ?? "",
      style: pro.style ?? "",
      birthDate: pro.birthDate ?? "",
      description: pro.description ?? "",
      profilePhoto: pro.profilePhoto ?? "",
      booksOpened: !!pro.booksOpened,
      yearsExperience: Number.isFinite(pro.yearsExperience) ? pro.yearsExperience : 0,
    });
  };

  const onPickProfilePhoto = async (file: File) => {
    if (!isAdmin || !token) return;

    setError("");
    setOk("");

    try {
      setUploadingPhoto(true);
      const url = await uploadPublicImage("professionals", file, token);
      setForm({ ...form, profilePhoto: url });
      setOk("Foto subida");
    } catch (e: any) {
      setError(e instanceof ApiError ? e.message : e?.message || "Error subiendo foto");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !token || !professionalId) return;

    setError("");
    setOk("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setSaving(true);
      const payload: ProfessionalDto = { id: professionalId, ...form };
      await updateProfessional(token, professionalId, payload);
      setOk("Profesional actualizado");
      setEditing(false);
      await loadPro();
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true });
        return;
      }
      setError(e?.message || "Error guardando profesional");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!isAdmin || !token || !professionalId) return;

    const okConfirm = window.confirm("¿Seguro que quieres eliminar este profesional?");
    if (!okConfirm) return;

    setError("");
    setOk("");

    try {
      await deleteProfessional(token, professionalId);
      nav("/professionals", { replace: true });
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true });
        return;
      }
      setError(e?.message || "Error eliminando profesional");
    }
  };

  if (!professionalId) {
    return (
      <div style={{ padding: 16 }}>
        <button onClick={() => nav(-1)}>Volver</button>
        <p style={{ color: "tomato" }}>ID inválido</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => nav(-1)}>Volver</button>
        <h1 style={{ margin: 0 }}>Profesional</h1>
      </div>

      {error && <div style={{ color: "tomato", marginBottom: 10 }}>{error}</div>}
      {ok && <div style={{ color: "lightgreen", marginBottom: 10 }}>{ok}</div>}

      {loading ? (
        <div style={{ opacity: 0.85 }}>Cargando…</div>
      ) : !pro ? (
        <div style={{ opacity: 0.85 }}>No encontrado.</div>
      ) : (
        <>
          {isAdmin && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {!editing ? (
                <>
                  <button onClick={onStartEdit} disabled={!token}>
                    Editar
                  </button>
                  <button onClick={onDelete} disabled={!token}>
                    Eliminar
                  </button>
                </>
              ) : null}
            </div>
          )}

          {isAdmin && editing ? (
            <div style={{ border: "1px solid #333", borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <h2 style={{ marginTop: 0 }}>Editar profesional</h2>

              <form onSubmit={onSave} style={{ display: "grid", gap: 12, maxWidth: 760 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  Nombre profesional
                  <input
                    value={form.professionalName}
                    onChange={(e) => setForm({ ...form, professionalName: e.target.value })}
                    style={{ width: "100%", padding: 8 }}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  Estilo
                  <input
                    value={form.style}
                    onChange={(e) => setForm({ ...form, style: e.target.value })}
                    style={{ width: "100%", padding: 8 }}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  Fecha de nacimiento
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    style={{ width: "100%", padding: 8 }}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  Años de experiencia
                  <input
                    type="number"
                    min={0}
                    value={form.yearsExperience}
                    onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
                    style={{ width: "100%", padding: 8 }}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.booksOpened}
                    onChange={(e) => setForm({ ...form, booksOpened: e.target.checked })}
                    disabled={saving || uploadingPhoto}
                  />
                  Agenda abierta
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  Descripción
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    style={{ width: "100%", padding: 8 }}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  Foto de perfil
                  <input
                    type="file"
                    accept="image/*"
                    disabled={saving || uploadingPhoto}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      await onPickProfilePhoto(f);
                      e.currentTarget.value = "";
                    }}
                    style={{ width: "100%", padding: 8 }}
                  />
                </label>

                {form.profilePhoto.trim() && (
                  <img
                    src={withBase(form.profilePhoto)}
                    alt="preview"
                    style={{
                      width: 180,
                      height: 180,
                      objectFit: "cover",
                      border: "1px solid #333",
                      borderRadius: 12,
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="submit" disabled={saving || uploadingPhoto || !token}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button type="button" onClick={onCancelEdit} disabled={saving || uploadingPhoto}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ border: "1px solid #333", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                {pro.profilePhoto?.trim() && (
                  <img
                    src={withBase(pro.profilePhoto)}
                    alt={pro.professionalName}
                    style={{
                      width: 240,
                      height: 240,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid #333",
                    }}
                  />
                )}

                <div style={{ flex: 1, minWidth: 280 }}>
                  <h2 style={{ marginTop: 0, marginBottom: 6 }}>{pro.professionalName}</h2>

                  <div style={{ opacity: 0.9, marginBottom: 10 }}>
                    <b>Estilo:</b> {pro.style}
                  </div>

                  <div style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>{pro.description}</div>

                  <div style={{ marginTop: 14, display: "grid", gap: 6, opacity: 0.9 }}>
                    <div>
                      <b>Años de experiencia:</b> {pro.yearsExperience}
                    </div>
                    <div>
                      <b>Agenda:</b> {pro.booksOpened ? "Abierta" : "Cerrada"}
                    </div>
                    <div>
                      <b>Fecha de nacimiento:</b> {formatBirthDate(pro.birthDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, border: "1px solid #333", borderRadius: 12, padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Últimos trabajos</h3>

            {latest.length === 0 ? (
              <div style={{ opacity: 0.85 }}>Todavía no hay trabajos publicados.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {latest.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    onClick={() => nav(`/showroom/${t.id}`)}
                    style={{
                      border: "1px solid #333",
                      borderRadius: 12,
                      padding: 10,
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={withBase(t.imageUrl)}
                      alt={t.tattooDescription}
                      style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700 }}>{t.style}</div>
                      <div style={{ opacity: 0.8, fontSize: 12 }}>
                        {t.tattooDescription?.trim() ? t.tattooDescription : "Tattoo"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}