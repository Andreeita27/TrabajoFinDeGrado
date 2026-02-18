import { useEffect, useState } from "react";
import { getTattoos } from "../api/showroomApi";

export default function ShowroomPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getTattoos()
      .then(setItems)
      .catch((e) => setError(e?.message || "Error cargando tattoos"));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Showroom</h1>
      {error && <div style={{ color: "tomato" }}>{error}</div>}

      <ul>
        {items.map((t) => (
          <li key={t.id}>
            {t.style} — {t.tattooDate}
          </li>
        ))}
      </ul>
    </div>
  );
}