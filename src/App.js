import React, { useState, useEffect } from "react";
import "./Landing.css";
import { useTranslation } from "react-i18next";
import "./i18n";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const GEOAPIFY_API_KEY = process.env.REACT_APP_GEOAPIFY_KEY;

if (!GEOAPIFY_API_KEY) {
  console.error("GEOAPIFY_API_KEY missing in Vercel env.");
}

function clean(str) {
  return (str || "").replace(/[<>&"'/]/g, "").trim();
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
  const [paidRows, setPaidRows] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid === "50") {
      setPaidRows(50);
      localStorage.setItem("paidRows", "50");
      window.history.replaceState({}, document.title, "/");
    } else {
      const saved = localStorage.getItem("paidRows");
      if (saved) setPaidRows(parseInt(saved, 10));
    }
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const handleLanguageChange = (e) => setLanguage(e.target.value);

  const handleDownloadTemplate = () => {
    const a = document.createElement("a");
    a.href = "/distance_template.xlsx";
    a.download = "distance_template.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    if (!allowed.includes(file.type)) {
      setError("Only .xlsx or .csv files allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too big – max 10 MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError("");

    const interval = setInterval(() => {
      setUploadProgress((p) => (p >= 100 ? 100 : p + 10));
    }, 500);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const bstr = ev.target?.result;
      let jsonData = [];

      if (file.type.includes("csv")) {
        const txt = new TextDecoder().decode(new Uint8Array(bstr));
        jsonData = Papa.parse(txt, { header: true, skipEmptyLines: true }).data;
      } else {
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(ws);
      }

      const safe = jsonData.map((r) => ({
        From: clean(r.From),
        To: clean(r.To),
      }));
      setData(safe);
      validateData(safe);
      clearInterval(interval);
      setIsUploading(false);
    };

    if (file.type.includes("csv")) reader.readAsArrayBuffer(file);
    else reader.readAsBinaryString(file);
  };

  const validateData = (rows) => {
    const dupes = rows
      .filter((r, i) => rows.findIndex((x, j) => j !== i && x.From === r.From && x.To === r.To) !== -1)
      .map((d) => `${d.From} - ${d.To}`);
    const price = Math.max(0, (rows.length - 10) * 0.1).toFixed(2);
    setValidation({ duplicates: [...new Set(dupes)], price: `€${price}` });
  };

  const calculateDistances = async () => {
    if (!GEOAPIFY_API_KEY) return setError("API key missing.");
    if (!validation || data.length === 0) return setError("No data.");

    const totalAllowed = 10 + paidRows;
    if (data.length > totalAllowed) {
      setError(`Need more rows. You have ${paidRows} paid.`);
      return;
    }

    setIsCalculating(true);
    setError("");
    const out = [];

    for (const row of data) {
      try {
        const from = await geocode(row.From);
        const to = await geocode(row.To);
        if (from && to) {
          const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
          const resp = await fetch(url, { credentials: "omit" });
          if (!resp.ok) throw new Error();
          const json = await resp.json();
          const km = json.features?.[0]?.properties?.distance
            ? (json.features[0].properties.distance / 1000).toFixed(2)
            : "No route";
          out.push({ ...row, Distance: `${km} km` });
        } else {
          out.push({ ...row, Distance: "Geocode failed" });
        }
      } catch {
        out.push({ ...row, Distance: "Error" });
      }
    }
    setResults(out);
    setIsCalculating(false);
  };

  const geocode = async (addr) => {
    if (!GEOAPIFY_API_KEY) return null;
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addr)}&apiKey=${GEOAPIFY_API_KEY}`;
      const r = await fetch(url, { credentials: "omit" });
      if (!r.ok) return null;
      const j = await r.json();
      const coords = j.features?.[0]?.geometry?.coordinates;
      if (coords) {
        const [lon, lat] = coords;
        return { lat, lon };
      }
      return null;
    } catch {
      return null;
    }
  };

  const downloadResults = () => {
    if (!results.length) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "calculated_distances.xlsx");
  };

  return (
    <div className="app">
      {/* Language */}
      <div className="language-section" style={{ padding: "20px", textAlign: "center" }}>
        <label>{t("toggle_language")}:</label>
        <select value={language} onChange={handleLanguageChange}>
          <option value="en">English</option>
          <option value="sv">Svenska</option>
          <option value="no">Norsk</option>
          <option value="da">Dansk</option>
        </select>
      </div>

      {/* HERO */}
      <header className="hero">
        <h1>Bulk Distance Calculator – Free Excel & CSV Tool</h1>
        <p>
          Calculate <strong>thousands of distances</strong> in seconds. 
          Upload Excel/CSV → Get accurate driving distances. 
          <strong>Free for 10 rows</strong>.
        </p>
        <button
          className="cta-button"
          onClick={() => document.getElementById("upload-section")?.scrollIntoView()}
        >
          Start Now – It's Free
        </button>
        <div style={{ marginTop: "15px", fontSize: "14px", color: "#555" }}>
          Used by 5,000+ businesses • 4.9/5 from 127 reviews
        </div>
      </header>

      {/* FEATURES */}
      <section className="features">
        <h2>Why Choose Us?</h2>
        <ul>
          <li>Supports Excel (.xlsx) and CSV</li>
          <li>Accurate driving distances</li>
          <li>Free validation + 10 free rows</li>
          <li>No signup required</li>
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <ol>
          <li>Download template</li>
          <li>Fill "From" and "To" columns</li>
          <li>Upload file</li>
          <li>Get results instantly</li>
        </ol>
      </section>

      {/* UPLOAD */}
      <section id="upload-section" className="upload-section">
        <h2>Upload Your File</h2>
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
                  <p>Price: {validation.price}</p>

                  {data.length > 10 + paidRows ? (
                    <div style={{ margin: "20px 0", textAlign: "center" }}>
                      <p style={{ color: "red", fontWeight: "bold" }}>Purchase additional rows</p>
                      <div id="paypal-container-SZHCMQ36L2RAU"></div>
                    </div>
                  ) : (
                    <button className="cta-button" onClick={calculateDistances} disabled={isCalculating}>
                      {t("calculate")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {results.length > 0 && (
            <button className="cta-button" onClick={downloadResults} style={{ marginTop: "15px" }}>
              Download Results
            </button>
          )}
          <button className="cta-button" onClick={handleDownloadTemplate} style={{ marginTop: "15px" }}>
            Download Template
          </button>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing">
        <h2>Pricing</h2>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Validation</td>
              <td>Free</td>
            </tr>
            <tr>
              <td>First 10 rows</td>
              <td>Free</td>
            </tr>
            <tr>
              <td>Additional rows</td>
              <td>€0.10 per row</td>
            </tr>
            <tr>
              <td>
                Buy 50 rows
                <div id="paypal-container-SZHCMQ36L2RAU-pricing" style={{ marginTop: "8px" }}></div>
              </td>
              <td>€5.00</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* FAQ */}
      <section className="faq" style={{ padding: "40px 20px", background: "#f9f9f9" }}>
        <h2>Frequently Asked Questions</h2>
        <details>
          <summary>How does it work?</summary>
          <p>Upload Excel/CSV with "From" and "To" columns. We calculate driving distances using Geoapify.</p>
        </details>
        <details>
          <summary>Is it free?</summary>
          <p>Yes! First 10 rows are free. Pay €0.10 per additional row.</p>
        </details>
        <details>
          <summary>What files are supported?</summary>
          <p>.XLSX and .CSV up to 10 MB.</p>
        </details>
      </section>

      <footer>
        <p>
          Made with care • <a href="https://docs.distance.tools">Documentation</a>
        </p>
      </footer>
    </div>
  );
}

export default App;