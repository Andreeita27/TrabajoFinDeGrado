import { useEffect, useMemo, useState } from "react";
import { getGoogleReviews } from "../api/googleReviewsApi";
import type { GoogleReviewsResponseDto } from "../types/googleReview";
import "../styles/googleReviews.css";

function renderStars(rating?: number | null) {
  const safe = Math.max(0, Math.min(5, Math.round(rating ?? 0)));
  return "★".repeat(safe) + "☆".repeat(5 - safe);
}

export default function GoogleReviewsSection() {
  const [data, setData] = useState<GoogleReviewsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    getGoogleReviews()
      .then(setData)
      .catch((e: any) => setError(e?.message || "No se pudieron cargar las reseñas"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const section = document.querySelector(".googleReviews");
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      if (rect.top < windowHeight * 0.85) {
        setRevealed(true);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visibleReviews =
    data?.reviews
      ?.filter((review) => {
        const text = (review.text || "").toLowerCase();
        return !text.includes("celia");
      })
      .slice(0, 4) || [];

  const summaryStars = useMemo(() => renderStars(data?.rating), [data?.rating]);

  return (
    <section className={`googleReviews ${revealed ? "is-visible" : ""}`}>
      <div className="googleReviews__header googleReviews__reveal googleReviews__reveal--1">
        <p className="googleReviews__kicker">Opiniones reales</p>
        <h2 className="googleReviews__title">¡Muchas gracias!</h2>
        <p className="googleReviews__text">
          La opinión de nuestros clientes es muy importante para nosotros.
        </p>
      </div>

      {loading && <div className="googleReviews__feedback">Cargando reseñas…</div>}
      {error && <div className="googleReviews__feedback googleReviews__feedback--error">{error}</div>}

      {!loading && !error && data && (
        <>
          <div className="googleReviews__summary googleReviews__reveal googleReviews__reveal--2">
            <div className="googleReviews__scoreBlock">
              <div className="googleReviews__score">{data.rating?.toFixed(1) ?? "—"}</div>

              <div className="googleReviews__scoreMeta">
                <div className="googleReviews__stars googleReviews__stars--animated">
                  {summaryStars}
                </div>

                <div className="googleReviews__count">
                  {data.userRatingCount ?? 0} reseñas en Google
                </div>

                <div className="googleReviews__sort">
                  {data.reviewsSortInfo ?? "Opiniones de Google"}
                </div>
              </div>
            </div>

            <div className="googleReviews__actions">
              {data.googleMapsUri && (
                <>
                  <a
                    href={data.googleMapsUri}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    Ver todas en Google
                  </a>

                  <a
                    href={data.googleMapsUri}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                  >
                    Escribir reseña
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="googleReviews__grid">
            {visibleReviews.map((review, index) => (
              <article
                key={`${review.authorName}-${index}`}
                className="googleReviewCard googleReviews__reveal googleReviews__reveal--card"
                style={
                  {
                    transitionDelay: `${0.12 * (index + 1)}s`,
                    ["--hover-lift-delay" as any]: `${index * 40}ms`,
                  } as React.CSSProperties
                }
              >
                <div className="googleReviewCard__top">
                  <div className="googleReviewCard__author">
                    {review.authorPhotoUri ? (
                      <img
                        src={review.authorPhotoUri}
                        alt={review.authorName ?? "Autor de la reseña"}
                        className="googleReviewCard__avatar"
                      />
                    ) : (
                      <div className="googleReviewCard__avatarPlaceholder">
                        {(review.authorName?.[0] || "G").toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="googleReviewCard__name">
                        {review.authorName || "Usuario de Google"}
                      </div>

                      <div className="googleReviewCard__date">
                        {review.publishTime
                          ? new Date(review.publishTime).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : ""}
                      </div>
                    </div>
                  </div>

                  <div className="googleReviewCard__rating googleReviewCard__rating--animated">
                    {renderStars(review.rating)}
                  </div>
                </div>

                <p className="googleReviewCard__text">
                  {review.text || "Sin comentario de texto."}
                </p>

                {review.authorUri && (
                  <a
                    href={review.authorUri}
                    target="_blank"
                    rel="noreferrer"
                    className="googleReviewCard__authorLink"
                  >
                    Ver perfil del autor
                  </a>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}