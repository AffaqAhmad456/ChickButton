export default function Page() {
  const storeUrl = process.env.CUSTOMER_ORIGIN || "http://localhost:5173"
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#f7fbfd", fontFamily: "Arial, sans-serif", color: "#123e70" }}>
      <section style={{ maxWidth: 560, textAlign: "center", background: "white", borderRadius: 24, padding: "48px 32px", boxShadow: "0 18px 60px rgba(18,62,112,.12)" }}>
        <div style={{ fontSize: 46, marginBottom: 12 }}>✓</div>
        <h1 style={{ margin: 0, fontSize: 34 }}>Welcome to ChickButton</h1>
        <p style={{ margin: "16px 0 28px", lineHeight: 1.7, color: "#64748b" }}>Your account is ready. You can safely return to ChickButton and continue shopping.</p>
        <a href={storeUrl} style={{ display: "inline-block", borderRadius: 999, background: "#123e70", color: "white", padding: "13px 22px", textDecoration: "none", fontWeight: 700 }}>Continue to ChickButton →</a>
      </section>
    </main>
  )
}
