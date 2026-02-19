import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { cancelAppointment, confirmDeposit, getMyAppointments } from "../api/appointmentsApi";
import { useAuth } from "../auth/AuthContext";
import type { AppointmentDto } from "../types/appointment";

export default function MyAppointmentsPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    if (!token) return;
    setError("");
    try {
      const data = await getMyAppointments(token);
      setItems(data);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        nav("/login", { replace: true, state: { from: "/my-appointments" } });
        return;
      }
      setError(e?.message || "Error cargando citas");
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const onPayDeposit = async (id: number) => {
    if (!token) return;

    if (role !== "ADMIN") {
      setError("Solo el tatuador puede confirmar la señal.");
      return;
    }

    try {
      await confirmDeposit(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error confirmando señal");
    }
  };

  const onCancel = async (id: number) => {
    if (!token) return;
    try {
      await cancelAppointment(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cancelando cita");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Mis citas</h1>

      {error && <div style={{ color: "tomato" }}>{error}</div>}

      {items.length === 0 ? (
        <div>No tienes citas todavía.</div>
      ) : (
        <ul>
          {items.map((a) => (
            <li key={a.id} style={{ marginBottom: 10 }}>
              <div>
                <b>{a.startDateTime}</b> — {a.professionalName} — {a.state} — {a.durationMinutes} min
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {role === "ADMIN" && !a.depositPaid && a.state === "PENDING" && (
                  <button onClick={() => onPayDeposit(a.id)}>Confirmar señal</button>
                )}

                {a.state === "PENDING" || a.state === "CONFIRMED" ? (
                  <button onClick={() => onCancel(a.id)}>Cancelar</button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}