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
import "../styles/adminAppointments.css";

type DepositFilter = "ALL" | "PAID" | "UNPAID";

const OPEN_HOUR = "12:00:00";
const CLOSE_HOUR = "20:00:00";
const stepMinutes = 30;

function withSeconds(isoOrLocal: string) {
  return isoOrLocal.length === 16 ? `${isoOrLocal}:00` : isoOrLocal;
}

// Asi no coge la hora del UTC, la coge del navegador
function todayLocalDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatSlotLabel(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES");
  } catch {
    return iso;
  }
}

function formatState(state?: string) {
  switch (state) {
    case "PENDING":
      return "Pendiente";
    case "CONFIRMED":
      return "Confirmada";
    case "COMPLETED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
    case "NO_SHOW":
      return "No asistió";
    default:
      return state ?? "-";
  }
}

function formatType(type?: string) {
  switch (type) {
    case "TATTOO":
      return "Sesión";
    case "CONSULTATION":
      return "Consulta";
    default:
      return type ?? "-";
  }
}

function getStateBadgeClass(state?: string) {
  switch (state) {
    case "PENDING":
      return "admin-appts-badge admin-appts-badge--pending";
    case "CONFIRMED":
      return "admin-appts-badge admin-appts-badge--confirmed";
    case "COMPLETED":
      return "admin-appts-badge admin-appts-badge--completed";
    case "CANCELLED":
      return "admin-appts-badge admin-appts-badge--cancelled";
    case "NO_SHOW":
      return "admin-appts-badge admin-appts-badge--no-show";
    default:
      return "admin-appts-badge";
  }
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("es-ES", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export default function AdminAppointmentsPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [error, setError] = useState("");

  const [stateFilter, setStateFilter] = useState<AppointmentState | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "TATTOO" | "CONSULTATION">("ALL");
  const [depositFilter, setDepositFilter] = useState<DepositFilter>("ALL");
  const [professionalName, setProfessionalName] = useState<string>("");

  const [clientName, setClientName] = useState<string>("");
  const [clientQuery, setClientQuery] = useState<string>("");
  const [clientOptions, setClientOptions] = useState<ClientDto[]>([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDay, setRescheduleDay] = useState<string>("");
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlotDto[]>([]);
  const [rescheduleStart, setRescheduleStart] = useState<string>("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  const toLocalDateTimeParam = (v: string) => {
    if (!v) return undefined;
    return withSeconds(v);
  };

  const load = async () => {
    if (!token) return;

    setError("");
    try {
      const data = await getAllAppointments(token, {
        state: stateFilter === "ALL" ? undefined : stateFilter,
        depositPaid: depositFilter === "ALL" ? undefined : depositFilter === "PAID",
        dateFrom: toLocalDateTimeParam(dateFrom),
        dateTo: toLocalDateTimeParam(dateTo),
        professionalName: professionalName.trim() ? professionalName.trim() : undefined,
        clientName: clientName.trim() ? clientName.trim() : undefined,
      });

      setItems(data);
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true });
        return;
      }

      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error cargando citas");
      }
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
    setClientQuery(full);
    setClientName(full);
    setClientOpen(false);
    setClientOptions([]);
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
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error confirmando señal";
      setError(message);
    }
  };

  const onCancel = async (id: number) => {
    if (!token) return;

    setError("");
    try {
      await cancelAppointment(token, id);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error cancelando cita";
      setError(message);
    }
  };

  const onMarkCompleted = async (id: number) => {
    if (!token) return;

    const ok = window.confirm("¿Marcar esta cita como completada?");
    if (!ok) return;

    setError("");
    try {
      await markCompleted(token, id);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error marcando completada";
      setError(message);
    }
  };

  const onMarkNoShow = async (id: number) => {
    if (!token) return;

    const ok = window.confirm("¿Marcar esta cita como no asistida?");
    if (!ok) return;

    setError("");
    try {
      await markNoShow(token, id);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error marcando como no asistida";
      setError(message);
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
      .catch((e: unknown) => {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          nav("/login", { replace: true });
          return;
        }

        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Error cargando disponibilidad");
        }
      })
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
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error reprogramando cita";
      setError(message);
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
    <div className="admin-appts-page">
      <header className="admin-appts-hero">
        <p className="admin-appts-kicker">Panel de administración</p>
        <h1 className="admin-appts-title">Gestión de citas</h1>
        <p className="admin-appts-text">
          Consulta todas las reservas del estudio, filtra por cliente o profesional
          y gestiona cambios de estado, señal y reprogramaciones desde un mismo panel.
        </p>
      </header>

      {error && (
        <div className="admin-appts-feedback admin-appts-feedback--error">
          {error}
        </div>
      )}

      <section className="admin-appts-filters">
        <div className="admin-appts-filters__head">
          <div>
            <h2 className="admin-appts-section-title">Filtrar citas</h2>
            <p className="admin-appts-section-text">
              Usa los filtros para localizar rápido una reserva concreta.
            </p>
          </div>

          <div className="admin-appts-actions">
            <button
              type="button"
              onClick={onClearFilters}
              className="admin-appts-btn admin-appts-btn--ghost"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="admin-appts-grid">
          <label className="admin-appts-field">
            <span className="admin-appts-label">Tipo</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "ALL" | "TATTOO" | "CONSULTATION")}
            >
              <option value="ALL">Todas</option>
              <option value="TATTOO">Sesión</option>
              <option value="CONSULTATION">Consulta</option>
            </select>
          </label>

          <label className="admin-appts-field">
            <span className="admin-appts-label">Estado</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as AppointmentState | "ALL")}
            >
              <option value="ALL">Todas</option>
              <option value="PENDING">Pendiente</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="COMPLETED">Completada</option>
              <option value="CANCELLED">Cancelada</option>
              <option value="NO_SHOW">No asistió</option>
            </select>
          </label>

          <label className="admin-appts-field">
            <span className="admin-appts-label">Señal</span>
            <select
              value={depositFilter}
              onChange={(e) => setDepositFilter(e.target.value as DepositFilter)}
            >
              <option value="ALL">Todas</option>
              <option value="PAID">Pagada</option>
              <option value="UNPAID">No pagada</option>
            </select>
          </label>

          <label className="admin-appts-field">
            <span className="admin-appts-label">Profesional</span>
            <input
              className="input"
              value={professionalName}
              onChange={(e) => setProfessionalName(e.target.value)}
              placeholder="Ej: Titi"
            />
          </label>

          <div
            ref={clientWrapRef}
            className="admin-appts-field admin-appts-field--wide admin-appts-client-wrap"
          >
            <label className="admin-appts-field">
              <span className="admin-appts-label">Cliente</span>
              <input
                className="input"
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
              <div className="admin-appts-client-dropdown">
                {clientLoading && (
                  <div className="admin-appts-client-empty">Buscando…</div>
                )}

                {!clientLoading && clientOptions.length === 0 && (
                  <div className="admin-appts-client-empty">Sin resultados</div>
                )}

                {!clientLoading &&
                  clientOptions.map((c) => {
                    const full = `${c.clientName ?? ""} ${c.clientSurname ?? ""}`.trim();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectClient(c)}
                        className="admin-appts-client-option"
                      >
                        <div className="admin-appts-client-name">{full}</div>
                        {c.email && (
                          <div className="admin-appts-client-email">{c.email}</div>
                        )}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <label className="admin-appts-field">
            <span className="admin-appts-label">Desde</span>
            <input
              className="input"
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>

          <label className="admin-appts-field">
            <span className="admin-appts-label">Hasta</span>
            <input
              className="input"
              type="datetime-local"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
        </div>
      </section>

      <div className="admin-appts-summary">
        <span className="admin-appts-chip">
          {filteredItems.length} cita{filteredItems.length === 1 ? "" : "s"}
        </span>
        <span className="admin-appts-chip">
          {filteredItems.filter((a) => a.state === "PENDING").length} pendientes
        </span>
        <span className="admin-appts-chip">
          {filteredItems.filter((a) => a.state === "CONFIRMED").length} confirmadas
        </span>
      </div>

      {filteredItems.length === 0 ? (
        <div className="admin-appts-empty">
          No hay citas que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div className="admin-appts-list">
          {filteredItems.map((a) => {
            const clientText =
              a.clientFullName ??
              (`${a.clientName ?? ""} ${a.clientSurname ?? ""}`.trim() || `#${a.clientId}`);

            return (
              <article key={a.id} className="admin-appts-card">
                <div className="admin-appts-card__top">
                  <div className="admin-appts-card__left">
                    <p className="admin-appts-id">Cita #{a.id}</p>
                    <h3 className="admin-appts-date">
                      {formatDateTime(String(a.startDateTime))}
                    </h3>

                    <p className="admin-appts-meta">
                      <strong>Tipo:</strong> {formatType(a.appointmentType)}
                      <br />
                      <strong>Profesional:</strong> {a.professionalName}
                      <br />
                      <strong>Cliente:</strong> {clientText}
                      <br />
                      <strong>Duración:</strong> {a.durationMinutes} min
                    </p>
                  </div>

                  <div className="admin-appts-side">
                    <div className="admin-appts-badges">
                      <span className={getStateBadgeClass(a.state)}>
                        {formatState(a.state)}
                      </span>

                      {a.appointmentType === "TATTOO" && (
                        <span
                          className={`admin-appts-badge ${a.depositPaid
                            ? "admin-appts-badge--deposit-paid"
                            : "admin-appts-badge--deposit-unpaid"
                            }`}
                        >
                          {a.depositPaid ? "Señal pagada" : "Señal pendiente"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-appts-row-actions">
                  {a.appointmentType === "TATTOO" &&
                    !a.depositPaid &&
                    a.state === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => onPayDeposit(a.id)}
                        className="admin-appts-btn admin-appts-btn--ghost"
                      >
                        Confirmar señal
                      </button>
                    )}

                  {(a.state === "PENDING" || a.state === "CONFIRMED") && (
                    <>
                      <button
                        type="button"
                        onClick={() => nav(`/admin/appointments/${a.id}`)}
                        className="admin-appts-btn admin-appts-btn--ghost"
                      >
                        Ver detalle
                      </button>

                      <button
                        type="button"
                        onClick={() => onCancel(a.id)}
                        className="admin-appts-btn admin-appts-btn--ghost"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={() => openReschedule(a)}
                        className="admin-appts-btn admin-appts-btn--primary"
                      >
                        Reprogramar
                      </button>
                    </>
                  )}

                  {a.state === "CONFIRMED" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onMarkCompleted(a.id)}
                        className="admin-appts-btn admin-appts-btn--ghost"
                      >
                        Marcar completada
                      </button>

                      <button
                        type="button"
                        onClick={() => onMarkNoShow(a.id)}
                        className="admin-appts-btn admin-appts-btn--ghost"
                      >
                        El cliente no ha aparecido
                      </button>
                    </>
                  )}

                  {a.state === "COMPLETED" && !a.showroomTattooCreated && (
                    <button
                      type="button"
                      onClick={() => nav(`/admin/appointments/${a.id}/tattoo/new`)}
                      className="admin-appts-btn admin-appts-btn--primary"
                    >
                      Añadir tattoo a Showroom
                    </button>
                  )}
                </div>

                {rescheduleId === a.id && (
                  <div className="admin-appts-reschedule">
                    <h4 className="admin-appts-reschedule__title">
                      Reprogramar cita
                    </h4>

                    <label className="admin-appts-field" style={{ maxWidth: 260 }}>
                      <span className="admin-appts-label">Día</span>
                      <input
                        className="input"
                        type="date"
                        min={todayLocalDate()} // Evita seleccionar días pasados
                        value={rescheduleDay}
                        onChange={(e) => setRescheduleDay(e.target.value)}
                        disabled={rescheduleLoading || rescheduleSaving}
                      />
                    </label>

                    <div>
                      {rescheduleLoading ? (
                        <p className="admin-appts-muted">Cargando slots…</p>
                      ) : rescheduleSlots.length === 0 ? (
                        <p className="admin-appts-muted">
                          {rescheduleDay
                            ? "No hay slots disponibles ese día."
                            : "Selecciona un día para ver slots."}
                        </p>
                      ) : (
                        <div className="admin-appts-slots">
                          {rescheduleSlots.map((s, idx) => {
                            const start = String((s as any).startDateTime);

                            return (
                              <label key={idx} className="admin-appts-slot">
                                <input
                                  type="radio"
                                  name={`slot-${a.id}`}
                                  value={start}
                                  checked={rescheduleStart === start}
                                  onChange={() => setRescheduleStart(start)}
                                  disabled={rescheduleSaving}
                                />
                                <span>{formatSlotLabel(start)}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div
                      className="admin-appts-row-actions"
                      style={{ marginTop: "1rem" }}
                    >
                      <button
                        type="button"
                        onClick={onSaveReschedule}
                        disabled={!rescheduleStart || rescheduleLoading || rescheduleSaving}
                        className="admin-appts-btn admin-appts-btn--primary"
                      >
                        {rescheduleSaving ? "Guardando..." : "Guardar cambio"}
                      </button>

                      <button
                        type="button"
                        onClick={closeReschedule}
                        disabled={rescheduleLoading || rescheduleSaving}
                        className="admin-appts-btn admin-appts-btn--ghost"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}