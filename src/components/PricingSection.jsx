export default function PricingSection() {
  return (
    <section style={{ padding: "50px 20px", background: "#f8f9fa" }}>
      <h2 style={{ textAlign: "center" }}>Pay Only for What You Need</h2>
      <div
        style={{
          maxWidth: "600px",
          margin: "30px auto",
          textAlign: "center",
          fontSize: "1.1em",
        }}
      >
        <p>
          <strong>First 10 rows: Free</strong>
        </p>
        <p style={{ fontSize: "1.4em", margin: "15px 0" }}>
          <strong>€0.10 per extra row</strong>
        </p>
        <p style={{ color: "#666" }}>No subscriptions • Pay once • Instant</p>
      </div>
    </section>
  );
}
