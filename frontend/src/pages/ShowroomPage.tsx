import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { useAuth } from "../auth/AuthContext";

import { getTattoos, getProfessionals } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";
import type { ProfessionalDto } from "../types/professional";

import {
  getDesigns,
  getAdminDesigns,
  createDesign,
  toggleDesign,
  deleteDesign,
} from "../api/designsApi";
import type { DesignDto } from "../types/design";
import { uploadPublicImage } from "../api/filesApi";

import "../styles/showroom.css";

type TabKey = "DESIGNS" | "TATTOOS";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function withBase(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url}`;
}

export default function ShowroomPage() {
  const nav = useNavigate();
  const { role, token } = useAuth();
  const isAdmin = role === "ADMIN";

  const [tab, setTab] = useState<TabKey>("TATTOOS");

  // Tattoos
  const [tattoos, setTattoos] = useState<TattooDto[]>([]);
  const [tattoosError, setTattoosError] = useState("");

  const [style, setStyle] = useState("");
  const [coverUp, setCoverUp] = useState<boolean | undefined>(undefined);
  const [color, setColor] = useState<boolean | undefined>(undefined);
  const [tattooProfessionalId, setTattooProfessionalId] = useState<string>("");

  // Designs
  const [designs, setDesigns] = useState<DesignDto[]>([]);
  const [designError, setDesignError] = useState("");
  const [designSaving, setDesignSaving] = useState(false);
  const [uploadingDesignImage, setUploadingDesignImage] = useState(false);

  const [pros, setPros] = useState<ProfessionalDto[]>([]);
  const [designProfessionalId, setDesignProfessionalId] = useState<string>("");
  const [designTitle, setDesignTitle] = useState("");
  const [designImageUrl, setDesignImageUrl] = useState("");
  const [designFilterProfessionalId, setDesignFilterProfessionalId] =
    useState<string>("");

  // mostrar/ocultar formulario de añadir diseño
  const [showAddDesign, setShowAddDesign] = useState(false);

  const resetAddDesignForm = () => {
    setDesignProfessionalId("");
    setDesignTitle("");
    setDesignImageUrl("");
  };

  const loadTattoos = async () => {
    setTattoosError("");
    try {
      const res = await getTattoos({
        style: style || undefined,
        coverUp,
        color,
        professionalId: tattooProfessionalId ? Number(tattooProfessionalId) : undefined,
      });
      setTattoos(res);
    } catch (e: any) {
      setTattoosError(e?.message || "Error cargando tatuajes");
    }
  };

  const loadDesigns = async () => {
    setDesignError("");
    try {
      const res = isAdmin ? await getAdminDesigns(token!) : await getDesigns();
      setDesigns(res);
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        if (isAdmin) nav("/login", { replace: true });
        return;
      }
      setDesignError(e?.message || "Error cargando diseños");
    }
  };

  useEffect(() => {
    loadTattoos();
  }, [style, coverUp, color, tattooProfessionalId]);

  useEffect(() => {
    loadDesigns();
  }, [isAdmin, token]);

  useEffect(() => {
    getProfessionals()
      .then(setPros)
      .catch(() => setPros([]));
  }, [isAdmin]);

  // Si deja de ser admin, oculto formulario por si acaso
  useEffect(() => {
    if (!isAdmin) {
      setShowAddDesign(false);
      resetAddDesignForm();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (tab !== "DESIGNS") setDesignFilterProfessionalId("");
  }, [tab]);

  const filteredDesigns = useMemo(() => {
    if (!designFilterProfessionalId) return designs;

    const pid = Number(designFilterProfessionalId);
    return designs.filter((d: any) => {
      if (typeof d.professionalId === "number") return d.professionalId === pid;

      const pro = pros.find((p) => p.id === pid);
      const name = pro?.professionalName?.trim().toLowerCase();
      return name
        ? String(d.professionalName ?? "").trim().toLowerCase() === name
        : true;
    });
  }, [designs, designFilterProfessionalId, pros]);

  const activeDesigns = useMemo(
    () => filteredDesigns.filter((d) => d.active),
    [filteredDesigns]
  );
  const inactiveDesigns = useMemo(
    () => filteredDesigns.filter((d) => !d.active),
    [filteredDesigns]
  );

  const onPickDesignImage = async (file: File) => {
    if (!isAdmin || !token) {
      setDesignError("Inicia sesión como admin.");
      return;
    }

    setDesignError("");
    try {
      setUploadingDesignImage(true);
      const url = await uploadPublicImage("designs", file, token);
      setDesignImageUrl(url);
    } catch (e: any) {
      setDesignError(
        e instanceof ApiError ? e.message : e?.message || "Error subiendo imagen"
      );
    } finally {
      setUploadingDesignImage(false);
    }
  };

  const onCreateDesign = async () => {
    if (!isAdmin || !token) {
      setDesignError("Inicia sesión como admin.");
      return;
    }
    if (!designProfessionalId) {
      setDesignError("Selecciona un tatuador.");
      return;
    }
    if (!designImageUrl.trim()) {
      setDesignError("Debes subir una imagen.");
      return;
    }

    setDesignError("");
    try {
      setDesignSaving(true);
      await createDesign(token, {
        professionalId: Number(designProfessionalId),
        imageUrl: designImageUrl.trim(),
        title: designTitle.trim() ? designTitle.trim() : undefined,
        active: true,
      });

      resetAddDesignForm();
      setShowAddDesign(false);
      await loadDesigns();
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true });
        return;
      }
      setDesignError(e?.message || "Error creando diseño");
    } finally {
      setDesignSaving(false);
    }
  };

  const onToggleDesign = async (id: number) => {
    if (!isAdmin || !token) return;

    setDesignError("");
    try {
      await toggleDesign(token, id);
      await loadDesigns();
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true });
        return;
      }
      setDesignError(e?.message || "Error cambiando estado del diseño");
    }
  };

  const onDeleteDesign = async (id: number) => {
    if (!isAdmin || !token) return;

    const ok = window.confirm("¿Seguro que quieres borrar este diseño?");
    if (!ok) return;

    setDesignError("");
    try {
      await deleteDesign(token, id);
      await loadDesigns();
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true });
        return;
      }
      setDesignError(e?.message || "Error borrando diseño");
    }
  };

  return (
    <div className="container showroom">
      <header className="showroomHeader">
        <div className="showroomHeader__top">
          <div>
            <div className="showroomEyebrow">Showroom</div>
            <h1 className="showroomTitle">Trabajos y diseños</h1>
            <p className="showroomSubtitle">
              Explora tatuajes realizados y diseños disponibles del estudio.
            </p>
          </div>

          <div className="tabsRow">
            <button
              type="button"
              onClick={() => setTab("TATTOOS")}
              className={`tabBtn ${tab === "TATTOOS" ? "tabBtn--active" : ""}`}
            >
              Tatuajes realizados
            </button>

            <button
              type="button"
              onClick={() => setTab("DESIGNS")}
              className={`tabBtn ${tab === "DESIGNS" ? "tabBtn--active" : ""}`}
            >
              Diseños disponibles
            </button>
          </div>
        </div>

        {/* Panel filtros */}
        {tab === "TATTOOS" && (
          <div className="filtersCard">
            <div className="filtersGrid">
              <label className="field">
                <span className="fieldTitle">Estilo</span>
                <input
                  className="input"
                  placeholder="Ej: Neotradicional..."
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                />
              </label>

              <label className="field">
                <span className="fieldTitle">Tatuador</span>
                <select
                  className="input"
                  value={tattooProfessionalId}
                  onChange={(e) => setTattooProfessionalId(e.target.value)}
                >
                  <option value="">Todos</option>
                  {pros.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.professionalName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="fieldTitle">Cover up</span>
                <select
                  className="input"
                  value={typeof coverUp === "boolean" ? String(coverUp) : ""}
                  onChange={(e) =>
                    setCoverUp(
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true"
                    )
                  }
                >
                  <option value="">Todos</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </label>

              <label className="field">
                <span className="fieldTitle">Color</span>
                <select
                  className="input"
                  value={typeof color === "boolean" ? String(color) : ""}
                  onChange={(e) =>
                    setColor(
                      e.target.value === "" ? undefined : e.target.value === "true"
                    )
                  }
                >
                  <option value="">Todos</option>
                  <option value="true">Color</option>
                  <option value="false">Blanco y negro</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </header>

      {tab === "DESIGNS" && (
        <section>
          <div className="sectionTop">
            <div>
              <h2 className="sectionTitle">Diseños disponibles</h2>
              <p className="sectionText">
                Ideas preparadas para tatuar. Si te interesa uno, te lo adaptamos a ti.
              </p>

              <div className="filtersRow">
                <div className="field">
                  <div className="fieldTitle">Tatuador</div>
                  <select
                    className="input"
                    value={designFilterProfessionalId}
                    onChange={(e) => setDesignFilterProfessionalId(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {pros.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.professionalName}
                      </option>
                    ))}
                  </select>
                </div>

                {designFilterProfessionalId && (
                  <button
                    type="button"
                    className="btn btn-ghost smallBtn"
                    onClick={() => setDesignFilterProfessionalId("")}
                  >
                    Quitar filtro
                  </button>
                )}
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setDesignError("");
                  setShowAddDesign((v) => {
                    const next = !v;
                    if (!next) resetAddDesignForm();
                    return next;
                  });
                }}
              >
                {showAddDesign ? "Cerrar" : "Añadir diseño"}
              </button>
            )}
          </div>

          {designError && <div className="panelError">{designError}</div>}

          {isAdmin && showAddDesign && (
            <div className="card panel">
              <div className="panelTitle">Nuevo diseño</div>

              <div className="addGrid">
                <div className="field">
                  <div className="fieldTitle">Tatuador</div>
                  <select
                    className="input"
                    value={designProfessionalId}
                    onChange={(e) => setDesignProfessionalId(e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {pros.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.professionalName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <div className="fieldTitle">Título (opcional)</div>
                  <input
                    className="input"
                    value={designTitle}
                    onChange={(e) => setDesignTitle(e.target.value)}
                    placeholder="Ej: Flash neo-trad rose"
                    disabled={designSaving || uploadingDesignImage}
                  />
                </div>

                <div className="field">
                  <div className="fieldTitle">Imagen</div>
                  <input
                    className="input"
                    type="file"
                    accept="image/*"
                    disabled={designSaving || uploadingDesignImage}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      await onPickDesignImage(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={onCreateDesign}
                  disabled={designSaving || uploadingDesignImage}
                >
                  {designSaving ? "Añadiendo..." : "Guardar"}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setDesignError("");
                    setShowAddDesign(false);
                    resetAddDesignForm();
                  }}
                  disabled={designSaving || uploadingDesignImage}
                >
                  Cancelar
                </button>
              </div>

              {designImageUrl.trim() && (
                <div className="previewWrap">
                  <div className="previewUrl">{designImageUrl}</div>
                  <img
                    src={withBase(designImageUrl)}
                    alt="Preview diseño"
                    className="previewImg"
                  />
                </div>
              )}
            </div>
          )}

          {activeDesigns.length === 0 ? (
            <p className="emptyText">No hay diseños disponibles ahora mismo.</p>
          ) : (
            <div className="galleryGrid">
              {activeDesigns.map((d, i) => (
                <article
                  key={d.id}
                  className="galleryCard revealItem"
                  style={{ ["--d" as any]: `${i * 60}ms` }}
                >
                  <div className="galleryMedia">
                    <img
                      src={withBase(d.imageUrl)}
                      alt={d.title ?? "Diseño disponible"}
                      loading="lazy"
                    />
                    <div className="galleryShade" />
                  </div>

                  <div className="galleryBody">
                    <div className="galleryTitle">
                      {d.title?.trim() ? d.title : "Diseño"}
                    </div>
                    <div className="galleryMeta">
                      {d.professionalName ?? "Estudio 62 Rosas"}
                    </div>

                    {isAdmin && (
                      <div className="galleryActions">
                        <button
                          type="button"
                          className="btn btn-ghost smallBtn"
                          onClick={() => onToggleDesign(d.id)}
                        >
                          Retirar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary smallBtn"
                          onClick={() => onDeleteDesign(d.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {isAdmin && inactiveDesigns.length > 0 && (
            <div className="inactiveBox">
              <h3>Retirados</h3>
              <div className="galleryGrid">
                {inactiveDesigns.map((d, i) => (
                  <article
                    key={d.id}
                    className="galleryCard galleryCard--inactive revealItem"
                    style={{ ["--d" as any]: `${i * 60}ms` }}
                  >
                    <div className="galleryMedia">
                      <img src={withBase(d.imageUrl)} alt={d.title ?? "Diseño"} loading="lazy" />
                      <div className="galleryShade" />
                    </div>

                    <div className="galleryBody">
                      <div className="galleryTitle">
                        {d.title?.trim() ? d.title : "Diseño"}
                      </div>
                      <div className="galleryMeta">
                        {d.professionalName ?? "Estudio 62 Rosas"}
                      </div>

                      <div className="galleryActions">
                        <button
                          type="button"
                          className="btn btn-ghost smallBtn"
                          onClick={() => onToggleDesign(d.id)}
                        >
                          Activar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary smallBtn"
                          onClick={() => onDeleteDesign(d.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "TATTOOS" && (
        <section>
          {tattoosError && <div className="panelError">{tattoosError}</div>}

          {(!tattoosError && tattoos.length === 0) ? (
            <p className="emptyText">No hay tatuajes con esos filtros.</p>
          ) : (
            <div className="galleryGrid">
              {tattoos.map((t, i) => (
                <article
                  key={t.id}
                  className="galleryCard galleryCard--clickable revealItem"
                  style={{ ["--d" as any]: `${i * 50}ms` }}
                  role="button"
                  tabIndex={0}
                  onClick={() => nav(`/showroom/${t.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") nav(`/showroom/${t.id}`);
                  }}
                >
                  <div className="galleryMedia">
                    <img
                      src={withBase(t.imageUrl)}
                      alt={t.tattooDescription}
                      loading="lazy"
                    />
                    <div className="galleryShade" />
                    <div className="galleryBadge">Ver detalle</div>
                  </div>

                  <div className="galleryBody">
                    <div className="galleryTitle">{t.style || "Tatuaje"}</div>
                    <div className="galleryMeta">
                      {t.professionalName ?? "Estudio 62 Rosas"}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}