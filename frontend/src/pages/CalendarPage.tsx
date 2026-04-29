import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import {
  getAvailability,
  getAvailabilityMonthSummary,
  type AvailabilityResponseDto,
  type MonthlyAvailabilityDayDto,
} from "../api/availabilityApi";
import { getProfessionals } from "../api/showroomApi";
import { createAppointment } from "../api/appointmentsApi";
import { useAuth } from "../auth/AuthContext";
import type { AvailabilitySlotDto } from "../types/availability";
import type { ProfessionalDto } from "../types/professional";
import type { AppointmentType, TattooSize } from "../types/appointment";
import type { ClientDto } from "../types/client";

import ClientAutocomplete from "../components/ClientAutocomplete";
import "../styles/calendar.css";

const OPEN_HOUR = "12:00:00";
const CLOSE_HOUR = "20:00:00";

const DURATION_BY_SIZE: Record<TattooSize, number> = {
  SMALL: 60,
  MEDIUM: 120,
  LARGE: 240,
  XL: 480,
};

const stepMinutes = 30;
const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type CalendarCell = {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
};

function withSeconds(isoOrLocal: string) {
  return isoOrLocal.length === 16 ? `${isoOrLocal}:00` : isoOrLocal;
}

function formatSlotLabel(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDayLabel(day: string) {
  if (!day) return "—";
  try {
    return new Date(`${day}T12:00:00`).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return day;
  }
}

function formatMonthLabel(date: Date) {
  const month = date.toLocaleDateString("es-ES", { month: "long" });
  const year = date.getFullYear();

  const monthCap =
    month.charAt(0).toUpperCase() + month.slice(1);

  return `${monthCap} ${year}`;
}

function formatAppointmentType(type: AppointmentType) {
  return type === "CONSULTATION" ? "Consulta" : "Sesión de tatuaje";
}

function formatTattooSize(size: TattooSize) {
  switch (size) {
    case "SMALL":
      return "Pequeño";
    case "MEDIUM":
      return "Mediano";
    case "LARGE":
      return "Grande";
    case "XL":
      return "Extra grande";
    default:
      return size;
  }
}

function buildAvailabilityInfo(r: AvailabilityResponseDto) {
  if (r.slots.length > 0) return "";

  if (r.hasBlocksInRange) {
    const reasons = (r.blockReasons || []).filter(Boolean);
    return reasons.length
      ? `No disponible en esa fecha: ${reasons.join(", ")}.`
      : "No disponible en esa fecha (bloqueado).";
  }

  if (!r.hasPublishedWindows) {
    return "Este profesional todavía no ha abierto agenda para ese día.";
  }

  return "No hay huecos disponibles para ese día.";
}

function toMonthIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function toDateIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function buildCalendarCells(monthDate: Date): CalendarCell[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

  const jsDay = firstOfMonth.getDay();
  const mondayBasedOffset = jsDay === 0 ? 6 : jsDay - 1;

  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - mondayBasedOffset);

  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    cells.push({
      date: d,
      iso: toDateIso(d),
      inCurrentMonth: d.getMonth() === monthDate.getMonth(),
    });
  }

  return cells;
}

function getSummaryMap(days: MonthlyAvailabilityDayDto[]) {
  return Object.fromEntries(days.map((d) => [d.date, d])) as Record<string, MonthlyAvailabilityDayDto>;
}

function getDayClass(cell: CalendarCell, summary?: MonthlyAvailabilityDayDto, selectedDay?: string) {
  let cls = "calendar-day";

  if (!cell.inCurrentMonth) cls += " calendar-day--outside";
  if (summary?.past) cls += " calendar-day--disabled";
  if (summary?.status === "AVAILABLE") cls += " calendar-day--available";
  if (summary?.status === "BLOCKED") cls += " calendar-day--blocked";
  if (summary?.status === "NO_WINDOWS") cls += " calendar-day--no-windows";
  if (summary?.status === "FULL") cls += " calendar-day--full";
  if (summary?.status === "WEEKEND") cls += " calendar-day--weekend";
  if (selectedDay === cell.iso) cls += " calendar-day--selected";

  return cls;
}

export default function CalendarPage() {
  const { token, role, clientId } = useAuth();
  const nav = useNavigate();

  const [selectedClient, setSelectedClient] = useState<ClientDto | null>(null);

  const [appointmentType, setAppointmentType] = useState<AppointmentType>("TATTOO");
  const [professionals, setProfessionals] = useState<ProfessionalDto[]>([]);
  const [professionalId, setProfessionalId] = useState<number>(0);

  const [monthDate, setMonthDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [day, setDay] = useState<string>("");

  const [tattooSize, setTattooSize] = useState<TattooSize>("SMALL");
  const durationMinutes = useMemo(() => {
    if (appointmentType === "CONSULTATION") return 30;
    return DURATION_BY_SIZE[tattooSize];
  }, [appointmentType, tattooSize]);

  const [monthSummary, setMonthSummary] = useState<MonthlyAvailabilityDayDto[]>([]);
  const summaryMap = useMemo(() => getSummaryMap(monthSummary), [monthSummary]);
  const calendarCells = useMemo(() => buildCalendarCells(monthDate), [monthDate]);

  const [slots, setSlots] = useState<AvailabilitySlotDto[]>([]);
  const [selectedStart, setSelectedStart] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [availabilityInfo, setAvailabilityInfo] = useState<string>("");

  const [bodyPlacement, setBodyPlacement] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [firstTime, setFirstTime] = useState(false);

  useEffect(() => {
    getProfessionals()
      .then((p) => {
        setProfessionals(p);
        if (p.length > 0) setProfessionalId(p[0].id);
      })
      .catch((e: unknown) => {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Error cargando profesionales");
        }
      });
  }, []);

  useEffect(() => {
    if (!token || !professionalId) return;

    setError("");

    getAvailabilityMonthSummary(token, {
      professionalId,
      month: toMonthIso(monthDate),
      durationMinutes,
      stepMinutes,
    })
      .then((res) => {
        setMonthSummary(res.days);
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) {
          nav("/login", { replace: true, state: { from: "/calendar" } });
          return;
        }

        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Error cargando calendario");
        }
      });
    }, [token, professionalId, monthDate, durationMinutes, nav]);

  useEffect(() => {
    if (!token) return;
    if (!professionalId) return;
    if (!day) return;

    setError("");
    setAvailabilityInfo("");
    setSlots([]);
    setSelectedStart("");

    const fromIso = `${day}T${OPEN_HOUR}`;
    const toIso = `${day}T${CLOSE_HOUR}`;

    getAvailability(token, {
      professionalId,
      dateFrom: fromIso,
      dateTo: toIso,
      durationMinutes,
      stepMinutes,
    })
      .then((res) => {
        setSlots(res.slots);
        setAvailabilityInfo(buildAvailabilityInfo(res));
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) {
          nav("/login", { replace: true, state: { from: "/calendar" } });
          return;
        }

        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Error cargando disponibilidad");
        }
      });
    }, [token, professionalId, day, durationMinutes, nav]);

  const onCreateAppointment = async () => {
    if (!token) return;
    setError("");

    try {
      if (!selectedStart) throw new Error("Selecciona un horario primero");

      if (appointmentType === "TATTOO" && !bodyPlacement.trim()) {
        throw new Error("Indica en qué parte del cuerpo quieres el tattoo.");
      }

      if (!ideaDescription.trim()) {
        throw new Error("Describe tu idea.");
      }

      let finalClientId: number | null = null;

      if (role === "CLIENT") {
        if (!clientId) {
          throw new Error("No se ha podido identificar tu usuario. Cierra sesión e inicia de nuevo.");
        }
        finalClientId = clientId;
      } else if (role === "ADMIN") {
        if (!selectedClient) {
          throw new Error("Selecciona un cliente antes de crear la cita.");
        }
        finalClientId = selectedClient.id;
      } else {
        throw new Error("Rol no soportado para crear cita.");
      }

      const created = await createAppointment(token, {
        clientId: finalClientId!,
        professionalId,
        appointmentType,
        startDateTime: withSeconds(selectedStart),
        bodyPlacement: appointmentType === "CONSULTATION" ? "" : bodyPlacement,
        ideaDescription,
        firstTime,
        tattooSize: appointmentType === "CONSULTATION" ? null : tattooSize,
        referenceImageUrl: null,
      });

      if (role === "ADMIN") {
        nav("/admin/appointments", { replace: true });
        return;
      }

      nav(`/my-appointments/${created.id}`, { replace: true });
      } catch (e: unknown) {
        if (e instanceof ApiError && e.status === 401) {
          nav("/login", { replace: true, state: { from: "/calendar" } });
          return;
        }

        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("Error creando cita");
        }
      }
  };

  const disableCreate = !selectedStart || (role === "ADMIN" && !selectedClient);
  const selectedProfessional = professionals.find((p) => p.id === professionalId);

  return (
    <div className="calendar-page">
      <header className="calendar-hero">
        <p className="calendar-kicker">Reservas</p>
        <h1 className="calendar-title">Reservar cita</h1>
        <p className="calendar-text">
          Elige profesional, revisa la agenda visual del mes y selecciona un hueco real
          de forma mucho más cómoda.
        </p>
      </header>

      {error && (
        <div className="calendar-feedback calendar-feedback--error">
          {error}
        </div>
      )}

      <div className="calendar-layout">
        <section className="calendar-panel">
          <h2 className="calendar-panel__title">Configuración</h2>
          <p className="calendar-panel__text">
            Define la cita para ver la agenda disponible.
          </p>

          {role === "ADMIN" && (
            <div className="calendar-admin-client">
              {token ? (
                <ClientAutocomplete
                  token={token}
                  value={selectedClient}
                  onChange={(c) => setSelectedClient(c as any)}
                />
              ) : (
                <div className="calendar-empty">
                  Inicia sesión como admin para seleccionar cliente.
                </div>
              )}
              <hr className="calendar-divider" />
            </div>
          )}

          <div className="calendar-form">
            <label className="calendar-field">
              <span className="calendar-label">Tipo de cita</span>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as "TATTOO" | "CONSULTATION")}
              >
                <option value="TATTOO">Sesión de tatuaje</option>
                <option value="CONSULTATION">Consulta</option>
              </select>
            </label>

            <label className="calendar-field">
              <span className="calendar-label">Profesional</span>
              <select
                value={professionalId}
                onChange={(e) => {
                  setProfessionalId(Number(e.target.value));
                  setDay("");
                  setSelectedStart("");
                  setSlots([]);
                  setAvailabilityInfo("");
                }}
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.professionalName}
                  </option>
                ))}
              </select>
            </label>

            {appointmentType === "TATTOO" && (
              <label className="calendar-field">
                <span className="calendar-label">Tamaño</span>
                <select
                  value={tattooSize}
                  onChange={(e) => {
                    setTattooSize(e.target.value as TattooSize);
                    setSelectedStart("");
                  }}
                >
                  <option value="SMALL">Pequeño (1-10 cm)</option>
                  <option value="MEDIUM">Mediano (10-25 cm)</option>
                  <option value="LARGE">Grande (25-50 cm)</option>
                  <option value="XL">XL (+50 cm)</option>
                </select>
              </label>
            )}

            <div className="calendar-chip-row">
              <span className="calendar-chip">
                Duración estimada: {durationMinutes} min
              </span>
              {selectedProfessional && (
                <span className="calendar-chip">
                  Profesional: {selectedProfessional.professionalName}
                </span>
              )}
            </div>
                        {appointmentType === "TATTOO" && (
              <label className="calendar-field">
                <span className="calendar-label">Zona del cuerpo</span>
                <input
                  className="input"
                  placeholder="Ej: antebrazo, costillas, muslo..."
                  value={bodyPlacement}
                  onChange={(e) => setBodyPlacement(e.target.value)}
                />
              </label>
            )}

            <label className="calendar-field">
              <span className="calendar-label">Idea / descripción</span>
              <textarea
                placeholder="Cuéntanos tu idea, estilo, referencias, tamaño aproximado o cualquier detalle importante."
                value={ideaDescription}
                onChange={(e) => setIdeaDescription(e.target.value)}
                rows={5}
              />
            </label>
          </div>
        </section>

        <section className="calendar-panel">
          <div className="calendar-month-nav">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => setMonthDate((m) => addMonths(m, -1))}
            >
              ←
            </button>

            <h2 className="calendar-month-title">{formatMonthLabel(monthDate)}</h2>

            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => setMonthDate((m) => addMonths(m, 1))}
            >
              →
            </button>
          </div>

          <div className="calendar-weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}
          </div>

          <div className="calendar-month-grid">
            {calendarCells.map((cell) => {
              const summary = summaryMap[cell.iso];
              const clickable =
                cell.inCurrentMonth &&
                !summary?.past &&
                summary?.status === "AVAILABLE";

              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={getDayClass(cell, summary, day)}
                  disabled={!clickable}
                  data-tooltip={cell.inCurrentMonth ? (summary?.reason || "") : ""}
                  title={cell.inCurrentMonth ? (summary?.reason || "") : ""}
                  onClick={() => {
                    setDay(cell.iso);
                    setSelectedStart("");
                  }}
                >
                  <span className="calendar-day__num">{cell.date.getDate()}</span>
                  {cell.inCurrentMonth && summary?.status && summary.status !== "WEEKEND" ? (
                    <span className="calendar-day__dot" />
                  ) : (
                    <span />
                  )}
                </button>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span className="calendar-legend-item">
              <span className="calendar-legend-dot calendar-legend-dot--available" />
              Disponible
            </span>
            <span className="calendar-legend-item">
              <span className="calendar-legend-dot calendar-legend-dot--blocked" />
              Bloqueado
            </span>
            <span className="calendar-legend-item">
              <span className="calendar-legend-dot calendar-legend-dot--no-windows" />
              Sin agenda
            </span>
            <span className="calendar-legend-item">
              <span className="calendar-legend-dot calendar-legend-dot--full" />
              Completo
            </span>
          </div>
        </section>

        <section className="calendar-panel calendar-panel--summary">
          <div className="calendar-slots-header">
            <div>
              <h2 className="calendar-panel__title">Horarios</h2>
              <p className="calendar-panel__text">
                {day
                  ? `Huecos para ${formatDayLabel(day)}`
                  : "Selecciona un día del calendario para ver horarios"}
              </p>
            </div>
          </div>

          {availabilityInfo && (
            <div className="calendar-feedback calendar-feedback--info">
              {availabilityInfo}
            </div>
          )}

          {slots.length === 0 ? (
            <div className="calendar-empty">
              {day
                ? "No hay horarios disponibles para este día."
                : "Todavía no has seleccionado ningún día."}
            </div>
          ) : (
            <div className="calendar-slots">
              {slots.map((s, idx) => (
                <label key={idx} className="calendar-slot">
                  <input
                    type="radio"
                    name="slot"
                    value={s.startDateTime}
                    checked={selectedStart === s.startDateTime}
                    onChange={() => setSelectedStart(s.startDateTime)}
                  />
                  <span className="calendar-slot__box">
                    {formatSlotLabel(s.startDateTime)}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div style={{ height: 16 }} />

          <h2 className="calendar-panel__title">Detalles de la cita</h2>
          <p className="calendar-panel__text">
            Resumen de la cita.
          </p>

          <div className="calendar-summary">
            <div className="calendar-summary-row">
              <span className="calendar-summary-key">Tipo</span>
              <span className="calendar-summary-val">
                {formatAppointmentType(appointmentType)}
              </span>
            </div>

            <div className="calendar-summary-row">
              <span className="calendar-summary-key">Día seleccionado</span>
              <span className="calendar-summary-val">
                {day ? formatDayLabel(day) : "Sin seleccionar"}
              </span>
            </div>

            <div className="calendar-summary-row">
              <span className="calendar-summary-key">Horario</span>
              <span className="calendar-summary-val">
                {selectedStart ? formatSlotLabel(selectedStart) : "Sin seleccionar"}
              </span>
            </div>

            {appointmentType === "TATTOO" && (
              <div className="calendar-summary-row">
                <span className="calendar-summary-key">Tamaño</span>
                <span className="calendar-summary-val">
                  {formatTattooSize(tattooSize)}
                </span>
              </div>
            )}
          </div>

          <div className="calendar-form">
            <div className="calendar-note">
              Podrás subir <strong>1 imagen de referencia</strong> una vez reservada
              la cita, desde el detalle de tu reserva.
            </div>

            <label className="calendar-checkbox">
              <input
                type="checkbox"
                checked={firstTime}
                onChange={(e) => setFirstTime(e.target.checked)}
              />
              <span>¿Es tu primera vez en el estudio?</span>
            </label>

            <div className="calendar-actions">
              <button
                onClick={onCreateAppointment}
                disabled={disableCreate}
                className="calendar-btn calendar-btn--primary"
              >
                Crear cita
              </button>

              <button
                type="button"
                onClick={() => nav(role === "ADMIN" ? "/admin" : "/")}
                className="calendar-btn calendar-btn--ghost"
              >
                Cancelar
              </button>
            </div>

            {role === "ADMIN" && !selectedClient && (
              <div className="calendar-help">
                Selecciona un cliente para poder crear la cita desde administración.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}