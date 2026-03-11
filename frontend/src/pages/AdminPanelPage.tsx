import { Link } from "react-router-dom";
import "../styles/adminPanel.css";

export default function AdminPanelPage() {
  return (
    <div className="admin-panel-page">
      <header className="admin-panel-hero">
        <p className="admin-panel-kicker">Panel de administración</p>
        <h1 className="admin-panel-title">Control del estudio</h1>
        <p className="admin-panel-text">
          Desde aquí puedes gestionar las reservas, organizar la disponibilidad
          de los tatuadores y mantener el flujo diario del estudio bajo control.
        </p>
      </header>

      <div className="admin-panel-summary">
        <span className="admin-panel-chip">Área privada</span>
        <span className="admin-panel-chip">Gestión interna</span>
      </div>

      <section className="admin-panel-grid">
        <Link to="/admin/appointments" className="admin-panel-card">
          <p className="admin-panel-card__eyebrow">Reservas</p>
          <h2 className="admin-panel-card__title">Gestionar citas</h2>
          <p className="admin-panel-card__text">
            Consulta todas las reservas, revisa su estado, confirma señales,
            reprograma sesiones y marca citas como completadas o no asistidas.
          </p>

          <div className="admin-panel-card__tags">
            <span className="admin-panel-card__tag">Listado completo</span>
            <span className="admin-panel-card__tag">Estados</span>
            <span className="admin-panel-card__tag">Reprogramación</span>
          </div>
        </Link>

        <Link to="/admin/availability" className="admin-panel-card">
          <p className="admin-panel-card__eyebrow">Agenda</p>
          <h2 className="admin-panel-card__title">Disponibilidad y bloqueos</h2>
          <p className="admin-panel-card__text">
            Organiza las ventanas horarias de trabajo y crea bloqueos para
            descansos, vacaciones, convenciones u otras ausencias del equipo.
          </p>

          <div className="admin-panel-card__tags">
            <span className="admin-panel-card__tag">Ventanas activas</span>
            <span className="admin-panel-card__tag">Bloqueos</span>
            <span className="admin-panel-card__tag">Control horario</span>
          </div>
        </Link>
      </section>

      <div className="admin-panel-note">
        <strong>Consejo:</strong> usa primero el panel de citas para revisar el
        día a día del estudio y después entra en disponibilidad cuando necesites
        abrir nuevos huecos o bloquear tramos concretos.
      </div>
    </div>
  );
}