import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">62 Rosas Tattoo</div>
          <div className="footer__muted">
            Plaza Ortilla, nº 2, local 4 · 50018, Zaragoza
          </div>
          <div className="footer__muted">
            Martes – Viernes · 12:00–20:00 · 976 05 60 54
          </div>
        </div>

        <div className="footer__cols">
          <div className="footer__col">
            <div className="footer__title">Contacto</div>
            <a className="footer__link" href="mailto:62rosastattoo@gmail.com">62rosastattoo@gmail.com</a>
            <a className="footer__link" href="https://www.instagram.com/62rosastattoo/" target="_blank" rel="noreferrer">
              Instagram: 62rosastattoo
            </a>
          </div>

          <div className="footer__col">
            <div className="footer__title">Servicios</div>
            <a className="footer__link" href="/showroom">Tatuajes</a>
            <a className="footer__link" href="https://eliminartatuajeszaragoza.com/" target="_blank" rel="noreferrer">
              Láser
            </a>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__muted">
            62 Rosas Tattoo © 2020 - {new Date().getFullYear()}. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}