import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useState } from "react";
import "../styles/navbar.css";

export default function Navbar() {
  const { isAuthenticated, role, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accountLink = role === "ADMIN" ? "/admin" : "/my-account";
  const accountText = role === "ADMIN" ? "Panel admin" : "Mi cuenta";

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  const headerClass = [
    "navbar",
    isHome ? "navbar--home" : "",
    scrolled ? "navbar--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleNavClick(e: React.MouseEvent, path: string) {
    if (pathname === path) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      navigate(path);
    }
  }

  return (
    <header className={headerClass}>
      <div className="navbar__inner">
        <nav className="nav-left">
          <Link
            className={isActive("/") ? "is-active" : ""}
            to="/"
            onClick={(e) => handleNavClick(e, "/")}
          >
            Inicio
          </Link>

          <Link
            className={isActive("/showroom") ? "is-active" : ""}
            to="/showroom"
            onClick={(e) => handleNavClick(e, "/showroom")}
          >
            Showroom
          </Link>

          <Link
            className={isActive("/professionals") ? "is-active" : ""}
            to="/professionals"
            onClick={(e) => handleNavClick(e, "/professionals")}
          >
            Tatuadores
          </Link>

          <Link
            className={isActive("/laser") ? "is-active" : ""}
            to="/laser"
            onClick={(e) => handleNavClick(e, "/laser")}
          >
            Láser
          </Link>
        </nav>

        <Link
          to="/"
          className="nav-logo"
          aria-label="Ir a inicio"
          onClick={(e) => handleNavClick(e, "/")}
        >
          <img src="/images/estudio.svg" alt="62 Rosas Tattoo" />
        </Link>

        <div className="nav-right">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-ghost">
                Iniciar sesión
              </Link>

              <Link to="/register" className="btn btn-primary">
                Registro
              </Link>
            </>
          ) : (
            <>
              <Link to="/calendar" className="btn btn-primary">
                Reservar cita
              </Link>

              <Link to={accountLink} className="btn btn-ghost">
                {accountText}
              </Link>

              <button className="btn btn-ghost" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}