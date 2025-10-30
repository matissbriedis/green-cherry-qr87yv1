// src/App.js
import React, { useState, useEffect } from "react";
import Hero from "./components/Hero";
import UploadSection from "./components/UploadSection";
import ValidationResult from "./components/ValidationResult";
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
    download
  } = useDistanceCalculator();

  const [paidRows, setPaidRows] = useState(0);

  // Handle ?paid=XX unlock
  useEffect(() => {
    const saved = localStorage.getItem("paidRows");
    if (saved) setPaidRows(parseInt(saved, 10));

    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid) {
      const num = parseInt(paid, 10);
      if (num > 0) {
        setPaidRows(prev => prev + num);
        localStorage.setItem("paidRows", (prev + num).toString());
      }
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return (
    <div className="app">
      <Hero />
      <UploadSection
        onFileUpload={handleFile}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      >
        {validation && (
          <ValidationResult
            data={data}
            paidRows={paidRows}
            onCalculate={() => calculate(paidRows)}
            validation={validation}
            error={error}
          />
        )}

        {results.length > 0 && !isCalculating && (
          <button
            onClick={download}
            className="button success"
            style={{ width: "100%", marginTop: "15px" }}
          >
            Download Results (Excel)
          </button>
        )}
      </UploadSection>

      <PricingSection />
      <Footer />
    </div>
  );
}