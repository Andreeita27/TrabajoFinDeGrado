import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/apiFetch";
import { useAuth } from "../auth/AuthContext";
import {
  createAvailabilityWindow,
  createUnavailabilityBlock,
  deleteAvailabilityWindow,
  deleteUnavailabilityBlock,
  getAvailabilityWindows,
  getUnavailabilityBlocks,
  toggleAvailabilityWindow,
  toggleUnavailabilityBlock,
} from "../api/availabilityAdminApi";

import type {
  AvailabilityWindowDto,
  UnavailabilityBlockDto,
} from "../api/availabilityAdminApi";

import { getProfessionals } from "../api/showroomApi";
import type { ProfessionalDto } from "../types/professional";
import "../styles/adminAvailability.css";

const toIso = (v: string) => (v ? new Date(v).toISOString() : "");

function formatDateTime(value?: string) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("es-ES", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function getEnabledValue(item: { enabled?: boolean; active?: boolean }) {
  if (typeof item.enabled === "boolean") return item.enabled;
  if (typeof item.active === "boolean") return item.active;
  return true;
}

export default function AdminAvailabilityPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [professionals, setProfessionals] = useState<ProfessionalDto[]>([]);
  const [windows, setWindows] = useState<AvailabilityWindowDto[]>([]);
  const [blocks, setBlocks] = useState<UnavailabilityBlockDto[]>([]);

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [professionalId, setProfessionalId] = useState<string>("");

  const professionalIdNum = useMemo(() => {
    const n = Number(professionalId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [professionalId]);

  const [wFrom, setWFrom] = useState("");
  const [wTo, setWTo] = useState("");
  const [wNote, setWNote] = useState("");

  const [bFrom, setBFrom] = useState("");
  const [bTo, setBTo] = useState("");
  const [bReason, setBReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);

  const loadProfessionals = async () => {
    if (!token) return;

    setProLoading(true);
    try {
      const list = await getProfessionals();
      setProfessionals(list);

      if (!professionalId && list.length > 0) {
        setProfessionalId(String(list[0].id));
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error cargando profesionales";
      setError(message);
    } finally {
      setProLoading(false);
    }
  };

  const load = async () => {
    if (!token || !professionalIdNum) return;

    setError("");
    try {
      const [win, blo] = await Promise.all([
        getAvailabilityWindows(token, professionalIdNum),
        getUnavailabilityBlocks(token, professionalIdNum),
      ]);

      setWindows(win);
      setBlocks(blo);
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        nav("/login", { replace: true });
        return;
      }
      setError(e?.message || "Error cargando disponibilidad");
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

    loadProfessionals();
  }, [token, role]);

  useEffect(() => {
    if (professionalIdNum) {
      load();
    } else {
      setWindows([]);
      setBlocks([]);
    }
  }, [professionalIdNum]);

  const validateWindow = () => {
    if (!professionalIdNum) return "Selecciona un profesional.";
    if (!wFrom || !wTo) return "Debes indicar fecha de inicio y fin.";
    if (new Date(wTo) <= new Date(wFrom)) {
      return "La fecha final debe ser posterior a la inicial.";
    }
    return null;
  };

  const validateBlock = () => {
    if (!professionalIdNum) return "Selecciona un profesional.";
    if (!bFrom || !bTo) return "Debes indicar fecha de inicio y fin.";
    if (new Date(bTo) <= new Date(bFrom)) {
      return "La fecha final debe ser posterior a la inicial.";
    }
    return null;
  };

  const onCreateWindow = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !professionalIdNum) return;

    setError("");
    setOk("");

    const msg = validateWindow();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      await createAvailabilityWindow(token, professionalIdNum, {
        startDateTime: toIso(wFrom),
        endDateTime: toIso(wTo),
        note: wNote.trim() || undefined,
      });

      setOk("Ventana de disponibilidad creada correctamente.");
      setWFrom("");
      setWTo("");
      setWNote("");
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error creando la ventana de disponibilidad";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onCreateBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !professionalIdNum) return;

    setError("");
    setOk("");

    const msg = validateBlock();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      await createUnavailabilityBlock(token, professionalIdNum, {
        startDateTime: toIso(bFrom),
        endDateTime: toIso(bTo),
        reason: bReason.trim() || undefined,
      });

      setOk("Bloque de indisponibilidad creado correctamente.");
      setBFrom("");
      setBTo("");
      setBReason("");
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error creando el bloqueo";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onToggleWindow = async (id: number) => {
    if (!token) return;

    setError("");
    setOk("");

    try {
      await toggleAvailabilityWindow(token, id);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error cambiando el estado de la ventana";
      setError(message);
    }
  };

  const onToggleBlock = async (id: number) => {
    if (!token) return;

    setError("");
    setOk("");

    try {
      await toggleUnavailabilityBlock(token, id);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error cambiando el estado de bloqueo";
      setError(message);
    }
  };

  const onDeleteWindow = async (id: number) => {
    if (!token) return;
    const confirmed = window.confirm("¿Seguro que quieres eliminar esta ventana?");
    if (!confirmed) return;

    setError("");
    setOk("");

    try {
      await deleteAvailabilityWindow(token, id);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error eliminando la ventana";
      setError(message);
    }
  };

  const onDeleteBlock = async (id: number) => {
    if (!token) return;
    const confirmed = window.confirm("¿Seguro que quieres eliminar este bloqueo?");
    if (!confirmed) return;

    setError("");
    setOk("");

    try {
      await deleteUnavailabilityBlock(token, id);
      await load();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error eliminando el bloqueo";
      setError(message);
    }
  };

  const enabledWindows = useMemo(
    () => windows.filter((w) => getEnabledValue(w)).length,
    [windows]
  );

  const enabledBlocks = useMemo(
    () => blocks.filter((b) => getEnabledValue(b)).length,
    [blocks]
  );

  return (
    <div className="admin-availability-page">
      <header className="admin-availability-hero">
        <p className="admin-availability-kicker">Panel de administración</p>
        <h1 className="admin-availability-title">Disponibilidad del estudio</h1>
        <p className="admin-availability-text">
          Gestiona las franjas horarias en las que cada tatuador puede trabajar
          y crea bloqueos cuando haya ausencias, vacaciones o tiempos reservados.
        </p>
      </header>

      {(error || ok) && (
        <div
          className={`admin-availability-feedback ${
            error
              ? "admin-availability-feedback--error"
              : "admin-availability-feedback--success"
          }`}
        >
          {error || ok}
        </div>
      )}

      <div className="admin-availability-panel" style={{ marginBottom: "1.25rem" }}>
        <h2 className="admin-availability-panel__title">Seleccionar profesional</h2>
        <p className="admin-availability-panel__text">
          Todas las ventanas y bloqueos que se muestran abajo pertenecen al
          profesional seleccionado.
        </p>

        <div className="admin-availability-form">
          <label className="admin-availability-field">
            <span className="admin-availability-label">Profesional</span>
            <select
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              disabled={proLoading}
            >
              <option value="">
                {proLoading ? "Cargando..." : "Selecciona un profesional"}
              </option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.professionalName}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-availability-actions">
            <button
              type="button"
              onClick={load}
              className="admin-availability-btn admin-availability-btn--ghost"
              disabled={!professionalIdNum}
            >
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {!professionalIdNum ? (
        <div className="admin-availability-empty">
          Selecciona un profesional para gestionar sus ventanas publicadas y sus
          bloqueos de indisponibilidad.
        </div>
      ) : (
        <>
          <div className="admin-availability-grid">
            <section className="admin-availability-panel">
              <h2 className="admin-availability-panel__title">
                Añadir disponibilidad
              </h2>
              <p className="admin-availability-panel__text">
                Define una franja en la que el profesional estará disponible para
                recibir reservas.
              </p>

              <form onSubmit={onCreateWindow} className="admin-availability-form">
                <label className="admin-availability-field">
                  <span className="admin-availability-label">Desde</span>
                  <input
                    className="input"
                    type="datetime-local"
                    value={wFrom}
                    onChange={(e) => setWFrom(e.target.value)}
                    disabled={loading}
                  />
                </label>

                <label className="admin-availability-field">
                  <span className="admin-availability-label">Hasta</span>
                  <input
                    className="input"
                    type="datetime-local"
                    value={wTo}
                    onChange={(e) => setWTo(e.target.value)}
                    disabled={loading}
                  />
                </label>

                <label className="admin-availability-field">
                  <span className="admin-availability-label">Nota (opcional)</span>
                  <textarea
                    value={wNote}
                    onChange={(e) => setWNote(e.target.value)}
                    disabled={loading}
                    rows={4}
                    placeholder="Ej: horario especial, tarde de flashes, hueco extra..."
                  />
                </label>

                <div className="admin-availability-actions">
                  <button
                    type="submit"
                    className="admin-availability-btn admin-availability-btn--primary"
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Crear ventana"}
                  </button>
                </div>
              </form>
            </section>

            <section className="admin-availability-panel">
              <h2 className="admin-availability-panel__title">
                Añadir indisponibilidad
              </h2>
              <p className="admin-availability-panel__text">
                Úsalo para vacaciones, descansos, convenciones o cualquier tramo en
                el que el profesional no deba aceptar citas.
              </p>

              <form onSubmit={onCreateBlock} className="admin-availability-form">
                <label className="admin-availability-field">
                  <span className="admin-availability-label">Desde</span>
                  <input
                    className="input"
                    type="datetime-local"
                    value={bFrom}
                    onChange={(e) => setBFrom(e.target.value)}
                    disabled={loading}
                  />
                </label>

                <label className="admin-availability-field">
                  <span className="admin-availability-label">Hasta</span>
                  <input
                    className="input"
                    type="datetime-local"
                    value={bTo}
                    onChange={(e) => setBTo(e.target.value)}
                    disabled={loading}
                  />
                </label>

                <label className="admin-availability-field">
                  <span className="admin-availability-label">Motivo</span>
                  <textarea
                    value={bReason}
                    onChange={(e) => setBReason(e.target.value)}
                    disabled={loading}
                    rows={4}
                    placeholder="Ej: vacaciones, convención, descanso, baja médica..."
                  />
                </label>

                <div className="admin-availability-actions">
                  <button
                    type="submit"
                    className="admin-availability-btn admin-availability-btn--primary"
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Crear bloqueo"}
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="admin-availability-summary">
            <span className="admin-availability-chip">
              {windows.length} ventana{windows.length === 1 ? "" : "s"}
            </span>
            <span className="admin-availability-chip">
              {enabledWindows} activas
            </span>
            <span className="admin-availability-chip">
              {blocks.length} bloqueo{blocks.length === 1 ? "" : "s"}
            </span>
            <span className="admin-availability-chip">
              {enabledBlocks} activos
            </span>
          </div>

          <div className="admin-availability-lists">
            <section className="admin-availability-list-panel">
              <h2 className="admin-availability-list-title">
                Ventanas de disponibilidad
              </h2>
              <p className="admin-availability-list-text">
                Aquí ves las franjas que permiten generar citas para el profesional
                seleccionado.
              </p>

              {windows.length === 0 ? (
                <div className="admin-availability-empty">
                  Todavía no hay ventanas de disponibilidad registradas.
                </div>
              ) : (
                <div className="admin-availability-list">
                  {windows.map((w) => {
                    const enabled = getEnabledValue(w);

                    return (
                      <article key={w.id} className="admin-availability-card">
                        <div className="admin-availability-card__top">
                          <div>
                            <h3 className="admin-availability-card__title">
                              {w.professionalName || `Profesional #${w.professionalId}`}
                            </h3>

                            <p className="admin-availability-card__meta">
                              <strong>Desde:</strong> {formatDateTime(w.startDateTime)}
                              <br />
                              <strong>Hasta:</strong> {formatDateTime(w.endDateTime)}
                            </p>
                          </div>

                          <div className="admin-availability-badges">
                            <span
                              className={`admin-availability-badge ${
                                enabled
                                  ? "admin-availability-badge--enabled"
                                  : "admin-availability-badge--disabled"
                              }`}
                            >
                              {enabled ? "Activa" : "Desactivada"}
                            </span>
                          </div>
                        </div>

                        {w.note && (
                          <div className="admin-availability-card__reason">
                            <p className="admin-availability-card__reason-label">
                              Nota
                            </p>
                            <p className="admin-availability-card__reason-text">
                              {w.note}
                            </p>
                          </div>
                        )}

                        <div className="admin-availability-card__actions">
                          <button
                            type="button"
                            onClick={() => onToggleWindow(w.id)}
                            className="admin-availability-btn admin-availability-btn--ghost"
                          >
                            {enabled ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteWindow(w.id)}
                            className="admin-availability-btn admin-availability-btn--danger"
                          >
                            Eliminar
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="admin-availability-list-panel">
              <h2 className="admin-availability-list-title">
                Bloqueos de indisponibilidad
              </h2>
              <p className="admin-availability-list-text">
                Tramos que impiden reservar aunque existan ventanas activas.
              </p>

              {blocks.length === 0 ? (
                <div className="admin-availability-empty">
                  Todavía no hay bloqueos de indisponibilidad registrados.
                </div>
              ) : (
                <div className="admin-availability-list">
                  {blocks.map((b) => {
                    const enabled = getEnabledValue(b);

                    return (
                      <article key={b.id} className="admin-availability-card">
                        <div className="admin-availability-card__top">
                          <div>
                            <h3 className="admin-availability-card__title">
                              {b.professionalName || `Profesional #${b.professionalId}`}
                            </h3>

                            <p className="admin-availability-card__meta">
                              <strong>Desde:</strong> {formatDateTime(b.startDateTime)}
                              <br />
                              <strong>Hasta:</strong> {formatDateTime(b.endDateTime)}
                            </p>
                          </div>

                          <div className="admin-availability-badges">
                            <span
                              className={`admin-availability-badge ${
                                enabled
                                  ? "admin-availability-badge--enabled"
                                  : "admin-availability-badge--disabled"
                              }`}
                            >
                              {enabled ? "Activo" : "Desactivado"}
                            </span>
                          </div>
                        </div>

                        {b.reason && (
                          <div className="admin-availability-card__reason">
                            <p className="admin-availability-card__reason-label">
                              Motivo
                            </p>
                            <p className="admin-availability-card__reason-text">
                              {b.reason}
                            </p>
                          </div>
                        )}

                        <div className="admin-availability-card__actions">
                          <button
                            type="button"
                            onClick={() => onToggleBlock(b.id)}
                            className="admin-availability-btn admin-availability-btn--ghost"
                          >
                            {enabled ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteBlock(b.id)}
                            className="admin-availability-btn admin-availability-btn--danger"
                          >
                            Eliminar
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}