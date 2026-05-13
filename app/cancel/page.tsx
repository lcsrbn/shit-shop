import CancelClient from "./CancelClient";

export default function CancelPage() {
  return (
    <main style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <h1>Payment cancelled</h1>
      <p>No charge was made. You can try again anytime.</p>

      <CancelClient />

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <a href="/checkout">Back to checkout</a>
        <a href="/">Back to home</a>
      </div>
    </main>
  );
}