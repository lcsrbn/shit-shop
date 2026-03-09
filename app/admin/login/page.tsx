export default function AdminLoginPage() {
    return (
      <main style={{ padding: 30, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop admin</div>
  
        <h1
          style={{
            margin: "6px 0 0",
            fontSize: 34,
            fontWeight: 950,
            letterSpacing: "-0.03em",
          }}
        >
          Admin login
        </h1>
  
        <p style={{ marginTop: 10, opacity: 0.75 }}>
          Accesso riservato all’amministrazione.
        </p>
  
        <form
          action="/api/admin-auth/login"
          method="post"
          style={{
            marginTop: 18,
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
              name="email"
              required
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.12)",
              }}
            />
          </label>
  
          <label style={{ display: "grid", gap: 6 }}>
            <span>Password</span>
            <input
              type="password"
              name="password"
              required
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,.12)",
              }}
            />
          </label>
  
          <button
            type="submit"
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
            Entra
          </button>
        </form>
      </main>
    );
  }