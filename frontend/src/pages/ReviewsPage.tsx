import { useEffect, useState } from "react";
import { getReviews } from "../api/showroomApi";
import type { ReviewDto } from "../types/review";

export default function ReviewsPage() {
  const [items, setItems] = useState<ReviewDto[]>([]);
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

      <div style={{ display: "grid", gap: 16 }}>
        {items.map((r) => (
          <div key={r.id} style={{ border: "1px solid #333", padding: 12 }}>
            <p>
              <strong>{r.rating}/5</strong>
            </p>

            <p>{r.comment}</p>

            <p>
              {r.wouldRecommend
                ? "✔ Recomienda el estudio"
                : "✘ No recomienda"}
            </p>

            <small>
              {new Date(r.createdAt).toLocaleDateString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}