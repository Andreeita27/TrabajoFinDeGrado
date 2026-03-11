import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfessionals } from "../api/showroomApi";
import type { ProfessionalDto } from "../types/professional";
import "../styles/professionals.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function withBase(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url}`;
}

export default function ProfessionalsPage() {
  const nav = useNavigate();

  const [items, setItems] = useState<ProfessionalDto[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await getProfessionals();
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

  return (
    <main className="professionals-page">
      <section className="professionals-hero">
        <p className="professionals-hero__kicker">Nuestro equipo</p>
        <h1 className="professionals-hero__title">Tatuadores</h1>
        <p className="professionals-hero__text">
          Conoce al equipo de 62 Rosas Tattoo, su estilo y algunos de sus trabajos más recientes.
        </p>
      </section>

      {error && <div className="professionals-feedback professionals-feedback--error">{error}</div>}
      {loading && <div className="professionals-feedback">Cargando profesionales…</div>}

      {!loading && items.length === 0 ? (
        <div className="professionals-empty">No hay profesionales disponibles ahora mismo.</div>
      ) : (
        <section className="professionals-grid">
          {items.map((p) => (
            <article
              key={p.id}
              className="professional-card"
              role="button"
              tabIndex={0}
              onClick={() => nav(`/professionals/${p.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  nav(`/professionals/${p.id}`);
                }
              }}
            >
              <div className="professional-card__imageWrap">
                {p.profilePhoto?.trim() ? (
                  <img
                    src={withBase(p.profilePhoto)}
                    alt={p.professionalName}
                    className="professional-card__image"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="professional-card__imagePlaceholder">62</div>
                )}

                <span
                  className={`professional-card__status ${
                    p.booksOpened ? "professional-card__status--open" : "professional-card__status--closed"
                  }`}
                >
                  {p.booksOpened ? "Agenda abierta" : "Agenda cerrada"}
                </span>
              </div>

              <div className="professional-card__content">
                <h2 className="professional-card__name">{p.professionalName}</h2>

                <p className="professional-card__style">
                  <span>Especialidad</span>
                  {p.style}
                </p>

                <p className="professional-card__description">
                  {p.description?.trim()
                    ? p.description.length > 150
                      ? `${p.description.slice(0, 150)}…`
                      : p.description
                    : "Descubre más sobre este profesional y su trabajo."}
                </p>

                <div className="professional-card__footer">
                  <span className="professional-card__link">Ver perfil</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}