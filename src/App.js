import React, { useState, useEffect, Suspense } from "react";
import "./Landing.css";
import { useTranslation } from "react-i18next";
import "./i18n";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const GEOAPIFY_API_KEY = process.env.REACT_APP_GEOAPIFY_KEY;

if (!GEOAPIFY_API_KEY) {
  console.error("GEOAPIFY_API_KEY is missing. Add it in Vercel Environment Variables.");
}

function clean(str) {
  if (!str) return "";
  return str.replace(/[<>&"'/]/g, "").trim();
}

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
    i18n.changeLanguage(language).then(() => {
      console.log(`Language changed to ${language}, t('title') = ${t("title", { defaultValue: "Fallback Title" })}`);
    }).catch(err => console.error("Language change failed:", err));
  }, [language, i18n, t]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleDownloadTemplate = () => {
    console.log("Download template triggered");
    const link = document.createElement("a");
    link.href = "/distance_template.xlsx";
    link.download = "distance_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Download initiated");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ];
    if (!allowed.includes(file.type)) {
      setError("Only .xlsx or .csv files allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too big. Max 10 MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    const interval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 100 ? 100 : prev + 10));
    }, 500);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      let jsonData = [];

      if (file.type.includes("csv")) {
        const txt = new TextDecoder().decode(new Uint8Array(bstr));
        jsonData = Papa.parse(txt, { header: true, skipEmptyLines: true }).data;
      } else {
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(sheet);
      }

      const safeData = jsonData.map(row => ({
        From: clean(row.From),
        To: clean(row.To)
      }));

      setData(safeData);
      validateData(safeData);
      clearInterval(interval);
      setIsUploading(false);
    };

    if (file.type.includes("csv")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const validateData = (data) => {
    const duplicates = data
      .filter((row, index) => data.findIndex((r, i) => i !== index && r.From === row.From && r.To === row.To) !== -1)
      .map(d => `${d.From} - ${d.To}`);
    const faults = data.filter(row => !row.From || !row.To).length;
    const price = Math.max(0, (data.length - 10) * 0.10).toFixed(2);
    setValidation({ duplicates: [...new Set(duplicates)], faults, price: `$${price}` });
  };

  const calculateDistances = async () => {
    if (!GEOAPIFY_API_KEY) {
      setError("API key missing. Contact admin.");
      return;
    }
    if (!validation || data.length === 0) {
      setError("No data to calculate.");
      return;
    }
    if (data.length > 10 && parseFloat(validation.price.replace("$", "")) > 0) {
      setError("Please purchase additional rows.");
      return;
    }

    setIsCalculating(true);
    setError("");
    const calculated = [];

    for (const row of data) {
      try {
        const from = await geocode(row.From);
        const to = await geocode(row.To);

        if (from && to) {
          const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
          const response = await fetch(url, { credentials: "omit" });
          if (response.status === 429) throw new Error("Rate limit");
          if (!response.ok) throw new Error("Routing failed");
          const result = await response.json();
          const km = result.features?.[0]?.properties?.distance
            ? (result.features[0].properties.distance / 1000).toFixed(2)
            : "No route";
          calculated.push({ ...row, Distance: `${km} km` });
        } else {
          calculated.push({ ...row, Distance: "Geocode failed" });
        }
      } catch (err) {
        calculated.push({ ...row, Distance: "Error" });
      }
    }
    setResults(calculated);
    setIsCalculating(false);
  };

  const geocode = async (address) => {
    if (!GEOAPIFY_API_KEY) return null;
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}`;
      const response = await fetch(url, { credentials: "omit" });
      if (response.status === 429) throw new Error("Rate limit");
      if (!response.ok) throw new Error("Geocode failed");
      const data = await response.json();
      if (data.features?.[0]?.geometry?.coordinates) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        return { lat, lon };
      }
      return null;
    } catch (err) {
      return null;
    }
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
      <div className="language-section" style={{ padding: "20px", textAlign: "center" }}>
        <label htmlFor="language-select" className="language-label">
          {t("toggle_language")}:
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
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
        <button className="cta-button" onClick={() => document.getElementById("upload-section").scrollIntoView()}>
          {t("start_now")}
        </button>
      </header>

      <section className="features">
        <h2>{t("features_title")}</h2>
        <ul>
          <li>{t("feature_supports")}</li>
          <li>{t("feature_output")}</li>
          <li>{t("feature_validation")}</li>
          <li>{t("feature_no_signup")}</li>
        </ul>
      </section>

      <section className="how-it-works">
        <h2>{t("how_it_works_title")}</h2>
        <ol>
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
          <li>{t("step4")}</li>
        </ol>
      </section>

      <section id="upload-section" className="upload-section">
        <h2>{t("upload_title")}</h2>
        <div className="upload-container">
          <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} disabled={isUploading} />
          {isUploading && (
            <div className="progress-bar">
              <div className="progress" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          )}
          {validation && (
            <div className="validation-result">
              <h3>Validation Result</h3>
              {error ? (
                <p style={{ color: "red" }}>{error}</p>
              ) : (
                <div>
                  <p>Valid Rows: {data.length}</p>
                  <p>Duplicates: {validation.duplicates.length || "None"}</p>
                  <p>Faults: {validation.faults || "None"}</p>
                  <p>Price: {validation.price}</p>
                  <button className="cta-button" onClick={calculateDistances} disabled={isCalculating}>
                    {t("calculate")}
                  </button>
                </div>
              )}
            </div>
          )}
          {results.length > 0 && (
            <button className="cta-button" onClick={downloadResults} style={{ marginTop: "15px" }}>
              {t("download_results")}
            </button>
          )}
          <button className="cta-button" onClick={handleDownloadTemplate} style={{ marginTop: "15px" }}>
            {t("download_template")}
          </button>
        </div>
      </section>

      <section className="pricing">
        <h2>{t("pricing_title")}</h2>
        <table>
          <thead>
            <tr>
              <th>{t("service")}</th>
              <th>{t("price")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t("validation_service")}</td>
              <td>{t("validation_price")}</td>
            </tr>
            <tr>
              <td>{t("additional_rows")}</td>
              <td>{t("additional_rows_price")}</td>
            </tr>
            <tr>
              <td>{t("buy_50_rows")}</td>
              <td>{t("buy_50_price")}</td>
            </tr>
            <tr>
              <td>{t("buy_100_rows")}</td>
              <td>{t("buy_100_price")}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer>
        <p>
          {t("footer_text")} <a href="https://docs.distance.tools/tools/spreadsheet">{t("footer_link")}</a> {t("footer_contact")}
        </p>
      </footer>
    </div>
  );
}

export default App;