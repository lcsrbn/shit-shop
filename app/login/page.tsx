import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main style={{ padding: 30, maxWidth: 520, margin: "0 auto" }}>
      <div style={{ fontSize: 13, opacity: 0.65 }}>shit-shop</div>
      <h1
        style={{
          margin: "6px 0 0",
          fontSize: 34,
          fontWeight: 950,
          letterSpacing: "-0.03em",
        }}
      >
        Sign in
      </h1>

      <p style={{ marginTop: 10, opacity: 0.75 }}>
        Sign in or create an account to view your orders.
      </p>

      <div style={{ marginTop: 18 }}>
        <LoginForm />
      </div>
    </main>
  );
}