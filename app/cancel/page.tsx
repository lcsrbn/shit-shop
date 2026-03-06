import CancelClient from "./CancelClient";

export default function CancelPage() {
  return (
    <main style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <h1>Pagamento annullato</h1>
      <p>Nessun addebito. Puoi riprovare quando vuoi.</p>

      <CancelClient />

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <a href="/checkout">Torna al checkout</a>
        <a href="/">Torna alla home</a>
      </div>
    </main>
  );
}