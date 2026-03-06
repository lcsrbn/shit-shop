import { connection } from "next/server";
import FloatingProducts from "@/components/FloatingProducts";

export default async function Page() {
  await connection();

  return (
    <main style={{ padding: 30, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(0,0,0,.55)" }}>shit-shop</div>
          <h1 style={{ margin: "6px 0 0", fontSize: 34, fontWeight: 950, letterSpacing: "-0.03em" }}>
            shit-shop
          </h1>
        </div>
        <div style={{ fontSize: 13, color: "rgba(0,0,0,.55)" }}>click = open · click card = flip</div>
      </header>

      <div style={{ marginTop: 18 }}>
        <FloatingProducts />
      </div>
    </main>
  );
}