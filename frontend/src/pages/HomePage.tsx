import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import HomeCarousel from "../components/HomeCarousel";
import "../styles/homeOnePage.css";
import HomeMap from "../components/HomeMap";



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
    <section id={p.id} ref={ref as any} className={`hpSection ${p.bgClass} ${p.reverse ? "hpReverse" : ""} ${on ? "hpOn" : ""}`}>
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

        <div className="hpMedia hpReveal">
          {p.media ? p.media : <HomeCarousel images={p.images ?? []} intervalMs={2600} alt={p.title} />}
        </div>
      </div>
    </section>
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
  const imgEstilos = ["/home/styles_01.jpg", "/home/styles_02.jpg", "/home/styles_03.jpg"];
  const imgHechos = ["/home/done_01.jpg", "/home/done_02.jpg", "/home/done_03.jpg"];
  const imgDesigns = ["/home/designs_01.jpg", "/home/designs_02.jpg", "/home/designs_03.jpg"];
  const imgPros = ["/home/pros_01.jpg", "/home/pros_02.jpg", "/home/pros_03.jpg"];
  const imgLaser = ["/home/laser_01.jpg", "/home/laser_02.jpg"];
  const imgCita = ["/home/book_01.jpg", "/home/book_02.jpg"];
  const imgReviews = ["/home/reviews_01.jpg", "/home/reviews_02.jpg"];

  return (
    <div className="hpPage">
      <section className="hpPosterHero">
        <div className="hpPosterFrame" />

        <div className="hpPosterInner">
          <div className="hpPosterLogoWrap">
            <img
              src="/images/logo-sinfondo.svg"
              className="hpPosterLogo"
              alt="62 Rosas Tattoo"
            />
          </div>

          <div className="hpPosterCenter">
            <div className="hpPosterKicker">
              ESTUDIO DE TATUAJES Y LÁSER
            </div>

            <div className="hpPosterDivider" />

            <div className="hpPosterCity">
              ZARAGOZA
            </div>
          </div>

          <div className="hpPosterBottom">
            <button
              className="btn btn-primary hpPosterCta"
              onClick={goBook}
            >
              ¡PIDE TU CITA AHORA!
            </button>
          </div>
        </div>
      </section>
      {/* 1) Estilos */}
      <HomeSection
        id="estilos"
        bgClass="hpBgBlack"
        kicker="Nuestros estilos"
        title="Estilos"
        text="Trabajamos una amplia variedad de estilos, siempre con un enfoque artístico y personalizado. Te ayudamos a aterrizar tu idea para que quede potente y con buena lectura."
        bullets={[
          "Tradicional / neo-tradicional",
          "Fineline / blackwork",
          "Realismo / ornamental",
          "Cover up (si aplica)",
        ]}
        ctas={[
          { label: "Ver showroom", onClick: () => nav("/showroom") },
          { label: "Pedir cita", onClick: goBook },
        ]}
        images={imgEstilos}
      />

      {/* 2) Tatuajes realizados */}
      <HomeSection
        id="tatuajes"
        bgClass="hpBgWhite"
        reverse
        kicker="Showroom"
        title="Tatuajes realizados"
        text="Una selección de trabajos reales del estudio. Puedes explorarlos por estilo, color o cover up desde el showroom."
        ctas={[
          { label: "Ir al showroom", onClick: () => nav("/showroom") },
          { label: "Pedir cita", onClick: goBook },
        ]}
        images={imgHechos}
      />

      {/* 3) Diseños disponibles */}
      <HomeSection
        id="designs"
        bgClass="hpBgGold"
        kicker="Flash / diseños"
        title="Diseños disponibles"
        text="Ideas preparadas para tatuar. Si te gusta un diseño, lo adaptamos a tu cuerpo, tamaño y preferencias."
        ctas={[
          { label: "Ver diseños", onClick: () => nav("/showroom") }, // tu tab de designs está ahí
          { label: "Pedir cita", onClick: goBook },
        ]}
        images={imgDesigns}
      />

      {/* 4) Tatuadores */}
      <HomeSection
        id="tatuadores"
        bgClass="hpBgBlack"
        reverse
        kicker="Equipo"
        title="Tatuadores"
        text="Conoce al equipo de 62 Rosas Tattoo. Te asesoramos según tu idea, el estilo y la zona para que el resultado sea redondo."
        ctas={[
          { label: "Ver tatuadores", onClick: () => nav("/professionals") },
          { label: "Pedir cita", onClick: goBook },
        ]}
        images={imgPros}
      />

      {/* 5) Láser */}
      <HomeSection
        id="laser"
        bgClass="hpBgWhite"
        kicker="Eliminación / atenuación"
        title="Láser"
        text="Servicio de láser gestionado desde la web específica. Si estás valorando eliminar o aclarar un tatuaje, entra aquí."
        ctas={[
          { label: "Ir a láser", href: LASER_URL, external: true },
          { label: "Pedir cita", onClick: goBook },
        ]}
        images={imgLaser}
      />

      {/* 6) Reserva tu cita */}
      <HomeSection
        id="reserva"
        bgClass="hpBgGold"
        reverse
        kicker="Citas"
        title="Reserva tu cita"
        text="Reserva online según disponibilidad real. Después podrás gestionar tu cita y subir tu imagen de referencia desde el detalle."
        bullets={[
          "Disponibilidad por duración",
          "Gestión desde tu zona privada",
          "Imagen de referencia (1 por cita)",
        ]}
        ctas={[
          { label: "Reservar ahora", onClick: goBook },
          { label: "Ver mis citas", onClick: () => nav("/my-appointments") }, // si existe; si no, lo quitas
        ]}
        images={imgCita}
      />

      {/* 7) Ubicación + mapa */}
      <HomeSection
        id="ubicacion"
        bgClass="hpBgBlack"
        kicker="Dónde estamos"
        title="Ubicación"
        text="Plaza Ortilla, número 2, local 4, 50018 Zaragoza. De martes a viernes de 12:00 a 20:00h."
        bullets={[
          "Tel: 976 05 60 54",
          "Instagram: @62rosastattoo",
          "Email: 62rosastattoo@gmail.com",
        ]}
        ctas={[
          {
            label: "Abrir en Google Maps",
            href: "https://www.google.com/maps/search/?api=1&query=Plaza%20Ortilla%202%20Zaragoza",
            external: true,
          },
          { label: "Llamar ahora", href: "tel:976056054" },
        ]}
        media={<HomeMap src={MAP_EMBED} />}
      />

      {/* 8) Reseñas */}
      <HomeSection
        id="reseñas"
        bgClass="hpWhite"
        // ojo: typo a propósito para que se note si no existe. Te lo dejo correcto abajo.
        kicker="Opiniones"
        title="Reseñas"
        text="Opiniones reales de clientes. Nos ayudan muchísimo a mejorar y a que nuevas personas reserven con confianza."
        ctas={[
          { label: "Ver reseñas", onClick: () => nav("/reviews") },
          { label: "Pedir cita", onClick: goBook },
        ]}
        images={imgReviews}
      />
    </div>
  );
}