import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getTattooById } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";
import { useAuth } from "../auth/AuthContext";
import { deleteTattoo } from "../api/tattoosApi";
import { ApiError } from "../api/apiFetch";
import { withBase } from "../utils/url";

import "../styles/tattooDetail.css";

const SHOWROOM_RETURN_FLAG_KEY = "showroom:restoreOnBack";


function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString();
  } catch {
    return d;
  }
}

export default function TattooDetailPage() {
  const { id } = useParams();
  const tattooId = useMemo(() => Number(id), [id]);

  const nav = useNavigate();
  const location = useLocation();
  const { role, token } = useAuth();
  const isAdmin = role === "ADMIN";

  const [tattoo, setTattoo] = useState<TattooDto | null>(null);
  const [error, setError] = useState("");

  const returnTo =
    typeof location.state?.returnTo === "string" && location.state.returnTo.trim()
      ? location.state.returnTo
      : "/showroom";

  const goBackToShowroom = () => {
    sessionStorage.setItem(SHOWROOM_RETURN_FLAG_KEY, "true");
    nav(returnTo);
  };

  useEffect(() => {
    setError("");
    setTattoo(null);

    if (!Number.isFinite(tattooId)) {
      setError("ID de tattoo inválido.");
      return;
    }

    getTattooById(tattooId)
      .then(setTattoo)
      .catch((e) => setError(e?.message || "Error cargando el tattoo"));
  }, [tattooId]);

  const onEdit = () => {
    if (!isAdmin) return;
    nav(`/admin/tattoos/${tattooId}/edit`);
  };

  const onDelete = async () => {
    if (!isAdmin) return;

    if (!token) {
      nav("/login", {
        replace: true,
        state: { from: `/showroom/${tattooId}` },
      });
      return;
    }

    const ok = window.confirm("¿Seguro que quieres eliminar este tattoo?");
    if (!ok) return;

    setError("");
    try {
      await deleteTattoo(token, tattooId);
      sessionStorage.setItem(SHOWROOM_RETURN_FLAG_KEY, "true");
      nav(returnTo, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        nav("/login", { replace: true });
        return;
      }

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error eliminando tattoo");
      }
    }
  };

  if (error) {
    return (
      <div className="container tdetail">
        <p className="panelError">{error}</p>
        <button type="button" className="tdBack tdBackBtn" onClick={goBackToShowroom}>
          ← Volver al showroom
        </button>
      </div>
    );
  }

  if (!tattoo) {
    return (
      <div className="container tdetail">
        <div className="tdLoading">Cargando tattoo…</div>
      </div>
    );
  }

  const title = tattoo.tattooDescription || "Tattoo";
  const dateText = fmtDate(tattoo.tattooDate);
  const proName = tattoo.professionalName ?? "Estudio 62 Rosas";

  return (
    <div className="container tdetail">
      <button type="button" className="tdBack tdBackBtn" onClick={goBackToShowroom}>
        ← Volver al showroom
      </button>

      <header className="tdHeader tdRevealItem">
        <div className="tdEyebrow">Showroom</div>

        <div className="tdHeaderRow">
          <div>
            <h1 className="tdTitle">{title}</h1>
          </div>
        </div>

        <div className="tdChips">
          {tattoo.style && <span className="tdChip">{tattoo.style}</span>}
          {tattoo.professionalName && <span className="tdChip">{tattoo.professionalName}</span>}
        </div>
      </header>

      <div className="tdGrid">
        <section className="tdCard tdMediaCard tdRevealItem" style={{ ["--d" as any]: "60ms" }}>
          <div className="tdMedia">
            <img src={withBase(tattoo.imageUrl)} alt={title} />
            <div className="tdShade" />
            {!!tattoo.style && <div className="tdBadge">{tattoo.style}</div>}
          </div>
        </section>

        <div className="tdInfoWrapper tdRevealItem" style={{ ["--d" as any]: "120ms" }}>
          {isAdmin && (
            <div className="tdInfoActions">
              <button type="button" className="btn btn-ghost" onClick={onEdit}>
                Editar
              </button>
              <button type="button" className="btn btn-primary" onClick={onDelete}>
                Eliminar
              </button>
            </div>
          )}

          <section className="tdCard tdInfoCard">
            <div className="tdInfoHeader">
              <h2 className="tdSectionTitle">Detalles</h2>
            </div>

            <div className="tdKv">
              <div className="tdKvRow">
                <span className="tdKvKey">Estilo</span>
                <span className="tdKvVal">{tattoo.style || "—"}</span>
              </div>

              <div className="tdKvRow">
                <span className="tdKvKey">Profesional</span>
                <span className="tdKvVal">{proName}</span>
              </div>

              <div className="tdKvRow">
                <span className="tdKvKey">Fecha</span>
                <span className="tdKvVal">{dateText}</span>
              </div>

              <div className="tdKvRow">
                <span className="tdKvKey">Sesiones</span>
                <span className="tdKvVal">{tattoo.sessions}</span>
              </div>

              <div className="tdKvRow">
                <span className="tdKvKey">Cover Up</span>
                <span className="tdKvVal">{tattoo.coverUp ? "Sí" : "No"}</span>
              </div>

              <div className="tdKvRow">
                <span className="tdKvKey">Color</span>
                <span className="tdKvVal">{tattoo.color ? "Sí" : "No"}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}