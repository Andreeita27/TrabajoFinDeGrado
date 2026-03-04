import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import {
  cancelAppointment,
  confirmDeposit,
  getAllAppointments,
  markCompleted,
  markNoShow,
  rescheduleAppointment,

} from "../api/appointmentsApi";
import { useAuth } from "../auth/AuthContext";
import type { AppointmentDto, AppointmentState } from "../types/appointment";
import type { ClientDto } from "../types/client";
import { searchClients } from "../api/clientsApi";
import { getAvailability } from "../api/availabilityApi";
import type { AvailabilitySlotDto } from "../types/availability";

type DepositFilter = "ALL" | "PAID" | "UNPAID";

const OPEN_HOUR = "12:00:00";
const CLOSE_HOUR = "20:00:00";
const stepMinutes = 30;

function withSeconds(isoOrLocal: string) {
  return isoOrLocal.length === 16 ? `${isoOrLocal}:00` : isoOrLocal;
}

function formatSlotLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES");
  } catch {
    return iso;
  }
}

export default function AdminAppointmentsPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [error, setError] = useState("");

  // Filtros
  const [stateFilter, setStateFilter] = useState<AppointmentState | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "TATTOO" | "CONSULTATION">("ALL");
  const [depositFilter, setDepositFilter] = useState<DepositFilter>("ALL");
  const [professionalName, setProfessionalName] = useState<string>("");

  const [clientName, setClientName] = useState<string>(""); // este sigue siendo el filtro que mando al backend
  const [clientQuery, setClientQuery] = useState<string>(""); // lo que escribe el admin
  const [clientOptions, setClientOptions] = useState<ClientDto[]>([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);

  // Rango fechas
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDay, setRescheduleDay] = useState<string>("");
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlotDto[]>([]);
  const [rescheduleStart, setRescheduleStart] = useState<string>("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

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

  // Autocomplete clientes
  useEffect(() => {
    if (!token) return;

    const q = clientQuery.trim();
    if (!q) {
      setClientOptions([]);
      setClientLoading(false);
      return;
    }

    setClientLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const res = await searchClients(token, q);
        setClientOptions(res);
        setClientOpen(true);
      } catch {
        setClientOptions([]);
        setClientOpen(true);
      } finally {
        setClientLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(t);
  }, [clientQuery, token]);

  // Cerrar desplegable al click fuera
  const clientWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!clientWrapRef.current) return;
      if (!clientWrapRef.current.contains(e.target as Node)) setClientOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const onSelectClient = (c: ClientDto) => {
    const full = `${c.clientName ?? ""} ${c.clientSurname ?? ""}`.trim();
    setClientQuery(full); //deja el texto bonito en el input
    setClientName(full); //esto es lo que filtra realmente
    setClientOpen(false); //cierra desplegable al seleccionar
    setClientOptions([]); //limpia lista para que no se quede abierta
  };

  const onClearFilters = () => {
    setStateFilter("ALL");
    setTypeFilter("ALL");
    setDepositFilter("ALL");
    setProfessionalName("");
    setClientName("");
    setClientQuery("");
    setClientOptions([]);
    setClientOpen(false);
    setDateFrom("");
    setDateTo("");
  };

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

  const closeReschedule = () => {
    setRescheduleId(null);
    setRescheduleDay("");
    setRescheduleSlots([]);
    setRescheduleStart("");
    setRescheduleLoading(false);
    setRescheduleSaving(false);
  };

  const openReschedule = (a: AppointmentDto) => {
    setError("");
    setRescheduleId(a.id);
    setRescheduleDay("");
    setRescheduleSlots([]);
    setRescheduleStart("");
    setRescheduleLoading(false);
    setRescheduleSaving(false);
  };

  // Cargar slots cuando el admin elige día
  useEffect(() => {
    if (!token) return;
    if (!rescheduleId) return;
    if (!rescheduleDay) {
      setRescheduleSlots([]);
      setRescheduleStart("");
      return;
    }

    const appointment = items.find((x) => x.id === rescheduleId);
    if (!appointment) return;

    setRescheduleLoading(true);
    setRescheduleSlots([]);
    setRescheduleStart("");
    setError("");

    const fromIso = `${rescheduleDay}T${OPEN_HOUR}`;
    const toIso = `${rescheduleDay}T${CLOSE_HOUR}`;

    getAvailability(token, {
      professionalId: appointment.professionalId,
      dateFrom: fromIso,
      dateTo: toIso,
      durationMinutes: appointment.durationMinutes,
      stepMinutes,
    })
      .then((res) => setRescheduleSlots(res.slots))
      .catch((e: any) => setError(e?.message || "Error cargando disponibilidad"))
      .finally(() => setRescheduleLoading(false));
  }, [token, rescheduleId, rescheduleDay, items]);

  const onSaveReschedule = async () => {
    if (!token) return;
    if (!rescheduleId) return;

    if (!rescheduleStart) {
      setError("Selecciona un nuevo slot.");
      return;
    }

    try {
      setError("");
      setRescheduleSaving(true);
      await rescheduleAppointment(token, rescheduleId, withSeconds(rescheduleStart));
      closeReschedule();
      await load();
    } catch (e: any) {
      setError(e?.message || "Error reprogramando cita");
    } finally {
      setRescheduleSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    let out = items;

    if (typeFilter !== "ALL") {
      out = out.filter((a) => a.appointmentType === typeFilter);
    }

    if (depositFilter !== "ALL") {
      out = out.filter((a) => {
        if (a.appointmentType === "CONSULTATION") return true;
        return depositFilter === "PAID" ? a.depositPaid : !a.depositPaid;
      });
    }

    return out;
  }, [items, typeFilter, depositFilter]);

  return (
    <div style={{ padding: 16 }}>
      <h1>Todas las citas</h1>

      {error && <div style={{ color: "tomato", marginBottom: 10 }}>{error}</div>}

      {/* Filtros */}
      <div
        style={{
          margin: "10px 0 16px",
          display: "flex",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6, minWidth: 220 }}>
            Tipo:
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
              <option value="ALL">Todas</option>
              <option value="TATTOO">Sesión</option>
              <option value="CONSULTATION">Consulta</option>
            </select>
          </label>
        </div>
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
          <input value={professionalName} onChange={(e) => setProfessionalName(e.target.value)} placeholder="Ej: Titi" />
        </label>

        <div ref={clientWrapRef} style={{ display: "grid", gap: 6, position: "relative" }}>
          <label style={{ display: "grid", gap: 6 }}>
            Cliente
            <input
              value={clientQuery}
              onChange={(e) => {
                const v = e.target.value;
                setClientQuery(v);
                setClientName(v);
                setClientOpen(true);
              }}
              onFocus={() => {
                if (clientQuery.trim()) setClientOpen(true);
              }}
              placeholder="Ej: Andrea / Fernández"
            />
          </label>

          {clientOpen && clientQuery.trim() && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 6,
                border: "1px solid #333",
                borderRadius: 8,
                background: "#111",
                zIndex: 20,
                maxHeight: 220,
                overflow: "auto",
              }}
            >
              {clientLoading && <div style={{ padding: 10, opacity: 0.8 }}>Buscando…</div>}

              {!clientLoading && clientOptions.length === 0 && (
                <div style={{ padding: 10, opacity: 0.8 }}>Sin resultados</div>
              )}

              {!clientLoading &&
                clientOptions.map((c) => {
                  const full = `${c.clientName ?? ""} ${c.clientSurname ?? ""}`.trim();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectClient(c)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 10,
                        border: "none",
                        background: "transparent",
                        color: "white",
                        cursor: "pointer",
                        borderBottom: "1px solid #222",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{full}</div>
                      {c.email && <div style={{ opacity: 0.75, fontSize: 12 }}>{c.email}</div>}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          Desde
          <input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Hasta
          <input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClearFilters}>Limpiar</button>
        </div>
      </div>

      {/* Tabla */}
      {filteredItems.length === 0 ? (
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
              {filteredItems.map((a) => (
                <tr key={a.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <b>#{a.id}</b>
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {new Date(a.startDateTime).toLocaleString("es-ES")}
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{a.professionalName}</td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {a.clientFullName ??
                      (`${a.clientName ?? ""} ${a.clientSurname ?? ""}`.trim() || `#${a.clientId}`)}
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <b>{a.state}</b>
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {a.appointmentType === "TATTOO" ? (a.depositPaid ? "Sí" : "No") : ""}
                  </td>

                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {a.appointmentType === "TATTOO" && !a.depositPaid && a.state === "PENDING" && (
                        <button onClick={() => onPayDeposit(a.id)}>Confirmar señal</button>
                      )}

                      {(a.state === "PENDING" || a.state === "CONFIRMED") && (
                        <>
                          <button onClick={() => nav(`/admin/appointments/${a.id}`)}>Ver detalle</button>
                          <button onClick={() => onCancel(a.id)}>Cancelar</button>
                          <button onClick={() => openReschedule(a)}>Reprogramar</button>
                        </>
                      )}

                      {a.state === "CONFIRMED" ? (
                        <>
                          <button onClick={() => onMarkCompleted(a.id)}>Marcar completada</button>
                          <button onClick={() => onMarkNoShow(a.id)}>El cliente no ha aparecido</button>
                        </>
                      ) : null}

                      {a.state === "COMPLETED" && !a.showroomTattooCreated && (
                        <button onClick={() => nav(`/admin/appointments/${a.id}/tattoo/new`)}>
                          Añadir tattoo a Showroom
                        </button>
                      )}
                    </div>

                    {rescheduleId === a.id && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 10,
                          border: "1px solid #333",
                          borderRadius: 8,
                          maxWidth: 780,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Reprogramar cita</div>

                        <label style={{ display: "grid", gap: 6, maxWidth: 260 }}>
                          Día
                          <input
                            type="date"
                            value={rescheduleDay}
                            onChange={(e) => setRescheduleDay(e.target.value)}
                            disabled={rescheduleLoading || rescheduleSaving}
                          />
                        </label>

                        <div style={{ marginTop: 10 }}>
                          {rescheduleLoading ? (
                            <div style={{ opacity: 0.8 }}>Cargando slots…</div>
                          ) : rescheduleSlots.length === 0 ? (
                            <div style={{ opacity: 0.8 }}>
                              {rescheduleDay ? "No hay slots disponibles ese día." : "Selecciona un día para ver slots."}
                            </div>
                          ) : (
                            <div style={{ display: "grid", gap: 6 }}>
                              {rescheduleSlots.map((s, idx) => {
                                const start = String((s as any).startDateTime);
                                return (
                                  <label key={idx} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                    <input
                                      type="radio"
                                      name={`slot-${a.id}`}
                                      value={start}
                                      checked={rescheduleStart === start}
                                      onChange={() => setRescheduleStart(start)}
                                      disabled={rescheduleSaving}
                                    />
                                    {formatSlotLabel(start)}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                          <button
                            onClick={onSaveReschedule}
                            disabled={!rescheduleStart || rescheduleLoading || rescheduleSaving}
                          >
                            {rescheduleSaving ? "Guardando..." : "Guardar cambio"}
                          </button>

                          <button onClick={closeReschedule} disabled={rescheduleLoading || rescheduleSaving}>
                            Cancelar
                          </button>
                        </div>

                        <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}></div>
                      </div>
                    )}
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