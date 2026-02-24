import { Link } from "react-router-dom";

export default function AdminPanelPage() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Panel Admin</h1>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <Link to="/admin/tattoos">Gestionar Tattoos Existentes</Link>
        <Link to="/admin/professionals">Gestionar Profesionales</Link>
        <Link to="/admin/appointments">Gestionar Citas</Link>
        <Link to="/admin/availability">Disponibilidad y bloqueos</Link>
      </div>
    </div>
  );
}