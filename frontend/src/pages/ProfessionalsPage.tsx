import { useEffect, useState } from "react";
import { getProfessionals } from "../api/showroomApi";

export default function ProfessionalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getProfessionals()
      .then(setItems)
      .catch((e) => setError(e?.message || "Error cargando profesionales"));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Profesionales</h1>
      {error && <div style={{ color: "tomato" }}>{error}</div>}
      <ul>
        {items.map((p) => (
          <li key={p.id}>
            {p.name} — {p.yearsExperience} años — {p.booksOpened ? "Books opened" : "Books closed"}
          </li>
        ))}
      </ul>
    </div>
  );
}