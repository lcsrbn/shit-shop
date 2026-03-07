import OrdersClient from "./OrdersClient";

export default function OrdersPage() {
  return (
    <main style={{ padding: 30, maxWidth: 920, margin: "0 auto" }}>
      <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop</div>
      <h1
        style={{
          margin: "6px 0 0",
          fontSize: 34,
          fontWeight: 950,
          letterSpacing: "-0.03em",
        }}
      >
        I tuoi ordini
      </h1>

      <p style={{ marginTop: 10, opacity: 0.75 }}>
        Storico locale degli ordini salvati in questo browser.
      </p>

      <div style={{ marginTop: 18 }}>
        <OrdersClient />
      </div>
    </main>
  );
}