import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTattoos, getProfessionals } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";
import type { ProfessionalDto } from "../types/professional";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/apiFetch";

import { getDesigns, getAdminDesigns, createDesign, toggleDesign, deleteDesign } from "../api/designsApi";
import type { DesignDto } from "../types/design";

export default function ShowroomPage() {
  const nav = useNavigate();
  const { role, token } = useAuth();
  const isAdmin = role === "ADMIN";

  // Tattoos
  const [items, setItems] = useState<TattooDto[]>([]);
  const [tattoosError, setTattoosError] = useState("");

  const [style, setStyle] = useState("");
  const [coverUp, setCoverUp] = useState<boolean | undefined>(undefined);
  const [color, setColor] = useState<boolean | undefined>(undefined);

  // Designs
  const [designs, setDesigns] = useState<DesignDto[]>([]);
  const [designError, setDesignError] = useState("");

  // Admin formulario
  const [pros, setPros] = useState<ProfessionalDto[]>([]);
  const [designProfessionalId, setDesignProfessionalId] = useState<number | "">("");
  const [designTitle, setDesignTitle] = useState("");
  const [designImageUrl, setDesignImageUrl] = useState("");
  const [designSaving, setDesignSaving] = useState(false);

  const load = async () => {
    // resetea errores
    setTattoosError("");
    setDesignError("");

    // 1) Tattoos (si falla, no afecta a designs)
    try {
      const tattoosRes = await getTattoos({
        style: style || undefined,
        coverUp,
        color,
      });
      setItems(tattoosRes);
    } catch (e: any) {
      setTattoosError(e?.message || "Error cargando tatuajes");
    }

    // 2) Designs (si falla, no afecta a tattoos)
    try {
      const designsRes = isAdmin && token
        ? await getAdminDesigns(token)
        : await getDesigns();

      setDesigns(designsRes);
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        if (isAdmin) {
          nav("/login", { replace: true });
          return;
        }
      }
      setDesignError(e?.message || "Error cargando diseños");
    }
  };

  useEffect(() => {
    load();
  }, [style, coverUp, color]);

  useEffect(() => {
    if (!isAdmin) return;
    getProfessionals()
      .then(setPros)
      .catch(() => setPros([]));
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

      setDesignTitle("");
      setDesignImageUrl("");
      setDesignProfessionalId("");

      await load();
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
      await load();
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
      await load();
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

      <section style={{ marginBottom: 26, paddingBottom: 18, borderBottom: "1px solid #333" }}>
        <h2 style={{ marginTop: 0 }}>Diseños disponibles</h2>
        <p style={{ marginTop: 6, opacity: 0.85 }}>
          Ideas que el estudio tiene preparadas para tatuar. Si te interesa uno, dínoslo y lo adaptamos a ti.
        </p>

        {designError && <div style={{ color: "tomato", marginBottom: 10 }}>{designError}</div>}

        {isAdmin && (
          <div style={{ border: "1px solid #333", borderRadius: 8, padding: 12, margin: "12px 0 16px" }}>
            <b>Añadir diseño</b>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
              <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
                Tatuador
                <select
                  value={designProfessionalId === "" ? "" : String(designProfessionalId)}
                  onChange={(e) => setDesignProfessionalId(e.target.value ? Number(e.target.value) : "")}
                  disabled={designSaving}
                >
                  <option value="">Selecciona…</option>
                  {pros.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.professionalName}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 240, flex: 1 }}>
                Título (opcional)
                <input
                  value={designTitle}
                  onChange={(e) => setDesignTitle(e.target.value)}
                  placeholder="Ej: Flash neo-trad rose"
                  disabled={designSaving}
                />
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 320, flex: 2 }}>
                URL imagen
                <input
                  value={designImageUrl}
                  onChange={(e) => setDesignImageUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={designSaving}
                />
              </label>

              <button type="button" onClick={onCreateDesign} disabled={designSaving || !token}>
                {designSaving ? "Guardando..." : "Añadir"}
              </button>
            </div>
          </div>
        )}

        {activeDesigns.length === 0 ? (
          <p style={{ opacity: 0.85 }}>No hay diseños disponibles ahora mismo.</p>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {activeDesigns.map((d) => (
              <div key={d.id} style={{ border: "1px solid #333", padding: 12, borderRadius: 8 }}>
                <img
                  src={d.imageUrl}
                  alt={d.title ?? "Diseño disponible"}
                  style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 6 }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{d.title?.trim() ? d.title : "Diseño disponible"}</h3>
                    <p style={{ color: "#888", marginTop: 6 }}>{d.professionalName ?? "Estudio 62 Rosas"}</p>
                  </div>

                  {isAdmin && (
                    <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                      <button type="button" onClick={() => onToggleDesign(d.id)}>Retirar</button>
                      <button type="button" onClick={() => onDeleteDesign(d.id)}>Borrar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdmin && inactiveDesigns.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3>Diseños retirados</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {inactiveDesigns.map((d) => (
                <div key={d.id} style={{ border: "1px solid #222", padding: 10, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <b>{d.title?.trim() ? d.title : "Diseño"}</b>{" "}
                      <span style={{ opacity: 0.8 }}>— {d.professionalName ?? "Estudio 62 Rosas"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => onToggleDesign(d.id)}>Reactivar</button>
                      <button type="button" onClick={() => onDeleteDesign(d.id)}>Borrar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 style={{ marginTop: 18 }}>Tatuajes realizados</h2>

        <div style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input placeholder="Filtrar por estilo" value={style} onChange={(e) => setStyle(e.target.value)} />

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

        {tattoosError && <div style={{ color: "tomato" }}>{tattoosError}</div>}

        <div style={{ display: "grid", gap: 20 }}>
          {items.map((t) => (
            <div
              key={t.id}
              onClick={() => nav(`/showroom/${t.id}`)}
              role="button"
              style={{ border: "1px solid #333", padding: 12, borderRadius: 8, cursor: "pointer" }}
            >
              <img
                src={t.imageUrl}
                alt={t.tattooDescription}
                style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 6 }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{t.style}</h3>
                  <p style={{ color: "#888", marginTop: 6 }}>{t.professionalName ?? "Estudio 62 Rosas"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}