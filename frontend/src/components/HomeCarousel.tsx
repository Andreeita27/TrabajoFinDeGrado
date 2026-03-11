import { useEffect, useMemo, useState } from "react";

type Props = {
  images: string[]; // rutas tipo "/assets/..." o importadas
  intervalMs?: number;
  className?: string;
  alt?: string;
};

export default function HomeCarousel({ images, intervalMs = 2800, className = "", alt = "Carrusel" }: Props) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (safeImages.length <= 1) return;

    const t = window.setInterval(() => {
      setIdx((prev) => (prev + 1) % safeImages.length);
    }, intervalMs);

    return () => window.clearInterval(t);
  }, [safeImages.length, intervalMs]);

  if (safeImages.length === 0) {
    // Placeholder elegante mientras busco fotod
    return (
      <div className={`hpCarousel hpCarousel--placeholder ${className}`}>
        <div className="hpCarousel__phText">Aquí irá el carrusel</div>
      </div>
    );
  }

  return (
    <div className={`hpCarousel ${className}`}>
      {/* Imagen actual */}
      <img className="hpCarousel__img" src={safeImages[idx]} alt={alt} />

      {/* “Siguiente” por efecto suave pre-carga */}
      {safeImages.length > 1 && (
        <img
          className="hpCarousel__img hpCarousel__img--next"
          src={safeImages[(idx + 1) % safeImages.length]}
          alt={alt}
          aria-hidden="true"
        />
      )}

      {/* Puntos */}
      {safeImages.length > 1 && (
        <div className="hpCarousel__dots" aria-hidden="true">
          {safeImages.map((_, i) => (
            <span key={i} className={`hpDot ${i === idx ? "hpDot--on" : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}