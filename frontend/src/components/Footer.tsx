import { Link } from "react-router-dom";
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div className="footer__left">
            <div className="footer__brandRow">
              <img
                src="/images/logo-sinfondo.svg"
                alt="62 Rosas Tattoo"
                className="footer__logo"
              />

              <div className="footer__brandText">
                <div className="footer__studio">62 ROSAS TATTOO</div>

                <div className="footer__subtitle">
                  Tatuaje y láser en Zaragoza
                </div>
              </div>
            </div>

            <p className="footer__text">
              Estudio de tatuajes con un enfoque <strong>artístico, cuidado y totalmente
              personalizado</strong>. Creamos piezas pensadas para encajar contigo, con
              atención al detalle en cada fase del proceso.
            </p>

            <div className="footer__info">
              <div className="footer__infoItem">
                <span className="footer__infoIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M12 21s-6.5-5.4-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.6-6.5 11-6.5 11Zm0-8.2A2.8 2.8 0 1 0 12 7a2.8 2.8 0 0 0 0 5.6Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>Plaza Ortilla nº 2, local 4 · 50018 Zaragoza</span>
              </div>

              <div className="footer__infoItem">
                <span className="footer__infoIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm1 5h-2v6l5 3 1-1.7-4-2.3V7Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>Martes – Viernes · 12:00–20:00</span>
              </div>

              <div className="footer__infoItem">
                <span className="footer__infoIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.3 1 .3 2.1.4 3.2.4.7 0 1.2.5 1.2 1.2V20c0 .7-.5 1.2-1.2 1.2C10.4 21.2 2.8 13.6 2.8 4.2 2.8 3.5 3.3 3 4 3h3.5c.7 0 1.2.5 1.2 1.2 0 1.1.1 2.2.4 3.2.1.4 0 .9-.3 1.2l-2.2 2.2Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>976 05 60 54</span>
              </div>
            </div>

            <div className="footer__actions">
              <Link to="/calendar" className="btn btn-primary">
                Reservar cita
              </Link>
            </div>
          </div>

          <div className="footer__right">
            <div className="footer__col">
              <div className="footer__colTitle">Contacto</div>

              <div className="footer__socials">
                <a
                  className="footer__social"
                  href="mailto:62rosastattoo@gmail.com"
                  aria-label="Enviar email"
                  title="Enviar email"
                >
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M4 6h16v12H4zM4 6l8 6 8-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>

                <a
                  className="footer__social"
                  href="https://www.instagram.com/62rosastattoo/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                >
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 6.5A3.5 3.5 0 1 0 15.5 12 3.5 3.5 0 0 0 12 8.5Zm4.75-2.75h.01"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer__col">
              <div className="footer__colTitle">Servicios</div>

              <Link className="footer__link" to="/showroom">
                Tatuajes
              </Link>
              <Link className="footer__link" to="/laser">
                Láser
              </Link>
              <Link className="footer__link" to="/calendar">
                Reservar cita
              </Link>
            </div>

            <div className="footer__col">
              <div className="footer__colTitle">Navegación</div>

              <Link className="footer__link" to="/">
                Inicio
              </Link>
              <Link className="footer__link" to="/professionals">
                Tatuadores
              </Link>
              <Link className="footer__link" to="/showroom">
                Showroom
              </Link>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__copyright">
            62 Rosas Tattoo © 2020 - {new Date().getFullYear()}. Todos los derechos reservados.
          </div>

          <div className="footer__bottomNav">
            <Link className="footer__bottomLink" to="/">
              Inicio
            </Link>
            <Link className="footer__bottomLink" to="/showroom">
              Showroom
            </Link>
            <Link className="footer__bottomLink" to="/laser">
              Láser
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}