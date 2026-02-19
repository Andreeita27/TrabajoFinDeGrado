import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { isAuthenticated, role, logout } = useAuth();

  return (
    <nav style={{ display: "flex", gap: 14, padding: 12, borderBottom: "1px solid #333" }}>
      <Link to="/">Inicio</Link>
      <Link to="/showroom">Showroom</Link>
      <Link to="/professionals">Profesionales</Link>
      <Link to="/reviews">Reseñas</Link>

      <div style={{ marginLeft: "auto", display: "flex", gap: 14 }}>
        {!isAuthenticated ? (
          <>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/register">Registro</Link>
          </>
        ) : (
          <>
            <Link to="/my-appointments">Zona privada</Link>
            {role === "ADMIN" && <Link to="/admin">Admin</Link>}
            <button onClick={logout}>Cerrar sesión</button>
          </>
        )}
      </div>
    </nav>
  );
}