import PayPalButton from "./PayPalButton";

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
              <p style={{ color: "#d63384", fontWeight: "bold" }}>
                Need {needed} more row{needed > 1 ? "s" : ""}
              </p>
              <p style={{ fontSize: "1.3em", margin: "15px 0" }}>
                Pay <strong>€{amount.toFixed(2)}</strong>
              </p>
              <PayPalButton amount={amount} onSuccess={onUnlock} />
              <p style={{ fontSize: "0.9em", color: "#666" }}>
                €0.10 per extra row • Instant unlock
              </p>
            </div>
          ) : (
            <button
              onClick={onCalculate}
              style={{
                width: "100%",
                padding: "12px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "1.1em",
              }}
            >
              Calculate Distances
            </button>
          )}
        </div>
      )}
    </div>
  );
}
