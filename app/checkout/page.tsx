import { connection } from "next/server";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  await connection();

  return (
    <main style={{ padding: 30, maxWidth: 960, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop</div>
          <h1
            style={{
              margin: "6px 0 0",
              fontSize: 34,
              fontWeight: 950,
              letterSpacing: "-0.03em",
            }}
          >
            Checkout
          </h1>
        </div>

        <a href="/" style={{ opacity: 0.7 }}>
          ← Continua a comprare
        </a>
      </header>

      <CheckoutClient />
    </main>
  );
}