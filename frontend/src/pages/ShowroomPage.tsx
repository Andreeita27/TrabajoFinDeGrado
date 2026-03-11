import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
const SHOWROOM_SCROLL_KEY = "showroom:scrollY";
const SHOWROOM_RETURN_FLAG_KEY = "showroom:restoreOnBack";

function withBase(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url}`;
}

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export default function ShowroomPage() {
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, token } = useAuth();
  const isAdmin = role === "ADMIN";

  const initialTab = (searchParams.get("tab") as TabKey) || "TATTOOS";

  const [tab, setTab] = useState<TabKey>(
    initialTab === "DESIGNS" ? "DESIGNS" : "TATTOOS"
  );

  // Tattoos
  const [tattoos, setTattoos] = useState<TattooDto[]>([]);
  const [tattoosError, setTattoosError] = useState("");

  const [style, setStyle] = useState(() => searchParams.get("style") ?? "");
  const [coverUp, setCoverUp] = useState<boolean | undefined>(() =>
    parseBooleanParam(searchParams.get("coverUp"))
  );
  const [color, setColor] = useState<boolean | undefined>(() =>
    parseBooleanParam(searchParams.get("color"))
  );
  const [tattooProfessionalId, setTattooProfessionalId] = useState<string>(
    () => searchParams.get("professionalId") ?? ""
  );

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
    useState<string>(() => searchParams.get("designProfessionalId") ?? "");

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
        professionalId: tattooProfessionalId
          ? Number(tattooProfessionalId)
          : undefined,
      });

      const sorted = [...res].sort((a, b) => {
        const ta = a.tattooDate
          ? new Date(`${a.tattooDate}T00:00:00`).getTime()
          : 0;
        const tb = b.tattooDate
          ? new Date(`${b.tattooDate}T00:00:00`).getTime()
          : 0;
        if (tb !== ta) return tb - ta;
        return (b.id ?? 0) - (a.id ?? 0);
      });

      setTattoos(sorted);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error cargando tatuajes";
      setTattoosError(message);
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

  useEffect(() => {
    if (!isAdmin) {
      setShowAddDesign(false);
      resetAddDesignForm();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (tab !== "DESIGNS") setDesignFilterProfessionalId("");
  }, [tab]);

  // Estado -> URL
  useEffect(() => {
    const nextParams = new URLSearchParams();

    nextParams.set("tab", tab);

    if (style.trim()) nextParams.set("style", style.trim());
    if (typeof coverUp === "boolean") {
      nextParams.set("coverUp", String(coverUp));
    }
    if (typeof color === "boolean") {
      nextParams.set("color", String(color));
    }
    if (tattooProfessionalId) {
      nextParams.set("professionalId", tattooProfessionalId);
    }
    if (designFilterProfessionalId) {
      nextParams.set("designProfessionalId", designFilterProfessionalId);
    }

    const current = searchParams.toString();
    const next = nextParams.toString();

    if (current !== next) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    tab,
    style,
    coverUp,
    color,
    tattooProfessionalId,
    designFilterProfessionalId,
    searchParams,
    setSearchParams,
  ]);

  // URL -> estado
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const nextTab: TabKey = tabFromUrl === "DESIGNS" ? "DESIGNS" : "TATTOOS";
    if (tab !== nextTab) setTab(nextTab);

    const styleFromUrl = searchParams.get("style") ?? "";
    if (style !== styleFromUrl) setStyle(styleFromUrl);

    const coverUpFromUrl = parseBooleanParam(searchParams.get("coverUp"));
    if (coverUp !== coverUpFromUrl) setCoverUp(coverUpFromUrl);

    const colorFromUrl = parseBooleanParam(searchParams.get("color"));
    if (color !== colorFromUrl) setColor(colorFromUrl);

    const tattooProfessionalIdFromUrl = searchParams.get("professionalId") ?? "";
    if (tattooProfessionalId !== tattooProfessionalIdFromUrl) {
      setTattooProfessionalId(tattooProfessionalIdFromUrl);
    }

    const designProfessionalIdFromUrl =
      searchParams.get("designProfessionalId") ?? "";
    if (designFilterProfessionalId !== designProfessionalIdFromUrl) {
      setDesignFilterProfessionalId(designProfessionalIdFromUrl);
    }
  }, [searchParams]);

  // Guardar scroll mientras estás en Showroom
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(SHOWROOM_SCROLL_KEY, String(window.scrollY));
    };

    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => window.removeEventListener("scroll", saveScroll);
  }, []);

  // Restaurar scroll solo si vuelves con el botón propio de la web
  useEffect(() => {
    const mustRestore =
      sessionStorage.getItem(SHOWROOM_RETURN_FLAG_KEY) === "true";

    if (!mustRestore) return;

    const saved = sessionStorage.getItem(SHOWROOM_SCROLL_KEY);
    if (!saved) {
      sessionStorage.removeItem(SHOWROOM_RETURN_FLAG_KEY);
      return;
    }

    const y = Number(saved);
    if (!Number.isFinite(y)) {
      sessionStorage.removeItem(SHOWROOM_RETURN_FLAG_KEY);
      return;
    }

    const id = window.setTimeout(() => {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
      sessionStorage.removeItem(SHOWROOM_RETURN_FLAG_KEY);
    }, 100);

    return () => window.clearTimeout(id);
  }, [tattoos.length, tab]);

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

  const goToTattooDetail = (tattooId: number) => {
    sessionStorage.setItem(SHOWROOM_SCROLL_KEY, String(window.scrollY));

    nav(`/showroom/${tattooId}`, {
      state: {
        returnTo: `${location.pathname}${location.search}`,
      },
    });
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
        </div>
      </header>

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

      {tab === "TATTOOS" && (
        <div className="filtersCard">
          <div className="filtersGrid">
            <label className="field">
              <span className="fieldTitle">Estilo</span>
              <input
                className="showroomInput"
                placeholder="Ej: Neotradicional..."
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="fieldTitle">Tatuador</span>
              <select
                className="showroomInput"
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
                className="showroomInput"
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
                className="showroomInput"
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

      {tab === "DESIGNS" && (
        <section>
          <div className="sectionTop">
            <div>
              <h2 className="showroomSectionTitle">Diseños disponibles</h2>
              <p className="sectionText">
                Ideas preparadas para tatuar. Si te interesa uno, te lo adaptamos a ti.
              </p>

              <div className="filtersRow">
                <div className="field">
                  <div className="fieldTitle">Tatuador</div>
                  <select
                    className="showroomInput"
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
                    className="showroomInput"
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
                    className="showroomInput"
                    value={designTitle}
                    onChange={(e) => setDesignTitle(e.target.value)}
                    placeholder="Ej: Flash neo-trad rose"
                    disabled={designSaving || uploadingDesignImage}
                  />
                </div>

                <div className="field">
                  <div className="fieldTitle">Imagen</div>
                  <input
                    className="showroomInput"
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
            <div className="showroomGalleryGrid">
              {activeDesigns.map((d, i) => (
                <article
                  key={d.id}
                  className="galleryCard showroomRevealItem"
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
              <div className="showroomGalleryGrid">
                {inactiveDesigns.map((d, i) => (
                  <article
                    key={d.id}
                    className="galleryCard galleryCard--inactive showroomRevealItem"
                    style={{ ["--d" as any]: `${i * 60}ms` }}
                  >
                    <div className="galleryMedia">
                      <img
                        src={withBase(d.imageUrl)}
                        alt={d.title ?? "Diseño"}
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

          {!tattoosError && tattoos.length === 0 ? (
            <p className="emptyText">No hay tatuajes con esos filtros.</p>
          ) : (
            <div className="showroomGalleryGrid">
              {tattoos.map((t, i) => (
                <article
                  key={t.id}
                  className="galleryCard galleryCard--clickable showroomRevealItem"
                  style={{ ["--d" as any]: `${i * 50}ms` }}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToTattooDetail(t.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToTattooDetail(t.id);
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