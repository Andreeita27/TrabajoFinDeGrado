import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/bookingPreviewCard.css";

type DayState = "MUTED" | "AVAILABLE" | "BLOCKED";

type PreviewCell = {
  date: Date;
  iso: string;
  inCurrentMonth: boolean;
  state: DayState;
};

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];

function toIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthLabel(date: Date) {
  const month = date.toLocaleDateString("es-ES", { month: "long" });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
}

function buildPreviewCells(monthDate: Date): PreviewCell[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const jsDay = firstOfMonth.getDay();
  const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;

  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - mondayOffset);

  const cells: PreviewCell[] = [];

  for (let i = 0; i < 21; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const inCurrentMonth = d.getMonth() === monthDate.getMonth();

    let state: DayState = "MUTED";

    if (inCurrentMonth && !isWeekend) {
      state = d.getDate() % 7 === 0 ? "BLOCKED" : "AVAILABLE";
    }

    cells.push({
      date: d,
      iso: toIso(d),
      inCurrentMonth,
      state,
    });
  }

  return cells;
}

function getCellClass(state: DayState, selected: boolean) {
  let cls = "booking-preview__day";

  if (state === "MUTED") cls += " booking-preview__day--muted";
  if (state === "AVAILABLE") cls += " booking-preview__day--available";
  if (state === "BLOCKED") cls += " booking-preview__day--blocked";
  if (selected) cls += " booking-preview__day--selected";

  return cls;
}

export default function BookingPreviewCard() {
  const nav = useNavigate();
  const monthDate = useMemo(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    []
  );
  const cells = useMemo(() => buildPreviewCells(monthDate), [monthDate]);

  const firstAvailable = useMemo(
    () => cells.find((c) => c.inCurrentMonth && c.state === "AVAILABLE") ?? null,
    [cells]
  );

  const [selectedIso, setSelectedIso] = useState(firstAvailable?.iso ?? "");

  const selectedCell = useMemo(
    () => cells.find((c) => c.iso === selectedIso) ?? firstAvailable,
    [cells, selectedIso, firstAvailable]
  );

  return (
    <div className="booking-preview hpCarousel">
      <div className="booking-preview__top">
        <p className="booking-preview__kicker">Reserva online</p>
        <h3 className="booking-preview__title">Vista previa</h3>
      </div>

      <div className="booking-preview__calendar">
        <div className="booking-preview__month">
          <span className="booking-preview__month-label">
            {formatMonthLabel(monthDate)}
          </span>
        </div>

        <div className="booking-preview__weekdays">
          {WEEK_DAYS.map((day) => (
            <span key={day} className="booking-preview__weekday">
              {day}
            </span>
          ))}
        </div>

        <div className="booking-preview__days">
          {cells.map((cell) => {
            const selectable = cell.inCurrentMonth && cell.state === "AVAILABLE";
            const selected = selectedCell?.iso === cell.iso;

            return (
              <button
                key={cell.iso}
                type="button"
                className={getCellClass(cell.state, !!selected)}
                disabled={!selectable}
                onClick={() => {
                  if (selectable) setSelectedIso(cell.iso);
                }}
              >
                <span className="booking-preview__day-number">
                  {cell.date.getDate()}
                </span>
                {cell.inCurrentMonth && cell.state !== "MUTED" ? (
                  <span className="booking-preview__day-dot" />
                ) : (
                  <span />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="booking-preview__bottom">
        <div className="booking-preview__info">
          <span className="booking-preview__info-label">Reserva online</span>
          <p className="booking-preview__info-text">
            Consulta disponibilidad real, elige tu día y completa la reserva en el calendario.
          </p>
        </div>

        <div className="booking-preview__cta-wrap">
            <button
                type="button"
                className="btn btn--primary booking-preview__cta-btn"
                onClick={() => nav("/calendar")}
            >
                Consulta disponibilidad
            </button>
        </div>
      </div>
    </div>
  );
}