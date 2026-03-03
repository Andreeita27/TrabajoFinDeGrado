import { useState } from "react";
import { getClients } from "../api/clientsApi";
import type { ClientDto } from "../types/client";
import { ApiError } from "../api/apiFetch";
import { useAuth } from "../auth/AuthContext";

type Props = {
  valueClientId: number | null;
  onChangeClient: (client: ClientDto) => void;
};

export default function ClientPicker({ valueClientId, onChangeClient }: Props) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [items, setItems] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const [hasSearched, setHasSearched] = useState(false);

  const search = async () => {
    setHasSearched(true);
    setError("");

  if (!token) {
    setError("No hay token. Inicia sesión como admin para buscar clientes.");
    return;
  }

  setLoading(true);
  try {
    const data = await getClients(token, {
      clientName: name.trim(),
      clientSurname: surname.trim(),
    });
    setItems(data);
  } catch (e: any) {
    if (e instanceof ApiError) {
      const bodyText = typeof e.body === "string" ? e.body : JSON.stringify(e.body);
      setError(`Error ${e.status}: ${e.message}${bodyText ? ` | ${bodyText}` : ""}`);
    } else {
      setError(e?.message || "Error buscando clientes");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ border: "1px solid #333", borderRadius: 8, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Cliente</h3>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="Nombre…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, width: 200 }}
        />
        <input
          placeholder="Apellidos…"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
          style={{ padding: 8, width: 240 }}
        />
        <button type="button" onClick={search} disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && <div style={{ color: "tomato", marginTop: 8 }}>{error}</div>}

      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {items.slice(0, 20).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChangeClient(c)}
            style={{
              textAlign: "left",
              padding: 10,
              borderRadius: 8,
              border: valueClientId === c.id ? "2px solid #b5a16c" : "1px solid #333",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <b>
              {c.clientName} {c.clientSurname}
            </b>{" "}
            <span style={{ opacity: 0.8 }}>({c.email})</span>
          </button>
        ))}

        {!loading && items.length === 0 && (
        hasSearched ? (
            <p style={{ opacity: 0.9, margin: 0, color: "tomato" }}>
            No hay coincidencias. Si es un cliente nuevo, dale de alta.
            </p>
        ) : (
            <p style={{ opacity: 0.8, margin: 0 }}>
            Haz una búsqueda por nombre/apellidos para ver resultados.
            </p>
            )
        )}
      </div>
    </div>
  );
}