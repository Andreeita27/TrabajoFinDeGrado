import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getAvailability } from "../api/availabilityApi";
import { getProfessionals } from "../api/showroomApi";
import { createAppointment } from "../api/appointmentsApi";
import { useAuth } from "../auth/AuthContext";
import type { AvailabilitySlotDto } from "../types/availability";
import type { ProfessionalDto } from "../types/professional";
import type { TattooSize } from "../types/appointment";

export default function CalendarPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [professionals, setProfessionals] = useState<ProfessionalDto[]>([]);
  const [professionalId, setProfessionalId] = useState<number>(0);

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [stepMinutes, setStepMinutes] = useState<number>(30);

  const [slots, setSlots] = useState<AvailabilitySlotDto[]>([]);
  const [error, setError] = useState<string>("");

  const [bodyPlacement, setBodyPlacement] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [firstTime, setFirstTime] = useState(false);
  const [tattooSize, setTattooSize] = useState<TattooSize>("SMALL");
  const [selectedStart, setSelectedStart] = useState<string>("");

  useEffect(() => {
    getProfessionals()
      .then((p) => {
        setProfessionals(p);
        if (p.length > 0) setProfessionalId(p[0].id);
      })
      .catch((e: any) => setError(e?.message || "Error cargando profesionales"));
  }, []);

  const fetchAvailability = async () => {
    if (!token) return;

    setError("");
    setSlots([]);

    try {
      if (!professionalId) throw new Error("Selecciona un profesional");
      if (!dateFrom || !dateTo) throw new Error("Selecciona dateFrom y dateTo");

      const fromIso = dateFrom.length === 16 ? `${dateFrom}:00` : dateFrom;
      const toIso = dateTo.length === 16 ? `${dateTo}:00` : dateTo;

      const data = await getAvailability(token, {
        professionalId,
        dateFrom: fromIso,
        dateTo: toIso,
        durationMinutes,
        stepMinutes,
      });

      setSlots(data);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        nav("/login", { replace: true, state: { from: "/calendar" } });
        return;
      }
      setError(e?.message || "Error cargando availability");
    }
  };

  const onCreateAppointment = async () => {
    if (!token) return;

    setError("");

    try {
      if (!selectedStart) throw new Error("Selecciona un slot primero");
      if (!bodyPlacement.trim()) throw new Error("bodyPlacement obligatorio");
      if (!ideaDescription.trim()) throw new Error("ideaDescription obligatorio");

      const clientId = role === "ADMIN" ? 0 : 0;

      await createAppointment(token, {
        clientId,
        professionalId,
        startDateTime: selectedStart,
        bodyPlacement,
        ideaDescription,
        firstTime,
        tattooSize,
        referenceImageUrl: null,
      });

      nav("/my-appointments", { replace: true });
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        nav("/login", { replace: true, state: { from: "/calendar" } });
        return;
      }
      setError(e?.message || "Error creando cita");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Reservar cita</h1>

      {error && <div style={{ color: "tomato", marginBottom: 8 }}>{error}</div>}

      <section style={{ display: "grid", gap: 10, maxWidth: 720 }}>
        <label>
          Profesional:
          <select value={professionalId} onChange={(e) => setProfessionalId(Number(e.target.value))}>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.professionalName}
              </option>
            ))}
          </select>
        </label>

        <label>
          dateFrom:
          <input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>

        <label>
          dateTo:
          <input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>

        <label>
          durationMinutes:
          <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} />
        </label>

        <label>
          stepMinutes:
          <input type="number" value={stepMinutes} onChange={(e) => setStepMinutes(Number(e.target.value))} />
        </label>

        <button onClick={fetchAvailability}>Ver disponibilidad</button>
      </section>

      <hr style={{ margin: "16px 0" }} />

      <h2>Slots disponibles</h2>
      {slots.length === 0 ? (
        <div>No hay slots cargados todavía.</div>
      ) : (
        <ul>
          {slots.map((s, idx) => (
            <li key={idx}>
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="radio"
                  name="slot"
                  value={s.startDateTime}
                  checked={selectedStart === s.startDateTime}
                  onChange={() => setSelectedStart(s.startDateTime)}
                />
                {s.startDateTime} → {s.endDateTime}
              </label>
            </li>
          ))}
        </ul>
      )}

      <hr style={{ margin: "16px 0" }} />

      <h2>Datos de la cita</h2>
      <section style={{ display: "grid", gap: 10, maxWidth: 720 }}>
        <input
          placeholder="Zona del cuerpo (bodyPlacement)"
          value={bodyPlacement}
          onChange={(e) => setBodyPlacement(e.target.value)}
        />
        <textarea
          placeholder="Describe la idea (ideaDescription)"
          value={ideaDescription}
          onChange={(e) => setIdeaDescription(e.target.value)}
          rows={4}
        />

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={firstTime} onChange={(e) => setFirstTime(e.target.checked)} />
          ¿Primera vez? (firstTime)
        </label>

        <label>
          Tamaño (tattooSize):
          <select value={tattooSize} onChange={(e) => setTattooSize(e.target.value as any)}>
            <option value="SMALL">SMALL</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LARGE">LARGE</option>
            <option value="XL">XL</option>
          </select>
        </label>

        <button onClick={onCreateAppointment} disabled={!selectedStart}>
          Crear cita
        </button>
      </section>
    </div>
  );
}
