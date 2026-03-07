export default function MaintenancePage() {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b0b0b",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 640, padding: 24 }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              border: "1px solid rgba(255,255,255,.14)",
              borderRadius: 999,
              opacity: 0.8,
              marginBottom: 18,
              fontSize: 13,
            }}
          >
            shit-shop
          </div>
  
          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            Sito in costruzione
          </h1>
  
          <p
            style={{
              marginTop: 18,
              fontSize: 18,
              lineHeight: 1.5,
              opacity: 0.72,
            }}
          >
            Stiamo preparando il negozio. Torna presto.
          </p>
        </div>
      </main>
    );
  }