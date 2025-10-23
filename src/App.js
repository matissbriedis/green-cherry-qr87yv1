import React, { useState, Suspense, useEffect } from "react";
import "./Landing.css";
import { useTranslation } from "react-i18next";
import "./i18n";

function App() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || "en");
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleDownloadTemplate = () => {
    console.log("Download template triggered");
    // Placeholder: Replace with actual download logic
    // window.location.href = "/template.xlsx";
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 100 ? 100 : prev + 10));
    }, 500);

    try {
      // Simulate API call for validation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setValidationResult({
        validRows: 10,
        totalRows: file.size / 1024, // Rough estimate
        price: "$0.00",
        issues: ["No duplicates detected"],
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setValidationResult({ error: "Upload failed. Please try again." });
    } finally {
      clearInterval(interval);
      setIsUploading(false);
    }
  };

  return (
    <div className="app">
      <div
        className="language-section"
        style={{ padding: "20px", textAlign: "center" }}
      >
        <label htmlFor="language-select" className="language-label">
          {t("toggle_language", { defaultValue: "Toggle Language" })}:
        </label>
        <select
          id="language-select"
          value={language}
          onChange={handleLanguageChange}
          className="language-select"
        >
          <option value="en">English</option>
          <option value="sv">Svenska</option>
          <option value="no">Norsk</option>
          <option value="da">Dansk</option>
        </select>
      </div>

      <header className="hero">
        <h1>
          {t("title", {
            defaultValue:
              "Excel, XLSX, CSV, Google Sheets & Spreadsheet Bulk Distance Calculation",
          })}
        </h1>
        <p>
          {t("description", {
            defaultValue:
              "Calculate distances between locations in bulk. First 10 rows free, buy more as needed!",
          })}
        </p>
        <button
          className="cta-button"
          onClick={() =>
            document.getElementById("upload-section").scrollIntoView()
          }
        >
          {t("start_now", { defaultValue: "Start Now" })}
        </button>
      </header>

      <section className="features">
        <h2>{t("features_title", { defaultValue: "Features You Love" })}</h2>
        <ul>
          <li>
            {t("feature_supports", {
              defaultValue:
                "Supports countries, cities, regions, postal addresses, postcodes, airport codes (IATA), what3words, coordinates.",
            })}
          </li>
          <li>
            {t("feature_output", {
              defaultValue:
                "Output: Airline distance, driving distance/duration, time difference, bearing, compass direction.",
            })}
          </li>
          <li>
            {t("feature_validation", {
              defaultValue:
                "Free input validation (duplicates & fault detection).",
            })}
          </li>
          <li>
            {t("feature_no_signup", {
              defaultValue: "No sign-up required—pay per use with PayPal.",
            })}
          </li>
        </ul>
      </section>

      <section className="how-it-works">
        <h2>{t("how_it_works_title", { defaultValue: "How It Works" })}</h2>
        <ol>
          <li>
            {t("step1", {
              defaultValue:
                "Download the template or use your own XLSX/CSV/Google Sheet.",
            })}
          </li>
          <li>
            {t("step2", {
              defaultValue:
                "Upload your file for free validation (detects issues, shows price).",
            })}
          </li>
          <li>
            {t("step3", {
              defaultValue: "Buy rows via PayPal if needed (first 10 free).",
            })}
          </li>
          <li>
            {t("step4", {
              defaultValue:
                "Download full results with distances added to your sheet.",
            })}
          </li>
        </ol>
      </section>

      <section id="upload-section" className="upload-section">
        <h2>{t("upload_title", { defaultValue: "Upload Your File" })}</h2>
        <div className="upload-container">
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <button
            className="cta-button"
            onClick={handleUpload}
            disabled={isUploading || !file}
          >
            {t("upload", { defaultValue: "Upload" })}
          </button>
          {isUploading && (
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
          {validationResult && (
            <div className="validation-result">
              <h3>Validation Result</h3>
              {validationResult.error ? (
                <p style={{ color: "red" }}>{validationResult.error}</p>
              ) : (
                <div>
                  <p>Valid Rows: {validationResult.validRows}</p>
                  <p>Total Rows: {validationResult.totalRows.toFixed(2)} KB</p>
                  <p>Price: {validationResult.price}</p>
                  <p>Issues: {validationResult.issues.join(", ")}</p>
                </div>
              )}
            </div>
          )}
          <button
            className="cta-button"
            onClick={handleDownloadTemplate}
            style={{ marginTop: "15px" }}
          >
            {t("download_template", { defaultValue: "Download Template" })}
          </button>
        </div>
      </section>

      <section className="pricing">
        <h2>{t("pricing_title", { defaultValue: "Pricing" })}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("service", { defaultValue: "Service" })}</th>
              <th>{t("price", { defaultValue: "Price" })}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {t("validation_service", {
                  defaultValue: "Validation (duplicates & faults)",
                })}
              </td>
              <td>{t("validation_price", { defaultValue: "Free" })}</td>
            </tr>
            <tr>
              <td>
                {t("additional_rows", {
                  defaultValue: "Additional Rows (per row, after 10 free)",
                })}
              </td>
              <td>{t("additional_rows_price", { defaultValue: "$0.10" })}</td>
            </tr>
            <tr>
              <td>{t("buy_50_rows", { defaultValue: "Buy 50 Rows" })}</td>
              <td>{t("buy_50_price", { defaultValue: "$5.00" })}</td>
            </tr>
            <tr>
              <td>{t("buy_100_rows", { defaultValue: "Buy 100 Rows" })}</td>
              <td>{t("buy_100_price", { defaultValue: "$9.00" })}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer>
        <p>
          {t("footer_text", { defaultValue: "Questions? Check" })}{" "}
          <a href="https://docs.distance.tools/tools/spreadsheet">
            {t("footer_link", { defaultValue: "documentation" })}
          </a>{" "}
          {t("footer_contact", { defaultValue: "or contact us." })}
        </p>
      </footer>
    </div>
  );
}

export default App;
