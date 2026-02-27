import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { useAuth } from "../auth/AuthContext";

import { getTattoos, getProfessionals } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";
import type { ProfessionalDto } from "../types/professional";

import { getDesigns, getAdminDesigns, createDesign, toggleDesign, deleteDesign } from "../api/designsApi";
import type { DesignDto } from "../types/design";

type TabKey = "DESIGNS" | "TATTOOS";

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

  const [pros, setPros] = useState<ProfessionalDto[]>([]);
  const [designProfessionalId, setDesignProfessionalId] = useState<string>("");
  const [designTitle, setDesignTitle] = useState("");
  const [designImageUrl, setDesignImageUrl] = useState("");

  //mostrar/ocultar formulario de añadir diseño
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

  const activeDesigns = useMemo(() => designs.filter((d) => d.active), [designs]);
  const inactiveDesigns = useMemo(() => designs.filter((d) => !d.active), [designs]);

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
      setDesignError("La URL de imagen es obligatoria.");
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

      //cerrar y resetear formulario al crear
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
    <div style={{ padding: 16 }}>
      <h1>Showroom</h1>

      <div style={{ display: "flex", gap: 8, margin: "12px 0 18px" }}>
        <button
          type="button"
          onClick={() => setTab("TATTOOS")}
          style={{
            padding: "8px 12px",
            border: "1px solid #333",
            borderRadius: 8,
            background: tab === "TATTOOS" ? "#222" : "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Tatuajes realizados
        </button>

        <button
          type="button"
          onClick={() => setTab("DESIGNS")}
          style={{
            padding: "8px 12px",
            border: "1px solid #333",
            borderRadius: 8,
            background: tab === "DESIGNS" ? "#222" : "transparent",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Diseños disponibles
        </button>
      </div>

      {tab === "DESIGNS" && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>Diseños disponibles</h2>
              <p style={{ opacity: 0.85, marginTop: 6 }}>
                Ideas que el estudio tiene preparadas para tatuar. Si te interesa uno, dínoslo y lo adaptamos a ti.
              </p>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setDesignError("");
                  // toggle
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

          {designError && <div style={{ color: "tomato", marginBottom: 10 }}>{designError}</div>}

          {isAdmin && showAddDesign && (
            <div style={{ border: "1px solid #333", borderRadius: 10, padding: 12, margin: "12px 0 16px" }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Nuevo diseño</div>

              <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 1fr auto auto", gap: 10, alignItems: "end" }}>
                <label style={{ display: "grid", gap: 6 }}>
                  Tatuador
                  <select value={designProfessionalId} onChange={(e) => setDesignProfessionalId(e.target.value)}>
                    <option value="">Selecciona…</option>
                    {pros.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.professionalName}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  Título (opcional)
                  <input
                    value={designTitle}
                    onChange={(e) => setDesignTitle(e.target.value)}
                    placeholder="Ej: Flash neo-trad rose"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  URL imagen
                  <input value={designImageUrl} onChange={(e) => setDesignImageUrl(e.target.value)} placeholder="https://..." />
                </label>

                <button onClick={onCreateDesign} disabled={designSaving}>
                  {designSaving ? "Añadiendo..." : "Guardar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDesignError("");
                    setShowAddDesign(false);
                    resetAddDesignForm();
                  }}
                  disabled={designSaving}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {activeDesigns.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No hay diseños disponibles ahora mismo.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {activeDesigns.map((d) => (
                <div
                  key={d.id}
                  style={{
                    border: "1px solid #333",
                    borderRadius: 10,
                    padding: 12,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{d.title?.trim() ? d.title : "Diseño"}</div>
                      <div style={{ opacity: 0.8 }}>{d.professionalName ?? "Estudio 62 Rosas"}</div>
                    </div>

                    {isAdmin && (
                      <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                        <button type="button" onClick={() => onToggleDesign(d.id)}>
                          Retirar
                        </button>
                        <button type="button" onClick={() => onDeleteDesign(d.id)}>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>

                  <img
                    src={d.imageUrl}
                    alt={d.title ?? "Diseño disponible"}
                    style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: 8 }}
                  />
                </div>
              ))}
            </div>
          )}

          {isAdmin && inactiveDesigns.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #333" }}>
              <h3>Retirados</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {inactiveDesigns.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      border: "1px dashed #444",
                      borderRadius: 10,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      opacity: 0.9,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{d.title?.trim() ? d.title : "Diseño"}</div>
                      <div style={{ opacity: 0.8 }}>{d.professionalName ?? "Estudio 62 Rosas"}</div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => onToggleDesign(d.id)}>
                        Activar
                      </button>
                      <button type="button" onClick={() => onDeleteDesign(d.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "TATTOOS" && (
        <section>
          <h2>Tatuajes realizados</h2>

          <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
            <label style={{ display: "grid", gap: 6 }}>
              Estilo
              <input
                placeholder="Filtrar por estilo"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Tatuador
              <select value={tattooProfessionalId} onChange={(e) => setTattooProfessionalId(e.target.value)}>
                <option value="">Todos</option>
                {pros.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.professionalName}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Cover up
              <select
                value={typeof coverUp === "boolean" ? String(coverUp) : ""}
                onChange={(e) => setCoverUp(e.target.value === "" ? undefined : e.target.value === "true")}
              >
                <option value="">Todos</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Color
              <select
                value={typeof color === "boolean" ? String(color) : ""}
                onChange={(e) => setColor(e.target.value === "" ? undefined : e.target.value === "true")}
              >
                <option value="">Todos</option>
                <option value="true">Color</option>
                <option value="false">Blanco y negro</option>
              </select>
            </label>
          </div>

          {tattoosError && <div style={{ color: "tomato" }}>{tattoosError}</div>}

          <div style={{ display: "grid", gap: 20 }}>
            {tattoos.map((t) => (
              <div
                key={t.id}
                onClick={() => nav(`/showroom/${t.id}`)}
                role="button"
                style={{
                  border: "1px solid #333",
                  padding: 12,
                  borderRadius: 10,
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
                    borderRadius: 8,
                  }}
                />

                <div style={{ marginTop: 10 }}>
                  <h3 style={{ margin: 0 }}>{t.style}</h3>
                  <p style={{ color: "#888", marginTop: 6 }}>{t.professionalName ?? "Estudio 62 Rosas"}</p>
                </div>
              </div>
            ))}

            {!tattoosError && tattoos.length === 0 && <p style={{ opacity: 0.8 }}>No hay tatuajes con esos filtros.</p>}
          </div>
        </section>
      )}
    </div>
  );
}