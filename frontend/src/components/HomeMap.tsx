type Props = {
  /** Google Maps "embed" URL */
  src: string;
  title?: string;
};

export default function HomeMap({ src, title = "Mapa 62 Rosas Tattoo" }: Props) {
  return (
    <div className="hpMap" aria-label={title}>
      <iframe
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        title={title}
      />
    </div>
  );
}