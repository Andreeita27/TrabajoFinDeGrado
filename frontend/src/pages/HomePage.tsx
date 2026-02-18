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
    <div style={{ padding: 16 }}>
      <h1>62 Rosas Tattoo</h1>
      <p>
        Info del estudio (ubicación, horarios, estilos, etc.) Aquí luego lo dejo guapísimo.
      </p>

      <button onClick={handleBook}>Pedir cita</button>
    </div>
  );
}