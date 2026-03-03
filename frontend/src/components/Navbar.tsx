import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../styles/navbar.css";

export default function Navbar() {
  const { isAuthenticated, role, logout } = useAuth();

  const accountLink = role === "ADMIN" ? "/admin" : "/my-account";
  const accountText = role === "ADMIN" ? "Panel admin" : "Mi cuenta";

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="brand">62 Rosas Tattoo</Link>

        <nav className="navlinks">
          <Link to="/showroom">Showroom</Link>
          <Link to="/professionals">Tatuadores</Link>
          <Link to="/reviews">Reseñas</Link>
        </nav>

        <div className="navright">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-ghost">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-primary">Registro</Link>
            </>
          ) : (
            <>
              <Link to={accountLink} className="btn btn-ghost">{accountText}</Link>
              <button className="btn btn-primary" onClick={logout}>Cerrar sesión</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}