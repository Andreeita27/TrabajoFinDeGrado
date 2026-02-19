import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getAppointmentsAdmin } from "../api/appointmentsApi";
import type { AppointmentDto } from "../types/appointment";

export default function AdminCompletedAppointmentsPage() {
  const { token } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    getAppointmentsAdmin(token, { state: "COMPLETED" })
      .then(setItems)
      .catch((e) => setError(e?.message || "Error cargando citas COMPLETED"));
  }, [token]);

  return (
    <div style={{ padding: 16 }}>
      <h1>Citas COMPLETED</h1>

      {error && <div style={{ color: "tomato" }}>{error}</div>}

      <ul style={{ display: "grid", gap: 10 }}>
        {items.map((a) => (
          <li key={a.id} style={{ border: "1px solid #333", padding: 12 }}>
            <div><strong>ID cita:</strong> {a.id}</div>

            {"professionalId" in a && <div><strong>Professional:</strong> {(a as any).professionalId}</div>}
            {"clientId" in a && <div><strong>Client:</strong> {(a as any).clientId}</div>}
            {"startDateTime" in a && <div><strong>Fecha:</strong> {new Date((a as any).startDateTime).toLocaleString()}</div>}

            <button
              style={{ marginTop: 8 }}
              onClick={() => nav(`/admin/tattoos/new?appointmentId=${a.id}`, { state: a })}
            >
              Crear tattoo
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}