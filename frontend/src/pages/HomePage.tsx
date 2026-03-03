import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();

  const handleBook = () => {
    if (isAuthenticated) nav("/calendar");
    else nav("/login", { state: { from: "/calendar" } });
  };

  return (
    <div className="container">
      <div className="card" style={{ padding: 18 }}>
        <h1 style={{ marginTop: 0 }}>62 Rosas Tattoo</h1>
        <p style={{ color: "var(--muted)" }}>
          Info del estudio (ubicación, horarios, estilos, etc.). Aquí luego lo dejo guapísimo.
        </p>

        <button className="btn btn-primary" onClick={handleBook}>
          Pedir cita
        </button>
      </div>
    </div>
  );
}