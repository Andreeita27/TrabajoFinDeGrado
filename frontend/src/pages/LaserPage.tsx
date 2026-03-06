export default function LaserPage() {
  return (
    <main style={{ width: "min(1100px, calc(100% - 2rem))", margin: "0 auto", padding: "7rem 0 4rem" }}>
      <section
        style={{
          borderRadius: 28,
          border: "1px solid rgba(181,161,108,0.16)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(10,10,10,0.9)",
          boxShadow: "0 18px 44px rgba(0,0,0,0.3)",
          padding: "2rem",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#b5a16c",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontSize: "0.78rem",
            fontWeight: 700,
          }}
        >
          Eliminación / atenuación
        </p>

        <h1
          style={{
            margin: "0.5rem 0 0",
            color: "#fff",
            fontFamily: '"Playfair Display", serif',
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            lineHeight: 1.08,
          }}
        >
          Láser
        </h1>

        <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.8 }}>
          Aquí explicaré el servicio.
        </p>
      </section>
    </main>
  );
}