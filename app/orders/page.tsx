import OrdersClient from "./OrdersClient";

export default function OrdersPage() {
  return (
    <main style={{ padding: 30, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ fontSize: 13, opacity: 0.65 }}>Shit Shop</div>
      <h1
        style={{
          margin: "6px 0 0",
          fontSize: 34,
          fontWeight: 950,
          letterSpacing: "-0.03em",
        }}
      >
        I miei ordini
      </h1>

      <div style={{ marginTop: 18 }}>
        <OrdersClient />
      </div>
    </main>
  );
}