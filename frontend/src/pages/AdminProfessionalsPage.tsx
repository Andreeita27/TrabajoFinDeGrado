import { Link } from "react-router-dom";

export default function AdminProfessionalsPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Gestionar Profesionales</h1>

      <Link to="/admin">Volver al panel</Link>
    </div>
  );
}