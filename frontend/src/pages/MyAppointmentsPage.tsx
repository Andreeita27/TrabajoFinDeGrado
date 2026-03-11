import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import {
  cancelAppointment,
  confirmDeposit,
  getMyAppointments,
  rescheduleAppointment,
} from "../api/appointmentsApi";
import { getAvailability } from "../api/availabilityApi";
import { useAuth } from "../auth/AuthContext";
import type { AppointmentDto } from "../types/appointment";
import type { AvailabilitySlotDto } from "../types/availability";
import "../styles/account.css";

type Props = {
  embedded?: boolean;
};

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

function formatState(state?: string) {
  switch (state) {
    case "PENDING":
      return "Pendiente";
    case "CONFIRMED":
      return "Confirmada";
    case "CANCELLED":
      return "Cancelada";
    case "COMPLETED":
      return "Completada";
    case "NO_SHOW":
      return "No asistió";
    default:
      return state ?? "-";
  }
}

function getStateBadgeClass(state?: string) {
  switch (state) {
    case "PENDING":
      return "account-badge account-badge--pending";
    case "CONFIRMED":
      return "account-badge account-badge--confirmed";
    case "CANCELLED":
      return "account-badge account-badge--cancelled";
    case "COMPLETED":
      return "account-badge account-badge--completed";
    case "NO_SHOW":
      return "account-badge account-badge--no-show";
    default:
      return "account-badge";
  }
}

export default function MyAppointmentsPage({ embedded = false }: Props) {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [error, setError] = useState("");

  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDay, setRescheduleDay] = useState<string>("");
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailabilitySlotDto[]>([]);
  const [rescheduleStart, setRescheduleStart] = useState<string>("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  const load = async () => {
    if (!token) return;
    setError("");
    try {
      const data = await getMyAppointments(token);
      setItems(data);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        nav("/login", { replace: true, state: { from: "/my-account" } });
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
      setError("");
      await confirmDeposit(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error confirmando señal");
    }
  };

  const onCancel = async (id: number) => {
    if (!token) return;
    try {
      setError("");
      await cancelAppointment(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cancelando cita");
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

  const content = (
    <>
      {!embedded ? (
        <div className="account-standalone__hero">
          <p className="account-page-kicker">Zona privada</p>
          <h1 className="account-section-title">Mis citas</h1>
          <p className="account-section-text">
            Consulta el estado de tus reservas, revisa el detalle y gestiona
            cambios cuando sea posible.
          </p>
        </div>
      ) : (
        <>
          <h2 className="account-section-title">Gestionar mis citas</h2>
          <p className="account-section-text">
            Consulta el estado de tus reservas, revisa el detalle y gestiona
            cambios cuando sea posible.
          </p>
        </>
      )}

      {error && (
        <div className="account-feedback account-feedback--error">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="account-empty">No tienes citas todavía.</div>
      ) : (
        <div className="account-appointments">
          {items.map((a) => {
            const now = new Date();
            const start = new Date(String(a.startDateTime));
            const diffMs = start.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            const canModify = diffHours >= 24;
            const isPendingOrConfirmed =
              a.state === "PENDING" || a.state === "CONFIRMED";

            return (
              <article key={a.id} className="account-appointment-card">
                <div className="account-appointment-card__top">
                  <div>
                    <h3 className="account-appointment-card__date">
                      {formatSlotLabel(String(a.startDateTime))}
                    </h3>
                    <p className="account-appointment-card__meta">
                      <strong>Profesional:</strong> {a.professionalName}
                      <br />
                      <strong>Duración:</strong> {a.durationMinutes} min
                      <br />
                      <strong>Estado:</strong> {formatState(a.state)}
                    </p>
                  </div>

                  <div className={getStateBadgeClass(a.state)}>
                    {formatState(a.state)}
                  </div>
                </div>

                <div className="account-actions">
                  {role === "ADMIN" && !a.depositPaid && a.state === "PENDING" && (
                    <button
                      type="button"
                      onClick={() => onPayDeposit(a.id)}
                      className="account-btn account-btn--ghost"
                    >
                      Confirmar señal
                    </button>
                  )}

                  {isPendingOrConfirmed && canModify && (
                    <>
                      <button
                        type="button"
                        onClick={() => nav(`/my-appointments/${a.id}`)}
                        className="account-btn account-btn--ghost"
                      >
                        Ver detalle
                      </button>

                      <button
                        type="button"
                        onClick={() => onCancel(a.id)}
                        className="account-btn account-btn--ghost"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={() => openReschedule(a)}
                        className="account-btn account-btn--primary"
                      >
                        Reprogramar
                      </button>
                    </>
                  )}

                  {isPendingOrConfirmed && !canModify && (
                    <button
                      type="button"
                      onClick={() => nav(`/my-appointments/${a.id}`)}
                      className="account-btn account-btn--ghost"
                    >
                      Ver detalle
                    </button>
                  )}

                  {!isPendingOrConfirmed && (
                    <button
                      type="button"
                      onClick={() => nav(`/my-appointments/${a.id}`)}
                      className="account-btn account-btn--ghost"
                    >
                      Ver detalle
                    </button>
                  )}
                </div>

                {rescheduleId === a.id && (
                  <div className="account-reschedule">
                    <h4 className="account-subtitle" style={{ marginBottom: "0.75rem" }}>
                      Reprogramar cita
                    </h4>

                    <label className="account-field" style={{ maxWidth: "260px" }}>
                      <span className="account-field__label">Día</span>
                      <input
                        className="input"
                        type="date"
                        value={rescheduleDay}
                        onChange={(e) => setRescheduleDay(e.target.value)}
                        disabled={rescheduleLoading || rescheduleSaving}
                      />
                    </label>

                    <div>
                      {rescheduleLoading ? (
                        <p className="account-muted">Cargando slots…</p>
                      ) : rescheduleSlots.length === 0 ? (
                        <p className="account-muted">
                          {rescheduleDay
                            ? "No hay slots disponibles ese día."
                            : "Selecciona un día para ver slots."}
                        </p>
                      ) : (
                        <div className="account-slots">
                          {rescheduleSlots.map((s, idx) => {
                            const startValue = String((s as any).startDateTime);

                            return (
                              <label key={idx} className="account-slot">
                                <input
                                  type="radio"
                                  name={`slot-${a.id}`}
                                  value={startValue}
                                  checked={rescheduleStart === startValue}
                                  onChange={() => setRescheduleStart(startValue)}
                                  disabled={rescheduleSaving}
                                />
                                <span>{formatSlotLabel(startValue)}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="account-inline-actions" style={{ marginTop: "1rem" }}>
                      <button
                        type="button"
                        onClick={onSaveReschedule}
                        disabled={!rescheduleStart || rescheduleLoading || rescheduleSaving}
                        className="account-btn account-btn--primary"
                      >
                        {rescheduleSaving ? "Guardando..." : "Guardar cambio"}
                      </button>

                      <button
                        type="button"
                        onClick={closeReschedule}
                        disabled={rescheduleLoading || rescheduleSaving}
                        className="account-btn account-btn--ghost"
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
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <main className="account-standalone-page">
      <section className="account-standalone-shell">
        {content}
      </section>
    </main>
  );
}