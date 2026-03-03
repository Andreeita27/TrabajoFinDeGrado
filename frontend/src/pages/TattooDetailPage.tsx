import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTattooById } from "../api/showroomApi";
import type { TattooDto } from "../types/tattoo";
import { useAuth } from "../auth/AuthContext";
import { deleteTattoo } from "../api/tattoosApi";
import { ApiError } from "../api/apiFetch";

import "../styles/tattooDetail.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function withBase(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url}`;
}

export default function TattooDetailPage() {
  const { id } = useParams();
  const tattooId = Number(id);

  const nav = useNavigate();
  const { role, token } = useAuth();
  const isAdmin = role === "ADMIN";

  const [tattoo, setTattoo] = useState<TattooDto | null>(null);
  const [error, setError] = useState("");

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
      nav("/login", { replace: true, state: { from: `/showroom/${tattooId}` } });
      return;
    }

    const ok = window.confirm("¿Seguro que quieres eliminar este tattoo?");
    if (!ok) return;

    setError("");
    try {
      await deleteTattoo(token, tattooId);
      nav("/showroom", { replace: true });
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        nav("/login", { replace: true });
        return;
      }
      setError(err?.message || "Error eliminando tattoo");
    }
  };

  if (error) {
    return (
      <div className="container tdetail">
        <p className="panelError">{error}</p>
        <Link to="/showroom" className="backLink">← Volver al showroom</Link>
      </div>
    );
  }

  if (!tattoo) {
    return (
      <div className="container tdetail">
        <div className="loading">Cargando tattoo…</div>
      </div>
    );
  }

  return (
    <div className="container tdetail">
      <Link to="/showroom" className="backLink">← Volver al showroom</Link>

      <div className="tdetailTop">
        <h1 className="tdetailTitle">{tattoo.tattooDescription}</h1>

        {isAdmin && (
          <div className="tdetailActions">
            <button type="button" className="btn btn-ghost" onClick={onEdit}>
              Editar
            </button>
            <button type="button" className="btn btn-primary" onClick={onDelete}>
              Eliminar
            </button>
          </div>
        )}
      </div>

      <div className="card tdetailCard">
        <img
          src={withBase(tattoo.imageUrl)}
          alt={tattoo.tattooDescription}
          className="tdetailImg"
        />

        <div className="kvGrid">
          <div className="kvRow">
            <span className="kvKey">Estilo:</span>
            <span className="kvVal">{tattoo.style}</span>
          </div>

          <div className="kvRow">
            <span className="kvKey">Fecha:</span>
            <span className="kvVal">
              {tattoo.tattooDate
                ? new Date(`${tattoo.tattooDate}T00:00:00`).toLocaleDateString()
                : "—"}
            </span>
          </div>

          <div className="kvRow">
            <span className="kvKey">Profesional:</span>
            <span className="kvVal">{tattoo.professionalName ?? "Estudio 62 Rosas"}</span>
          </div>

          <div className="kvRow">
            <span className="kvKey">Sesiones:</span>
            <span className="kvVal">{tattoo.sessions}</span>
          </div>

          <div className="kvRow">
            <span className="kvKey">Cover Up:</span>
            <span className="kvVal">{tattoo.coverUp ? "Sí" : "No"}</span>
          </div>

          <div className="kvRow">
            <span className="kvKey">Color:</span>
            <span className="kvVal">{tattoo.color ? "Sí" : "No"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}