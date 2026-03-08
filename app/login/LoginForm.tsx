"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage("Account creato. Controlla la tua email se è richiesta conferma.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        window.location.href = "/orders";
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Errore sconosciuto";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 12,
        border: "1px solid rgba(0,0,0,.10)",
        borderRadius: 18,
        padding: 18,
        background: "rgba(255,255,255,.92)",
      }}
    >
      <label style={{ display: "grid", gap: 6 }}>
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.12)" }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.12)" }}
        />
      </label>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            borderRadius: 999,
            border: 0,
            background: "#0b0b0b",
            color: "#fff",
            padding: "12px 16px",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {loading ? "Attendi..." : mode === "login" ? "Accedi" : "Registrati"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,.12)",
            background: "#fff",
            padding: "12px 16px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {mode === "login" ? "Crea account" : "Ho già un account"}
        </button>
      </div>

      {message ? <p style={{ margin: 0, opacity: 0.8 }}>{message}</p> : null}
    </form>
  );
}