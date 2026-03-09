import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import HomeCarousel from "../components/HomeCarousel";
import "../styles/homeOnePage.css";
import HomeMap from "../components/HomeMap";
import GoogleReviewsSection from "../components/GoogleReviewsSection";

import { getProfessionals } from "../api/showroomApi";
import type { ProfessionalDto } from "../types/professional";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function withBase(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url}`;
}

const LASER_URL = "https://eliminartatuajeszaragoza.com/";
const MAP_EMBED = "https://www.google.com/maps?q=62%20Rosas%20Tattoo%20Zaragoza&output=embed";

type SectionProps = {
  id: string;
  bgClass: string; // hpBgBlack | hpBgGold | hpBgWhite
  reverse?: boolean;
  kicker: string;
  title: string;
  text: string;
  bullets?: string[];
  ctas?: { label: string; onClick?: () => void; href?: string; external?: boolean }[];
  images?: string[];
  media?: React.ReactNode;
  mediaClassName?: String;
};

function useInViewOnce() {
  const ref = useRef<HTMLElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, on };
}

function HomeSection(p: SectionProps) {
  const { ref, on } = useInViewOnce();

  return (
    <section
      id={p.id}
      ref={ref as any}
      className={`hpSection ${p.bgClass} ${p.reverse ? "hpReverse" : ""} ${on ? "hpOn" : ""}`}
    >
      <div className="hpInner">
        <div className="hpText hpReveal">
          <div className="hpTextCard">
            <div className="hpKicker">
              <span className="hpLine" />
              {p.kicker}
            </div>

            <h2 className="hpTitle">{p.title}</h2>

            <p className="hpP">{p.text}</p>

            {p.bullets?.length ? (
              <ul className="hpBullets">
                {p.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}

            {p.ctas?.length ? (
              <div className="hpActions">
                {p.ctas.map((c, i) => {
                  if (c.href) {
                    return (
                      <a
                        key={i}
                        className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"}`}
                        href={c.href}
                        target={c.external ? "_blank" : undefined}
                        rel={c.external ? "noreferrer" : undefined}
                      >
                        {c.label}
                      </a>
                    );
                  }
                  return (
                    <button
                      key={i}
                      className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"}`}
                      type="button"
                      onClick={c.onClick}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className={`hpMedia hpReveal ${p.mediaClassName ?? ""}`}>
          {p.media ? p.media : <HomeCarousel images={p.images ?? []} intervalMs={2600} alt={p.title} />}
        </div>
      </div>
    </section>
  );
}

/**Bloque de residentes (Acerete + Titi) para Home */
function HomeResidentProfessionals() {
  const nav = useNavigate();
  const [items, setItems] = useState<ProfessionalDto[]>([]);
  const [loading, setLoading] = useState(false);

  const residents = useMemo(() => {
    const norm = (s: string) => s.trim().toLowerCase();

    const a = items.find((p) => norm(p.professionalName || "") === "acerete tattoo");
    const t = items.find((p) => norm(p.professionalName || "") === "david el titi");

    // Fallback suave por si algún día cambio el nombre en BD
    const t2 = t ?? items.find((p) => /david\s+el\s+titi|\btiti\b/i.test(p.professionalName || ""));
    const a2 = a ?? items.find((p) => /acerete/i.test(p.professionalName || ""));
    

    return [t2, a2].filter(Boolean) as ProfessionalDto[];
  }, [items]);

  const instagramByName = useMemo(() => {
    return {
      "david el titi": "https://instagram.com/davideltiti",
      "acerete tattoo": "https://instagram.com/acerete.tattoo",
    } as Record<string, string>;
  }, []);

  const getInstagram = (name?: string) => {
    const key = (name || "").trim().toLowerCase();
    return instagramByName[key] || "";
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);

    getProfessionals()
      .then((data) => {
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!alive) return;
        setItems([]);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // Si no han cargado aún o no existen en BD, muestro 2 placeholders bonitos
  const cards: Array<
    Pick<ProfessionalDto, "id" | "professionalName" | "style" | "profilePhoto"> & { roleLabel?: string }
  > =
    residents.length >= 2
      ? residents
      : [
          {
            id: 0,
            professionalName: "David el Titi",
            style: "Residente",
            profilePhoto: "/home/pros_02.jpg",
            roleLabel: "Residente",
          },
          {
            id: 0,
            professionalName: "Acerete Tattoo",
            style: "Residente",
            profilePhoto: "/home/pros_01.jpg",
            roleLabel: "Residente",
          },
        
        ];

  return (
    <div className="hpProsWrap">
      <div className="hpProsGrid">
        {cards.map((p, idx) => {
          const clickable = Number(p.id) > 0;
          const ig = getInstagram(p.professionalName);

          return (
            <article
              key={`${p.professionalName}-${idx}`}
              className={`hpProCard ${clickable ? "hpProCard--clickable" : ""}`}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => nav(`/professionals/${p.id}`) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter") nav(`/professionals/${p.id}`);
                    }
                  : undefined
              }
            >
              <div className="hpProDiamond">
                <img
                  src={withBase(p.profilePhoto) || "/images/logo-sinfondo.svg"}
                  alt={p.professionalName}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/logo-sinfondo.svg";
                  }}
                />
              </div>

              <div className="hpProBody">
                <h3 className="hpProName">{p.professionalName}</h3>
                <div className="hpProRole">{p.roleLabel ? p.roleLabel : "Tatuador residente"}</div>

                <div className="hpProPills">
                  <span className="hpProPill">{p.style || "—"}</span>
                </div>

                <div className="hpProActions">
                  <button
                    type="button"
                    className="hpIconBtn"
                    title="Instagram"
                    disabled={!ig}
                    aria-disabled={!ig}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (ig) window.open(ig, "_blank", "noreferrer");
                    }}
                  >
                    {/* Instagram SVG */}
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="hpIconSvg">
                      <path
                        d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9A3.5 3.5 0 0 0 20 16.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.6-2.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="hpIconBtn hpIconBtn--arrow"
                    title="Ver perfil"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (clickable) nav(`/professionals/${p.id}`);
                    }}
                  >
                    {/* Flecha SVG */}
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="hpIconSvg hpIconSvg--arrow">
                      <path
                        d="M13.5 5.5a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L16.8 12H5a1 1 0 0 1 0-2h11.8l-3.3-3.1a1 1 0 0 1 0-1.4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
        {loading ? <div className="hpProsHint">Cargando…</div> : null}
      </div>
  );
}

function HomeStylesMosaic() {
  const nav = useNavigate();

  const styles = [
    {
      title: "Tradicional",
      subtitle: "Clásico, sólido y atemporal",
      image: "/home/tradicional.jpg",
      filterValue: "Tradicional",
    },
    {
      title: "Neotradicional",
      subtitle: "Color, fuerza y composición",
      image: "/home/neotradicional.jpg",
      filterValue: "Neotradicional",
    },
    {
      title: "Realismo Black & Grey",
      subtitle: "Sombras, contraste y detalle",
      image: "/home/realismo.jpg",
      filterValue: "Realismo",
    },
    {
      title: "Neotribal",
      subtitle: "Líneas orgánicas y composición moderna",
      image: "/home/neotribal.jpg",
      filterValue: "Neotribal",
    },
  ];

  return (
    <div className="hpStylesMedia">
      <div className="hpStylesGrid">
        {styles.map((item, index) => (
          <article
            key={`${item.title}-${index}`}
            className={`hpStyleCard hpStyleCard--${index + 1}`}
            role="button"
            tabIndex={0}
            onClick={() => nav(`/showroom?style=${encodeURIComponent(item.filterValue)}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                nav(`/showroom?style=${encodeURIComponent(item.filterValue)}`);
              }
            }}
          >
            <img
              src={item.image}
              alt={item.title}
              className="hpStyleCard__img"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/images/logo-sinfondo.svg";
              }}
            />

            <div className="hpStyleCard__overlay" />

            <div className="hpStyleCard__body">
              <div className="hpStyleCard__kicker">Estilo</div>
              <h3 className="hpStyleCard__title">{item.title}</h3>
              <p className="hpStyleCard__text">{item.subtitle}</p>
              <span className="hpStyleCard__link">Ver tattoos</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function HomeLaserMedia() {
  const nav = useNavigate();

  const instagramUrl = "https://instagram.com/eliminartatuajeszaragoza";

  const idealFor = [
    "Aclarar un tatuaje antes de un cover up",
    "Eliminar una pieza antigua",
    "Corregir trabajos que ya no encajan contigo",
    "Eliminar micropigmentación",
  ];

  return (
    <div className="hpLaserMedia">
      <article
        className="hpProCard hpProCard--clickable hpLaserErikoCard"
        role="button"
        tabIndex={0}
        onClick={() => nav("/laser")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            nav("/laser");
          }
        }}
      >
        <div className="hpProDiamond">
          <img
            src="/home/erikolaser.jpg"
            alt="Eriko"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/images/estudio.svg";
            }}
          />
        </div>

        <div className="hpProBody">
          <h3 className="hpProName">Eriko</h3>
          <div className="hpProRole">Especialista en eliminación / atenuación</div>

          <div className="hpProPills">
            <span className="hpProPill">Láser</span>
          </div>

          <div className="hpProActions">
            <button
              type="button"
              className="hpIconBtn"
              title="Instagram"
              onClick={(e) => {
                e.stopPropagation();
                window.open(instagramUrl, "_blank", "noreferrer");
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="hpIconSvg">
                <path
                  d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9A3.5 3.5 0 0 0 20 16.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.6-2.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <button
              type="button"
              className="hpIconBtn hpIconBtn--arrow"
              title="Ver más información"
              onClick={(e) => {
                e.stopPropagation();
                nav("/laser");
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="hpIconSvg hpIconSvg--arrow">
                <path
                  d="M13.5 5.5a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L16.8 12H5a1 1 0 0 1 0-2h11.8l-3.3-3.1a1 1 0 0 1 0-1.4Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      </article>

      <article className="hpLaserInfoCard">
        <div className="hpLaserInfoCard__kicker">Casos habituales</div>
        <h3 className="hpLaserInfoCard__title">Ideal para</h3>

        <div className="hpLaserInfoCard__list">
          {idealFor.map((item, index) => (
            <div key={`${item}-${index}`} className="hpLaserInfoItem">
              <span className="hpLaserInfoItem__line" />
              <span className="hpLaserInfoItem__text">{item}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

export default function HomePage() {
  const nav = useNavigate();
  const { isAuthenticated } = useAuth();

  const goBook = () => {
    if (isAuthenticated) nav("/calendar");
    else nav("/login", { state: { from: "/calendar" } });
  };

  // IMÁGENES INVENTADAS
  const imgCita = ["/home/book_01.jpg", "/home/book_02.jpg"];

  return (
    <div className="hpPage">
      <section className="hpPosterHero">
        <div className="hpPosterFrame" />

        <div className="hpPosterInner">
          <div className="hpPosterLogoWrap">
            <img src="/images/logo-sinfondo.svg" className="hpPosterLogo" alt="62 Rosas Tattoo" />
          </div>

          <div className="hpPosterCenter">
            <div className="hpPosterKicker">ESTUDIO DE TATUAJES Y LÁSER</div>

            <div className="hpPosterDivider" />

            <div className="hpPosterCity">ZARAGOZA</div>
          </div>

          <div className="hpPosterBottom">
            <button className="btn btn-primary hpPosterCta" onClick={goBook}>
              ¡PIDE TU CITA AHORA!
            </button>
          </div>
        </div>
      </section>

      {/* 1) Tatuadores */}
      <HomeSection
        id="tatuadores"
        bgClass="hpBgBlack"
        kicker="Equipo"
        title="Tatuadores"
        text="Nuestro equipo de tatuadores cuenta con una amplia experiencia en cualquier estilo, consiguiendo adaptar tu idea de manera 
        profesional. David el Titi y Acerete son nuestros tatuadores residentes, pero contamos también con artistas invitados que vienen
        a nuestro estudio regularmente."
        ctas={[
          { label: "Conoce a todos los tatuadores", onClick: () => nav("/professionals") },
        ]}
        // Sustituyo el carrusel por el diseño de cards
        media={<HomeResidentProfessionals />}
      />

      {/* 2) Estilos */}
      <HomeSection
        id="estilos"
        bgClass="hpBgWhite"
        reverse
        kicker="Nuestros estilos"
        title="Estilos"
        text="Trabajamos una amplia variedad de estilos, siempre con un enfoque artístico y personalizado. 
        Te ayudamos a aterrizar tu idea para que quede tal y como la habías imaginado."
        bullets={[
          "Tradicional / Neotradicional",
          "Realismo Black and Grey / Blackwork",
          "Fineline / Ornamental",
          "Cover up (consultar primero con el tatuador)",
        ]}
        ctas={[
          { label: "Ver showroom", onClick: () => nav("/showroom") },
          { label: "Pedir cita", onClick: goBook },
        ]}
        media={<HomeStylesMosaic />}
      />

      {/* 3) Láser */}
      <HomeSection
        id="laser"
        bgClass="hpBgGold"
        kicker="Eliminación / atenuación"
        title="Láser"
        text="Si estás valorando eliminar o aclarar un tatuaje, también ofrecemos servicio de láser. Eriko es un gran profesional
        que cuenta con la última tecnología en eliminación / atenuación de tatuajes y micropigmentación. Visita su página web
        y ponte en contacto con él vía WhatsApp o Instagram."
        ctas={[
          { label: "Información láser", href: LASER_URL, external: true },
        ]}
        media={<HomeLaserMedia />}
      />

      {/* 4) Ubicación + mapa */}
      <HomeSection
        id="ubicacion"
        bgClass="hpBgBlack"
        reverse
        kicker="Dónde estamos"
        title="Ubicación"
        text="Podrás encontrarnos en Plaza Ortilla, nº2, local 4, en el barrio del Actur, en Zaragoza. 
        Nuestro horario es de martes a viernes de 12:00 a 20:00h."
        bullets={["Teléfono: 976 05 60 54", "Instagram: 62rosastattoo", "Email: 62rosastattoo@gmail.com"]}
        ctas={[
          {
            label: "Abrir en Google Maps",
            href: "https://www.google.com/maps/search/?api=1&query=Plaza%20Ortilla%202%20Zaragoza",
            external: true,
          },
          { label: "Llamar ahora", href: "tel:976056054" },
        ]}
        media={<HomeMap src={MAP_EMBED} />}
        mediaClassName="hpMedia--map"
      />

      {/* 5) Reserva tu cita */}
      <HomeSection
        id="reserva"
        bgClass="hpBgWhite"
        kicker="Citas"
        title="Reserva tu cita"
        text="Reserva online según disponibilidad real. Después podrás gestionar tu cita y subir tu imagen de referencia."
        bullets={["Disponibilidad por duración", "Gestión desde tu zona privada"]}
        ctas={[
          { label: "Reservar ahora", onClick: goBook },
          { label: "Ver mis citas", onClick: () => nav("/my-appointments") },
        ]}
        images={imgCita}
      />

      {/* 8) Reseñas */}
      <GoogleReviewsSection />
    </div>
  );
}