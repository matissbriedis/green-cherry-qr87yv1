import React, { useState, useEffect, Suspense } from "react";
import "./Landing.css";
import { useTranslation } from "react-i18next";
import "./i18n";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const GEOAPIFY_API_KEY = "7da23bd96a564a17b6fc360f35c5177e";

function App() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || "en");
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);
  const [validation, setValidation] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    i18n
      .changeLanguage(language)
      .then(() => {
        console.log(`Language changed to ${language}`);
      })
      .catch((err) => console.error("Language change failed:", err));
  }, [language, i18n]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/distance_template.xlsx";
    link.download = "distance_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Download template triggered");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    const fileType = file.name.split(".").pop().toLowerCase();
    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 100 ? 100 : prev + 10));
    }, 500);

    if (fileType === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          validateData(results.data);
          clearInterval(interval);
          setIsUploading(false);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        setData(jsonData);
        validateData(jsonData);
        clearInterval(interval);
        setIsUploading(false);
      };
      reader.readAsBinaryString(file);
    }
  };

  const validateData = (data) => {
    const duplicates = data.filter(
      (row, index) =>
        data.findIndex(
          (r, i) => i !== index && r.From === row.From && r.To === row.To
        ) !== -1
    );
    const faults = data.filter((row) => !row.From || !row.To);
    const price = Math.max(0, (data.length - 10) * 0.1).toFixed(2);
    setValidation({
      duplicates: [...new Set(duplicates.map((d) => `${d.From} - ${d.To}`))],
      faults: faults.length,
      price,
    });
  };

  const calculateDistances = async () => {
    if (!validation || data.length > 10) {
      setError(
        `You need ${validation ? validation.price : 0} credits. Buy more rows!`
      );
      return;
    }

    setIsCalculating(true);
    const calculated = [];
    for (const row of data) {
      const from = await geocode(row.From);
      const to = await geocode(row.To);

      if (from && to) {
        const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
        const response = await fetch(url);
        const result = await response.json();
        const km = (result.features[0].properties.distance / 1000).toFixed(2);
        calculated.push({ ...row, Distance: `${km} km` });
      } else {
        calculated.push({ ...row, Distance: "Geocode failed" });
      }
    }
    setResults(calculated);
    setIsCalculating(false);
  };

  const geocode = async (address) => {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      address
    )}&apiKey=${GEOAPIFY_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const coords = data.features[0].geometry.coordinates;
      return { lat: coords[1], lon: coords[0] };
    }
    return null;
  };

  const downloadResults = () => {
    if (!results.length) return;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "calculated_distances.xlsx");
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
