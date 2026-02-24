import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import {
  cancelAppointment,
  confirmDeposit,
  getAllAppointments,
  markCompleted,
  markNoShow,
} from "../api/appointmentsApi";
import { useAuth } from "../auth/AuthContext";
import type { AppointmentDto, AppointmentState } from "../types/appointment";

type DepositFilter = "ALL" | "PAID" | "UNPAID";

export default function AdminAppointmentsPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [error, setError] = useState("");

  // Filtros
  const [stateFilter, setStateFilter] = useState<AppointmentState | "ALL">("ALL");
  const [depositFilter, setDepositFilter] = useState<DepositFilter>("ALL");
  const [professionalName, setProfessionalName] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");

  // Rango fechas
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const toIso = (v: string) => (v ? new Date(v).toISOString() : undefined);

  const load = async () => {
    if (!token) return;

    setError("");
    try {
      const data = await getAllAppointments(token, {
        state: stateFilter === "ALL" ? undefined : stateFilter,
        depositPaid: depositFilter === "ALL" ? undefined : depositFilter === "PAID",
        dateFrom: toIso(dateFrom),
        dateTo: toIso(dateTo),
        professionalName: professionalName.trim() ? professionalName.trim() : undefined,
        clientName: clientName.trim() ? clientName.trim() : undefined,
      });

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

  useEffect(() => {
    if (!token || role !== "ADMIN") return;

    const t = window.setTimeout(() => {
      load();
    }, 300);

    return () => window.clearTimeout(t);
  }, [stateFilter, depositFilter, professionalName, clientName, dateFrom, dateTo]);

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

  const onMarkCompleted = async (id: number) => {
    if (!token) return;

    const ok = window.confirm("¿Marcar esta cita como COMPLETADA?");
    if (!ok) return;

    setError("");
    try {
      await markCompleted(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error marcando como completada");
    }
  };

  const onMarkNoShow = async (id: number) => {
    if (!token) return;

    const ok = window.confirm("¿Marcar esta cita como NO-SHOW?");
    if (!ok) return;

    setError("");
    try {
      await markNoShow(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error marcando como no-show");
    }
  };

  const onClearFilters = () => {
    setStateFilter("ALL");
    setDepositFilter("ALL");
    setProfessionalName("");
    setClientName("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Todas las citas</h1>

      {error && <div style={{ color: "tomato", marginBottom: 10 }}>{error}</div>}

      {/* Filtros */}
      <div
        style={{
          margin: "10px 0 16px",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "end",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          Estado
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value as any)}>
            <option value="ALL">Todas</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="COMPLETED">Completada</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="NO_SHOW">No apareció</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Señal
          <select value={depositFilter} onChange={(e) => setDepositFilter(e.target.value as any)}>
            <option value="ALL">Todas</option>
            <option value="PAID">Pagada</option>
            <option value="UNPAID">No pagada</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Profesional
          <input
            value={professionalName}
            onChange={(e) => setProfessionalName(e.target.value)}
            placeholder="Ej: Titi"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Cliente
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ej: Andrea / Fernández"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Desde
          <input
            type="datetime-local"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Hasta
          <input
            type="datetime-local"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClearFilters}>Limpiar</button>
        </div>
      </div>

      {/* Tabla */}
      {items.length === 0 ? (
        <p>No hay citas.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Número de cita</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Fecha</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Profesional</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Cliente</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Estado</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Señal</th>
                <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <b>#{a.id}</b>
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {new Date(a.startDateTime).toLocaleString("es-ES")}
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {a.professionalName}
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {a.clientFullName ??
                      (`${a.clientName ?? ""} ${a.clientSurname ?? ""}`.trim() || `#${a.clientId}`)}
                  </td>
                  
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <b>{a.state}</b>
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {a.depositPaid ? "Sí" : "No"}
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {!a.depositPaid && a.state === "PENDING" && (
                        <button onClick={() => onPayDeposit(a.id)}>Confirmar señal</button>
                      )}

                      {a.state === "PENDING" || a.state === "CONFIRMED" ? (
                        <button onClick={() => onCancel(a.id)}>Cancelar</button>
                      ) : null}

                      {a.state === "CONFIRMED" ? (
                        <>
                          <button onClick={() => onMarkCompleted(a.id)}>Marcar completada</button>
                          <button onClick={() => onMarkNoShow(a.id)}>El cliente no ha aparecido</button>
                        </>
                      ) : null}

                      {a.state === "COMPLETED" && (
                        <button onClick={() => nav(`/admin/appointments/${a.id}/tattoo/new`)}>
                          Añadir tattoo a Showroom
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}