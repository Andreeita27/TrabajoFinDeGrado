import { useEffect, useState } from "react";
import { getProfessionals } from "../api/showroomApi";
import type { ProfessionalDto } from "../types/professional";

export default function ProfessionalsPage() {
  const [items, setItems] = useState<ProfessionalDto[]>([]);
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

      <div style={{ display: "grid", gap: 16 }}>
        {items.map((p) => (
          <div key={p.id} style={{ border: "1px solid #333", padding: 12 }}>
            <img
              src={p.profilePhoto}
              alt={p.professionalName}
              style={{ width: 150 }}
            />

            <h3>{p.professionalName}</h3>

            <p>{p.description}</p>

            <p>
              {p.yearsExperience} años de experiencia —{" "}
              {p.booksOpened ? "Books opened" : "Books closed"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}