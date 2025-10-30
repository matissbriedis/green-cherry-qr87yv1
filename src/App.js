import React, { useState, useEffect } from "react";
import Hero from "./components/Hero";
import UploadSection from "./components/UploadSection";
import ValidationResult from "./components/ValidationResult";
import PricingSection from "./components/PricingSection";
import Footer from "./components/Footer";
import useDistanceCalculator from "./hooks/useDistanceCalculator";

export default function App() {
  const { data, results, validation, isUploading, isCalculating, uploadProgress, error, handleFile, calculate, download } = useDistanceCalculator();
  const [paidRows, setPaidRows] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("paidRows");
    if (saved) setPaidRows(parseInt(saved, 10));

    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid) {
      const num = parseInt(paid, 10);
      setPaidRows(num);
      localStorage.setItem("paidRows", num.toString());
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleUnlock = (extra) => {
    const total = paidRows + extra;
    setPaidRows(total);
    localStorage.setItem("paidRows", total.toString());
  };

  return (
    <div className="app">
      <Hero />
      <UploadSection onFileUpload={handleFile} isUploading={isUploading} uploadProgress={uploadProgress}>
        {validation && (
          <ValidationResult
            data={data}
            paidRows={paidRows}
            onUnlock={handleUnlock}
            onCalculate={() => calculate(paidRows)}
            validation={validation}
            error={error}
          />
        )}
        {results.length > 0 && !isCalculating && (
          <button onClick={download} style={{ width: "100%", padding: "12px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", marginTop: "15px" }}>
            Download Results (Excel)
          </button>
        )}
        <button onClick={() => { const a = document.createElement("a"); a.href = "/distance_template.xlsx"; a.download = "template.xlsx"; a.click(); }}
          style={{ width: "100%", padding: "12px", background: "#6c757d", color: "white", border: "none", borderRadius: "6px", marginTop: "15px" }}>
          Download Template
        </button>
      </UploadSection>
      <PricingSection />
      <Footer />
    </div>
  );
}