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

const toIso = (v: string) => (v ? new Date(v).toISOString() : "");
const fmt = (iso: string) => new Date(iso).toLocaleString("es-ES");

export default function AdminAvailabilityPage() {
  const { token, role } = useAuth();
  const nav = useNavigate();

  const [error, setError] = useState("");

  const [professionalId, setProfessionalId] = useState<string>("");

  const professionalIdNum = useMemo(() => {
    const n = Number(professionalId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [professionalId]);

  // data
  const [windows, setWindows] = useState<AvailabilityWindowDto[]>([]);
  const [blocks, setBlocks] = useState<UnavailabilityBlockDto[]>([]);

  // forms
  const [wFrom, setWFrom] = useState("");
  const [wTo, setWTo] = useState("");
  const [wNote, setWNote] = useState("");

  const [bFrom, setBFrom] = useState("");
  const [bTo, setBTo] = useState("");
  const [bReason, setBReason] = useState("");

  const load = async () => {
    if (!token || !professionalIdNum) return;

    setError("");
    try {
      const [w, b] = await Promise.all([
        getAvailabilityWindows(token, professionalIdNum),
        getUnavailabilityBlocks(token, professionalIdNum),
      ]);
      setWindows(w);
      setBlocks(b);
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
  }, [token, role]);

  useEffect(() => {
    load();
  }, [professionalIdNum]);

  const onCreateWindow = async () => {
    if (!token || !professionalIdNum) return;

    setError("");
    try {
      if (!wFrom || !wTo) {
        setError("Rellena desde/hasta para la ventana publicada.");
        return;
      }
      await createAvailabilityWindow(token, professionalIdNum, {
        startDateTime: toIso(wFrom),
        endDateTime: toIso(wTo),
        note: wNote.trim() || undefined,
      });
      setWFrom("");
      setWTo("");
      setWNote("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Error creando ventana publicada");
    }
  };

  const onToggleWindow = async (id: number) => {
    if (!token) return;

    setError("");
    try {
      await toggleAvailabilityWindow(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cambiando estado de ventana");
    }
  };

  const onDeleteWindow = async (id: number) => {
    if (!token) return;

    const ok = window.confirm("¿Borrar esta ventana publicada?");
    if (!ok) return;

    setError("");
    try {
      await deleteAvailabilityWindow(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error borrando ventana");
    }
  };

  const onCreateBlock = async () => {
    if (!token || !professionalIdNum) return;

    setError("");
    try {
      if (!bFrom || !bTo) {
        setError("Rellena desde/hasta para el bloqueo.");
        return;
      }
      await createUnavailabilityBlock(token, professionalIdNum, {
        startDateTime: toIso(bFrom),
        endDateTime: toIso(bTo),
        reason: bReason.trim() || undefined,
      });
      setBFrom("");
      setBTo("");
      setBReason("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Error creando bloqueo");
    }
  };

  const onToggleBlock = async (id: number) => {
    if (!token) return;

    setError("");
    try {
      await toggleUnavailabilityBlock(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error cambiando estado del bloqueo");
    }
  };

  const onDeleteBlock = async (id: number) => {
    if (!token) return;

    const ok = window.confirm("¿Borrar este bloqueo?");
    if (!ok) return;

    setError("");
    try {
      await deleteUnavailabilityBlock(token, id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Error borrando bloqueo");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Disponibilidad y bloqueos</h1>

      {error && <div style={{ color: "tomato", marginBottom: 10 }}>{error}</div>}

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "end",
          flexWrap: "wrap",
          marginBottom: 18,
          paddingBottom: 12,
          borderBottom: "1px solid #333",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          Profesional
          <input
            type="number"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            placeholder="Ej: 1"
            min={1}
          />
        </label>

        <button onClick={load} disabled={!professionalIdNum}>
          Refrescar
        </button>
      </div>

      {!professionalIdNum ? (
        <p>Introduce el ID del profesional para gestionar sus ventanas publicadas y bloqueos.</p>
      ) : (
        <>
          {/* Ventanas publicadas */}
          <section style={{ marginBottom: 26 }}>
            <h2>Fechas publicadas (reservables online)</h2>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", margin: "10px 0 14px" }}>
              <label style={{ display: "grid", gap: 6 }}>
                Desde
                <input type="datetime-local" value={wFrom} onChange={(e) => setWFrom(e.target.value)} />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                Hasta
                <input type="datetime-local" value={wTo} onChange={(e) => setWTo(e.target.value)} />
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 260 }}>
                Nota (opcional)
                <input value={wNote} onChange={(e) => setWNote(e.target.value)} placeholder="Ej: Guest Marta" />
              </label>

              <button onClick={onCreateWindow}>Publicar</button>
            </div>

            {windows.length === 0 ? (
              <p>No hay ventanas publicadas. (Si no publicas, no saldrá nada en el calendario)</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Rango</th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Nota</th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Estado</th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {windows.map((w) => (
                      <tr key={w.id}>
                        <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                          {fmt(w.startDateTime)} — {fmt(w.endDateTime)}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{w.note ?? "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                          {w.enabled ? "Activa" : "Desactivada"}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button onClick={() => onToggleWindow(w.id)}>
                              {w.enabled ? "Desactivar" : "Activar"}
                            </button>
                            <button onClick={() => onDeleteWindow(w.id)}>Borrar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Bloqueos */}
          <section>
            <h2>Bloqueos (vacaciones / convenciones / no disponible)</h2>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", margin: "10px 0 14px" }}>
              <label style={{ display: "grid", gap: 6 }}>
                Desde
                <input type="datetime-local" value={bFrom} onChange={(e) => setBFrom(e.target.value)} />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                Hasta
                <input type="datetime-local" value={bTo} onChange={(e) => setBTo(e.target.value)} />
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 260 }}>
                Motivo (opcional)
                <input value={bReason} onChange={(e) => setBReason(e.target.value)} placeholder="Ej: Convención" />
              </label>

              <button onClick={onCreateBlock}>Crear bloqueo</button>
            </div>

            {blocks.length === 0 ? (
              <p>No hay bloqueos.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Rango</th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Motivo</th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Estado</th>
                      <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #ddd" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map((b) => (
                      <tr key={b.id}>
                        <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                          {fmt(b.startDateTime)} — {fmt(b.endDateTime)}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{b.reason ?? "-"}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                          {b.enabled ? "Activo" : "Desactivado"}
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button onClick={() => onToggleBlock(b.id)}>
                              {b.enabled ? "Desactivar" : "Activar"}
                            </button>
                            <button onClick={() => onDeleteBlock(b.id)}>Borrar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}