import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getTattoos } from "../api/showroomApi";
import { deleteProfessional, getProfessional, updateProfessional } from "../api/professionalsApi";
import { uploadPublicImage } from "../api/filesApi";
import { useAuth } from "../auth/AuthContext";
import type { ProfessionalDto } from "../types/professional";
import type { TattooDto } from "../types/tattoo";
import "../styles/professionalDetail.css";

type FormState = Omit<ProfessionalDto, "id">;

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function withBase(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
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

  const validate = (): string | null => {
    if (!form.professionalName.trim()) return "El nombre del profesional es obligatorio.";
    if (!form.style.trim()) return "El estilo es obligatorio.";
    if (!form.birthDate) return "La fecha de nacimiento es obligatoria.";
    if (!form.description.trim()) return "La descripción es obligatoria.";
    if (!form.profilePhoto.trim()) return "Debes subir una foto de perfil.";
    if (!Number.isFinite(form.yearsExperience) || form.yearsExperience < 0) {
      return "Los años de experiencia deben ser 0 o más.";
    }
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
      setOk("Foto subida correctamente");
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
      <main className="professional-detail-page">
        <div className="professional-detail__topbar">
          <button className="btn btn-ghost" onClick={() => nav(-1)}>
            Volver
          </button>
        </div>
        <div className="professional-detail__feedback professional-detail__feedback--error">
          ID inválido
        </div>
      </main>
    );
  }

  return (
    <main className="professional-detail-page">
      <div className="professional-detail__topbar">
        <button className="btn btn-ghost" onClick={() => nav(-1)}>
          Volver
        </button>

        {isAdmin && !loading && pro && !editing && (
          <div className="professional-detail__adminActions">
            <button className="btn btn-ghost" onClick={onStartEdit} disabled={!token}>
              Editar
            </button>
            <button className="btn btn-primary" onClick={onDelete} disabled={!token}>
              Eliminar
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="professional-detail__feedback professional-detail__feedback--error">
          {error}
        </div>
      )}
      {ok && <div className="professional-detail__feedback professional-detail__feedback--ok">{ok}</div>}

      {loading ? (
        <div className="professional-detail__feedback">Cargando profesional…</div>
      ) : !pro ? (
        <div className="professional-detail__feedback">No encontrado.</div>
      ) : (
        <>
          {isAdmin && editing ? (
            <section className="professional-edit-card">
              <div className="professional-edit-card__header">
                <p className="professional-edit-card__kicker">Panel de edición</p>
                <h1 className="professional-edit-card__title">Editar profesional</h1>
              </div>

              <form className="professional-edit-form" onSubmit={onSave}>
                <label className="professional-edit-form__field">
                  <span>Nombre profesional</span>
                  <input
                    value={form.professionalName}
                    onChange={(e) => setForm({ ...form, professionalName: e.target.value })}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label className="professional-edit-form__field">
                  <span>Estilo</span>
                  <input
                    value={form.style}
                    onChange={(e) => setForm({ ...form, style: e.target.value })}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label className="professional-edit-form__field">
                  <span>Fecha de nacimiento</span>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label className="professional-edit-form__field">
                  <span>Años de experiencia</span>
                  <input
                    type="number"
                    min={0}
                    value={form.yearsExperience}
                    onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label className="professional-edit-form__checkbox">
                  <input
                    type="checkbox"
                    checked={form.booksOpened}
                    onChange={(e) => setForm({ ...form, booksOpened: e.target.checked })}
                    disabled={saving || uploadingPhoto}
                  />
                  <span>Agenda abierta</span>
                </label>

                <label className="professional-edit-form__field professional-edit-form__field--full">
                  <span>Descripción</span>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    disabled={saving || uploadingPhoto}
                  />
                </label>

                <label className="professional-edit-form__field professional-edit-form__field--full">
                  <span>Foto de perfil</span>
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
                  />
                </label>

                {form.profilePhoto.trim() && (
                  <div className="professional-edit-form__previewWrap">
                    <img
                      src={withBase(form.profilePhoto)}
                      alt="Vista previa"
                      className="professional-edit-form__preview"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="professional-edit-form__actions">
                  <button type="submit" className="btn btn-primary" disabled={saving || uploadingPhoto || !token}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onCancelEdit}
                    disabled={saving || uploadingPhoto}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <section className="professional-detail-card">
              <div className="professional-detail-card__imageCol">
                {pro.profilePhoto?.trim() ? (
                  <img
                    src={withBase(pro.profilePhoto)}
                    alt={pro.professionalName}
                    className="professional-detail-card__image"
                  />
                ) : (
                  <div className="professional-detail-card__imagePlaceholder">62</div>
                )}
              </div>

              <div className="professional-detail-card__content">
                <p className="professional-detail-card__kicker">Perfil profesional</p>
                <h1 className="professional-detail-card__title">{pro.professionalName}</h1>

                <div className="professional-detail-card__meta">
                  <span className="professional-detail-card__badge">{pro.style}</span>
                  <span
                    className={`professional-detail-card__badge ${
                      pro.booksOpened
                        ? "professional-detail-card__badge--open"
                        : "professional-detail-card__badge--closed"
                    }`}
                  >
                    {pro.booksOpened ? "Agenda abierta" : "Agenda cerrada"}
                  </span>
                </div>

                <p className="professional-detail-card__description">{pro.description}</p>

                <div className="professional-detail-card__facts">
                  <div className="professional-detail-card__fact">
                    <span>Experiencia</span>
                    <strong>{pro.yearsExperience} años</strong>
                  </div>

                  <div className="professional-detail-card__fact">
                    <span>Fecha de nacimiento</span>
                    <strong>{formatBirthDate(pro.birthDate)}</strong>
                  </div>
                </div>

                <div className="professional-detail-card__cta">
                  <button className="btn btn-primary" onClick={() => nav("/calendar")}>
                    Reservar cita
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="professional-works">
            <div className="professional-works__header">
              <p className="professional-works__kicker">Showroom</p>
              <h2 className="professional-works__title">Últimos trabajos</h2>
            </div>

            {latest.length === 0 ? (
              <div className="professional-detail__feedback">
                Todavía no hay trabajos publicados.
              </div>
            ) : (
              <div className="professional-works__grid">
                {latest.map((t) => (
                  <article
                    key={t.id}
                    className="professional-work-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => nav(`/showroom/${t.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        nav(`/showroom/${t.id}`);
                      }
                    }}
                  >
                    <img
                      src={withBase(t.imageUrl)}
                      alt={t.tattooDescription || t.style}
                      className="professional-work-card__image"
                    />

                    <div className="professional-work-card__content">
                      <h3 className="professional-work-card__style">{t.style}</h3>
                      <p className="professional-work-card__text">
                        {t.tattooDescription?.trim() ? t.tattooDescription : "Tattoo"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}