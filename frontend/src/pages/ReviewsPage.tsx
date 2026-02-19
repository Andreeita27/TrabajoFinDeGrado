import { useEffect, useState } from "react";
import { getReviews } from "../api/showroomApi";

export default function ReviewsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getReviews()
      .then(setItems)
      .catch((e) => setError(e?.message || "Error cargando reseñas"));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Reseñas</h1>
      {error && <div style={{ color: "tomato" }}>{error}</div>}
      <ul>
        {items.map((r) => (
          <li key={r.id}>
            {r.rating}/5 — {r.comment}
          </li>
        ))}
      </ul>
    </div>
  );
}