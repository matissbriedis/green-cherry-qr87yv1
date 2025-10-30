// src/App.js
import React, { useState, useEffect } from "react";
import UploadSection from "./components/UploadSection";
import PricingSection from "./components/PricingSection";
import Footer from "./components/Footer";
import useDistanceCalculator from "./hooks/useDistanceCalculator";

export default function App() {
  const {
    data,
    results,
    validation,
    isUploading,
    isCalculating,
    uploadProgress,
    error,
    handleFile,
    calculate,
    download,
  } = useDistanceCalculator();

  const [paidRows, setPaidRows] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("paidRows");
    if (saved) setPaidRows(parseInt(saved, 10));

    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid) {
      const num = parseInt(paid, 10);
      if (num > 0) {
        const total = paidRows + num;
        setPaidRows(total);
        localStorage.setItem("paidRows", total.toString());
      }
      window.history.replaceState({}, "", "/");
    }
  }, [paidRows]);

  const needed = data.length > 10 + paidRows ? data.length - 10 - paidRows : 0;
  const amount = needed * 0.1;

  // REPLACE WITH YOUR PAYPAL EMAIL
  const PAYPAL_EMAIL = "your-paypal-email@example.com";
  const paypalUrl =
    needed > 0
      ? `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_EMAIL}&item_name=Unlock ${needed} rows&item_number=${needed}&amount=${amount.toFixed(
          2
        )}&currency_code=EUR&return=${encodeURIComponent(
          window.location.origin + `?paid=${needed}`
        )}`
      : null;

  return (
    <div className="app">
      <Hero />

      <UploadSection
        onFileUpload={handleFile}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      >
        {validation && (
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
                      className="btn primary"
                    >
                      Pay with PayPal
                    </a>
                    <p style={{ fontSize: "0.9em", color: "#666" }}>
                      €0.10 per extra row • Instant unlock
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => calculate(paidRows)}
                    className="btn primary"
                  >
                    Calculate Distances
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {results.length > 0 && !isCalculating && (
          <button onClick={download} className="btn success">
            Download Results (Excel)
          </button>
        )}

        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = "/distance_template.xlsx";
            a.download = "distance_template.xlsx";
            a.click();
          }}
          className="btn secondary"
        >
          Download Template
        </button>
      </UploadSection>

      <PricingSection />
      <Footer />
    </div>
  );
}
