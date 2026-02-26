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

export default function MyAppointmentsPage({ embedded = false }: Props) {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState<AppointmentDto[]>([]);
  const [error, setError] = useState("");

  const [reviewSubmitting, setReviewSubmitting] = useState<Record<number, boolean>>({});

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

  const onGoReview = (appointmentId: number) => {
    setReviewSubmitting((m) => ({ ...m, [appointmentId]: true }));
    nav(`/reviews/new?appointmentId=${appointmentId}`);
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

  // Cargar slots cuando el usuario elige día para reprogramar
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

  return (
    <div style={{ padding: embedded ? 0 : 16 }}>
      {!embedded && <h1>Mis citas</h1>}
      {embedded && <h2 style={{ marginTop: 0 }}>Gestionar mis citas</h2>}

      {error && <div style={{ color: "tomato", marginBottom: 10 }}>{error}</div>}

      {items.length === 0 ? (
        <div>No tienes citas todavía.</div>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {items.map((a) => (
            <li key={a.id} style={{ marginBottom: 14 }}>
              <div>
                <b>{formatSlotLabel(String(a.startDateTime))}</b> — {a.professionalName} — {a.state} —{" "}
                {a.durationMinutes} min
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {role === "CLIENT" && a.state === "COMPLETED" && !a.hasReview && (
                  <button onClick={() => onGoReview(a.id)} disabled={!!reviewSubmitting[a.id]}>
                    {reviewSubmitting[a.id] ? "Abriendo..." : "Dejar reseña"}
                  </button>
                )}

                {role === "CLIENT" && a.state === "COMPLETED" && a.hasReview && <button disabled>Reseña ya enviada</button>}

                {role === "ADMIN" && !a.depositPaid && a.state === "PENDING" && (
                  <button onClick={() => onPayDeposit(a.id)}>Confirmar señal</button>
                )}

                {(a.state === "PENDING" || a.state === "CONFIRMED") && (() => {
                  const now = new Date();
                  const start = new Date(String(a.startDateTime));
                  const diffMs = start.getTime() - now.getTime();
                  const diffHours = diffMs / (1000 * 60 * 60);

                  const canModify = diffHours >= 24;

                  return (
                    <>
                      {canModify && (
                        <>
                          <button onClick={() => nav(`/my-appointments/${a.id}`)}>Ver detalle</button>
                          <button onClick={() => onCancel(a.id)}>Cancelar</button>
                          <button onClick={() => openReschedule(a)}>Reprogramar</button>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              {rescheduleId === a.id && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    border: "1px solid #333",
                    borderRadius: 8,
                    maxWidth: 720,
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

                  <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}