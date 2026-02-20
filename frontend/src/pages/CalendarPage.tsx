import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { getAvailability } from "../api/availabilityApi";
import { getProfessionals } from "../api/showroomApi";
import { createAppointment } from "../api/appointmentsApi";
import { useAuth } from "../auth/AuthContext";
import type { AvailabilitySlotDto } from "../types/availability";
import type { ProfessionalDto } from "../types/professional";
import type { TattooSize } from "../types/appointment";
import ClientPicker from "../components/ClientPicker";
import type { ClientDto } from "../types/client";

const OPEN_HOUR = "12:00:00";
const CLOSE_HOUR = "20:00:00";

const DURATION_BY_SIZE: Record<TattooSize, number> = {
  SMALL: 60,
  MEDIUM: 120,
  LARGE: 240,
  XL: 480,
};

const stepMinutes = 30;

function withSeconds(isoOrLocal: string) {
  return isoOrLocal.length === 16 ? `${isoOrLocal}:00` : isoOrLocal;
}

export default function CalendarPage() {
  const { token, role, clientId } = useAuth();
  const nav = useNavigate();

  const [selectedClient, setSelectedClient] = useState<ClientDto | null>(null);

  const [professionals, setProfessionals] = useState<ProfessionalDto[]>([]);
  const [professionalId, setProfessionalId] = useState<number>(0);

  //En vez de dateFrom/dateTo: solo día
  const [day, setDay] = useState<string>("");

  //Tamaño elegido por el usuario
  const [tattooSize, setTattooSize] = useState<TattooSize>("SMALL");

  //Duración calculada automáticamente
  const durationMinutes = useMemo(() => DURATION_BY_SIZE[tattooSize], [tattooSize]);

  const [slots, setSlots] = useState<AvailabilitySlotDto[]>([]);
  const [selectedStart, setSelectedStart] = useState<string>("");

  const [error, setError] = useState<string>("");

  const [bodyPlacement, setBodyPlacement] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [firstTime, setFirstTime] = useState(false);

  useEffect(() => {
    getProfessionals()
      .then((p) => {
        setProfessionals(p);
        if (p.length > 0) setProfessionalId(p[0].id);
      })
      .catch((e: any) => setError(e?.message || "Error cargando profesionales"));
  }, []);

  useEffect(() => {
    if (!token) return;
    if (!professionalId) return;
    if (!day) return;

    setError("");
    setSlots([]);
    setSelectedStart("");

    const fromIso = `${day}T${OPEN_HOUR}`;
    const toIso = `${day}T${CLOSE_HOUR}`;

    getAvailability(token, {
      professionalId,
      dateFrom: fromIso,
      dateTo: toIso,
      durationMinutes,
      stepMinutes: 30,
    })
      .then(setSlots)
      .catch((e: any) => {
        if (e instanceof ApiError && e.status === 401) {
          nav("/login", { replace: true, state: { from: "/calendar" } });
          return;
        }
        setError(e?.message || "Error cargando disponibilidad");
      });
  }, [token, professionalId, day, durationMinutes, nav]);

  const onCreateAppointment = async () => {
  if (!token) return;
  setError("");

  try {
    if (!selectedStart) throw new Error("Selecciona un slot primero");
    if (!bodyPlacement.trim()) throw new Error("Indica en qué parte del cuerpo quieres el tattoo.");
    if (!ideaDescription.trim()) throw new Error("Describe tu idea.");

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

    await createAppointment(token, {
      clientId: finalClientId!,
      professionalId,
      startDateTime: withSeconds(selectedStart),
      bodyPlacement,
      ideaDescription,
      firstTime,
      tattooSize,
      referenceImageUrl: null,
    });

    if (role === "ADMIN") {
      nav("/admin/appointments", { replace: true });
    } else {
      nav("/my-appointments", { replace: true });
    }
  } catch (e: any) {
    if (e instanceof ApiError && e.status === 401) {
      nav("/login", { replace: true, state: { from: "/calendar" } });
      return;
    }
    setError(e?.message || "Error creando cita");
  }
};

  const disableCreate =
    !selectedStart || (role === "ADMIN" && !selectedClient);

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
          Día:
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </label>

        <label>
          Tamaño:
          <select value={tattooSize} onChange={(e) => setTattooSize(e.target.value as TattooSize)}>
            <option value="SMALL">Pequeño (5-10 cm)</option>
            <option value="MEDIUM">Mediano (10-20 cm)</option>
            <option value="LARGE">Grande (20-50 cm)</option>
            <option value="XL">XL (+50 cm o piezas enteras)</option>
          </select>
          <span style={{ marginLeft: 10 }}>(Duración: {durationMinutes} min)</span>
        </label>
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
                {s.startDateTime}
              </label>
            </li>
          ))}
        </ul>
      )}

      {role === "ADMIN" && (
        <>
          <hr style={{ margin: "16px 0" }} />

          <ClientPicker
            valueClientId={selectedClient?.id ?? null}
            onChangeClient={(c) => setSelectedClient(c)}
          />

          {selectedClient && (
            <div style={{ marginTop: 8, marginBottom: 8, opacity: 0.9 }}>
              Cliente seleccionado:{" "}
              <b>
                {selectedClient.clientName} {selectedClient.clientSurname}
              </b>
            </div>
          )}
        </>
      )}

      <hr style={{ margin: "16px 0" }} />

      <h2>Datos de la cita</h2>
      <section style={{ display: "grid", gap: 10, maxWidth: 720 }}>
        <input
          placeholder="Zona del cuerpo"
          value={bodyPlacement}
          onChange={(e) => setBodyPlacement(e.target.value)}
        />
        <textarea
          placeholder="Describe la idea"
          value={ideaDescription}
          onChange={(e) => setIdeaDescription(e.target.value)}
          rows={4}
        />

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={firstTime} onChange={(e) => setFirstTime(e.target.checked)} />
          ¿Primera vez?
        </label>

        <button onClick={onCreateAppointment} disabled={disableCreate}>
          Crear cita
        </button>

        {role === "ADMIN" && !selectedClient && (
          <div style={{ opacity: 0.8 }}>
            Selecciona un cliente para poder crear la cita.
          </div>
        )}
      </section>
    </div>
  );
}