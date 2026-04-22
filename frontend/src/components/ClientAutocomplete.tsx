import { useEffect, useMemo, useRef, useState } from "react";
import { getClients } from "../api/clientsApi";

type ClientLite = {
  id: number;
  clientName: string;
  clientSurname: string;
  email?: string;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

type Props = {
  token: string;
  value: ClientLite | null;
  onChange: (client: ClientLite | null) => void;
};

type ClientInput = {
  id: number;
  clientName?: string;
  clientSurname?: string;
  email: string;
};

function normalizeClient(c: ClientInput): ClientLite {
  return {
    id: c.id,
    clientName: c.clientName ?? "",
    clientSurname: c.clientSurname ?? "",
    email: c.email,
  };
}

export default function ClientAutocomplete({ token, value, onChange }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);

  const [open, setOpen] = useState(false);

  // lista completa precargada
  const [allClients, setAllClients] = useState<ClientLite[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [errAll, setErrAll] = useState("");

  // resultados mostrados
  const [items, setItems] = useState<ClientLite[]>([]);
  const [err, setErr] = useState("");

  // Precarga una vez
  useEffect(() => {
    let cancelled = false;
    setLoadingAll(true);
    setErrAll("");

    getClients(token)
      .then((res) => {
        if (cancelled) return;
        setAllClients((res || []).map(normalizeClient));
      })
      .catch((e: unknown) => {
        if (cancelled) return;

        if (e instanceof Error) {
          setErrAll(e.message);
        } else {
          setErrAll("Error cargando clientes");
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAll(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Si viene value seleccionado desde fuera lo poneen el input
  useEffect(() => {
    if (value) setQuery(`${value.clientName} ${value.clientSurname}`.trim());
  }, [value]);

  // Filtrado local dinámico
  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase();
    setErr("");

    if (!open) return;

    // Si no hay query, enseña los primeros
    if (!q) {
      setItems(allClients.slice(0, 20));
      return;
    }

    const filtered = allClients
      .filter((c) => {
        const full = `${c.clientName} ${c.clientSurname}`.toLowerCase();
        const email = (c.email || "").toLowerCase();
        return full.includes(q) || email.includes(q);
      })
      .slice(0, 20);

    setItems(filtered);
  }, [debouncedQuery, allClients, open]);

  const showHint = useMemo(() => {
    if (loadingAll) return "Cargando clientes…";
    if (errAll) return errAll;
    if (!debouncedQuery.trim() && allClients.length > 0) return "Escribe para filtrar o elige de la lista…";
    if (items.length === 0) return "Sin resultados";
    return "";
  }, [loadingAll, errAll, debouncedQuery, allClients.length, items.length]);

  // Cerrar al click fuera
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Escape cierra
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const selectClient = (c: ClientLite) => {
    onChange(c);
    setQuery(`${c.clientName} ${c.clientSurname}`.trim());
    setOpen(false);      //cierra
    setItems([]);        //limpia
    setErr("");
  };

  const clearSelection = () => {
    onChange(null);
    setQuery("");
    setItems([]);
    setErr("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          placeholder="Buscar cliente por nombre, apellidos o email…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(null);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            // al abrir sin escribir enseña los primeros
            if (!query.trim()) setItems(allClients.slice(0, 20));
          }}
          style={{ padding: 8, width: "100%" }}
        />

        {value && (
          <button type="button" onClick={clearSelection}>
            Quitar
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            border: "1px solid #333",
            borderRadius: 8,
            background: "#111",
            zIndex: 20,
            maxHeight: 240,
            overflow: "auto",
          }}
        >
          {(err || errAll) && <div style={{ padding: 10, color: "tomato" }}>{err || errAll}</div>}

          {!err && !errAll && (loadingAll || items.length === 0) && (
            <div style={{ padding: 10, opacity: 0.8 }}>{showHint}</div>
          )}

          {!err &&
            !errAll &&
            items.map((c) => {
              const title = `${c.clientName} ${c.clientSurname}`.trim();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectClient(c)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 10,
                    border: "none",
                    background: "transparent",
                    color: "white",
                    cursor: "pointer",
                    borderBottom: "1px solid #222",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{title}</div>
                  {!!c.email && <div style={{ opacity: 0.8, fontSize: 12 }}>{c.email}</div>}
                </button>
              );
            })}
        </div>
      )}

      {value && (
        <div style={{ marginTop: 6, opacity: 0.85 }}>
          Seleccionado:{" "}
          <b>
            {value.clientName} {value.clientSurname}
          </b>
        </div>
      )}
    </div>
  );
}