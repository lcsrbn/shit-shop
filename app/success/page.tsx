import { connection } from "next/server";
import SuccessClient from "./SuccessClient";

export default async function SuccessPage() {
  await connection();

  return (
    <main style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop</div>
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
        Grazie! Il tuo ordine è stato registrato.
      </p>

      <div style={{ marginTop: 18 }}>
        <SuccessClient />
      </div>
    </main>
  );
}