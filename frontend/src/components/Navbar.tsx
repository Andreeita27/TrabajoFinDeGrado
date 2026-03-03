import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useEffect, useState } from "react";
import "../styles/navbar.css";

export default function Navbar() {
  const { isAuthenticated, role, logout } = useAuth();
  const { pathname } = useLocation();

  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // inicial
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accountLink = role === "ADMIN" ? "/admin" : "/my-account";
  const accountText = role === "ADMIN" ? "Panel admin" : "Mi cuenta";

  // Marca links activos
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  const headerClass = [
    "navbar",
    isHome ? "navbar--home" : "",
    scrolled ? "navbar--scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass}>
      <div className="navbar__inner">
        <nav className="nav-left">
          <Link className={isActive("/showroom") ? "is-active" : ""} to="/showroom">
            Showroom
          </Link>
          <Link className={isActive("/professionals") ? "is-active" : ""} to="/professionals">
            Tatuadores
          </Link>
          <Link className={isActive("/reviews") ? "is-active" : ""} to="/reviews">
            Reseñas
          </Link>
        </nav>

        <Link to="/" className="nav-logo" aria-label="Ir a inicio">
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
              <Link to={accountLink} className="btn btn-ghost">
                {accountText}
              </Link>
              <button className="btn btn-primary" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}