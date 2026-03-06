"use client";

import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return (
    <main style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ fontSize: 13, opacity: 0.65 }}>Shit</div>
      <h1
        style={{
          margin: "6px 0 0",
          fontSize: 34,
          fontWeight: 950,
          letterSpacing: "-0.03em",
        }}
      >
        Pagamento completato ✅
      </h1>

      <p style={{ marginTop: 10, opacity: 0.75 }}>
        Grazie! Il tuo ordine di test è stato registrato in locale.
      </p>

      <SuccessClient />
    </main>
  );
}