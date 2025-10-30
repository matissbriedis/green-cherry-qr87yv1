// src/components/ValidationResult.jsx
import styles from "../styles/Button.module.css";

export default function ValidationResult({
  data,
  paidRows,
  onCalculate,
  validation,
  error,
}) {
  const needed = Math.max(0, data.length - 10 - paidRows);
  const amount = needed * 0.1;

  // REPLACE WITH YOUR PAYPAL EMAIL
  const PAYPAL_EMAIL = "your-paypal-email@example.com";

  const paypalUrl =
    needed > 0
      ? `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_EMAIL}&item_name=Unlock ${needed} extra rows&item_number=${needed}&amount=${amount.toFixed(
          2
        )}&currency_code=EUR&return=${encodeURIComponent(
          window.location.origin + `?paid=${needed}`
        )}&notify_url=${encodeURIComponent(window.location.origin + "/ipn")}`
      : null;

  return (
    <div
      style={{
        background: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        margin: "20px 0",
      }}
    >
      <h3>Validation Result</h3>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div>
          <p>
            <strong>Total Rows:</strong> {data.length}
          </p>
          <p>
            <strong>Free (10):</strong> {Math.min(10, data.length)}
          </p>
          <p>
            <strong>Paid Available:</strong> {paidRows}
          </p>
          <p>
            <strong>Duplicates:</strong>{" "}
            {validation.duplicates.length || "None"}
          </p>

          {needed > 0 ? (
            <div style={{ textAlign: "center", margin: "25px 0" }}>
              <p style={{ color: "#d63384", fontWeight: "bold" }}>
                Need {needed} more row{needed > 1 ? "s" : ""}
              </p>
              <p style={{ fontSize: "1.3em", margin: "15px 0" }}>
                Pay <strong>€{amount.toFixed(2)}</strong>
              </p>
              <a
                href={paypalUrl}
                target="_blank"
                rel="noopener"
                className={`${styles.button} ${styles.primary}`}
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Pay with PayPal
              </a>
              <p
                style={{ fontSize: "0.9em", color: "#666", marginTop: "10px" }}
              >
                €0.10 per extra row • Instant unlock after payment
              </p>
            </div>
          ) : (
            <button
              onClick={onCalculate}
              className={`${styles.button} ${styles.primary}`}
            >
              Calculate Distances
            </button>
          )}
        </div>
      )}
    </div>
  );
}
