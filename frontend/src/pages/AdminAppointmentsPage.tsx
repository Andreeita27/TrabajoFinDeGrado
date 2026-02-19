import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { cancelAppointment, confirmDeposit, getAllAppointments } from "../api/appointmentsApi";
import { useAuth } from "../auth/AuthContext";
import type { AppointmentDto, AppointmentState } from "../types/appointment";

export default function AdminAppointmentsPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [error, setError] = useState("");

  const [stateFilter, setStateFilter] = useState<AppointmentState | "ALL">("ALL");

  const load = async () => {
    if (!token) return;

    setError("");
    try {
      const data = await getAllAppointments(token);
      setItems(data);
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true });
        return;
      }
      setError(e?.message || "Error cargando citas");
    }
  };

  useEffect(() => {
    if (!token) {
      nav("/login", { replace: true });
      return;
    }
    if (role !== "ADMIN") {
      nav("/", { replace: true });
      return;
    }

    load();
  }, [token, role]);

  const onPayDeposit = async (id: number) => {
    if (!token) return;

    setError("");
    try {
      await confirmDeposit(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error confirmando señal");
    }
  };

  const onCancel = async (id: number) => {
    if (!token) return;

    setError("");
    try {
      await cancelAppointment(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cancelando cita");
    }
  };

  const filtered = stateFilter === "ALL" ? items : items.filter((a) => a.state === stateFilter);

  return (
    <div style={{ padding: 16 }}>
      <h1>Citas (Admin)</h1>

      {error && <div style={{ color: "tomato" }}>{error}</div>}

      <div style={{ margin: "10px 0", display: "flex", gap: 10, alignItems: "center" }}>
        <label>
          Filtrar por estado:{" "}
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value as any)}>
            <option value="ALL">Todas</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="COMPLETED">Completada</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="NO_SHOW">No apareció</option>
          </select>
        </label>

        <button onClick={load}>Refrescar</button>
      </div>

      {filtered.length === 0 ? (
        <p>No hay citas.</p>
      ) : (
        <ul>
          {filtered.map((a) => (
            <li key={a.id} style={{ marginBottom: 10 }}>
              <div>
                <b>#{a.id}</b> — {a.startDateTime} — prof:{a.professionalId} — client:{a.clientId} —{" "}
                <b>{a.state}</b> — señal:{String(a.depositPaid)}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {!a.depositPaid && a.state === "PENDING" && (
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