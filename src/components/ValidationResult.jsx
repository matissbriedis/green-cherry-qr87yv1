// src/components/ValidationResult.jsx
import PayPalButton from "./PayPalButton"; // ← CORRECT PATH
import styles from "../styles/Button.module.css";

export default function ValidationResult({
  data,
  paidRows,
  onUnlock,
  onCalculate,
  validation,
  error,
}) {
  const needed = Math.max(0, data.length - 10 - paidRows);
  const amount = needed * 0.1;

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
              <p
                style={{
                  color: "#d63384",
                  fontWeight: "bold",
                  fontSize: "1.1em",
                }}
              >
                Need {needed} more row{needed > 1 ? "s" : ""}
              </p>
              <p
                style={{
                  fontSize: "1.3em",
                  margin: "15px 0",
                  color: "#2c3e50",
                }}
              >
                Pay <strong>€{amount.toFixed(2)}</strong>
              </p>
              <PayPalButton amount={amount} onSuccess={onUnlock} />
              <p
                style={{ fontSize: "0.9em", color: "#666", marginTop: "10px" }}
              >
                €0.10 per extra row • Instant unlock
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
