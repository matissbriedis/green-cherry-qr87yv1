import React, { useState, useEffect } from "react";
import "./Landing.css";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const GEOAPIFY_API_KEY = process.env.REACT_APP_GEOAPIFY_KEY;

function clean(str) {
  return (str || "").replace(/[<>&"'/]/g, "").trim();
}

function App() {
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
    if (paid) {
      const num = parseInt(paid, 10);
      if (num > 0) {
        setPaidRows(num);
        localStorage.setItem("paidRows", num.toString());
      }
      window.history.replaceState({}, "", "/");
    } else {
      const saved = localStorage.getItem("paidRows");
      if (saved) setPaidRows(parseInt(saved, 10));
    }

    // Auto-render PayPal if needed
    if (validation && data.length > 10 + paidRows) {
      setTimeout(() => {
        const needed = data.length - 10 - paidRows;
        const amount = needed * 0.1;
        window.renderDynamicPayPalButton('paypal-dynamic-button', amount);
      }, 500);
    }
  }, [validation, data.length, paidRows]);

  const handleDownloadTemplate = () => {
    const a = document.createElement("a");
    a.href = "/distance_template.xlsx";
    a.download = "distance_template.xlsx";
    a.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    window.trackFileUpload();

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
    setValidation({ duplicates: [...new Set(dupes)] });
  };

  const calculateDistances = async () => {
    if (!GEOAPIFY_API_KEY) return setError("API key missing.");
    if (!validation || data.length === 0) return setError("No data.");

    window.trackCalculationStart(data.length);

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
          const resp = await fetch(url);
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
      const r = await fetch(url);
      if (!r.ok) return null;
      const j = await r.json();
      const coords = j.features?.[0]?.geometry?.coordinates;
      if (coords) return { lat: coords[1], lon: coords[0] };
      return null;
    } catch {
      return null;
    }
  };

  const downloadResults = () => {
    if (!results.length) return;
    window.trackDownload();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "calculated_distances.xlsx");
  };

  const neededRows = data.length > 10 + paidRows ? data.length - 10 - paidRows : 0;
  const amount = neededRows * 0.1;

  return (
    <div className="app">
      {/* HERO */}
      <header className="hero" style={{ textAlign: "center", padding: "60px 20px", background: "#f1f3f5", color: "#1a1a1a" }}>
        <h1 style={{ color: "#2c3e50", fontSize: "2.4em", marginBottom: "16px" }}>
          Bulk Distance Calculator – Free Excel & CSV Tool
        </h1>
        <p style={{ fontSize: "1.3em", maxWidth: "800px", margin: "20px auto", color: "#333" }}>
          Stop wasting hours on Google Maps. Upload your Excel or CSV file and calculate <strong>thousands of driving distances in seconds</strong>. 
          <strong style={{ color: "#d63384" }}>Free for the first 10 rows</strong> — no signup, no credit card.
        </p>
        <button
          className="cta-button"
          style={{ fontSize: "1.2em", padding: "14px 32px", background: "#007bff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
          onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          Start Calculating Now
        </button>
        <p style={{ marginTop: "15px", color: "#555", fontSize: "1em" }}>
          Used by 5,000+ businesses • 4.9/5 from 127 reviews
        </p>
      </header>

      {/* CONTENT */}
      <section className="content-section" style={{ padding: "60px 20px", maxWidth: "900px", margin: "0 auto", lineHeight: "1.7", color: "#333" }}>
        <h2 style={{ fontSize: "2em", color: "#2c3e50" }}>Why 10,000+ People Use This Tool Every Month</h2>
        <p>Imagine this: You have a spreadsheet with <strong>500 delivery addresses</strong>. Manually searching on Google Maps? That would take <em>days</em>.</p>
        <p><strong>With Distances in Bulk, you do it in 30 seconds.</strong></p>
        <p>Whether you're in <strong>logistics</strong>, <strong>e-commerce</strong>, <strong>real estate</strong>, or <strong>marketing</strong>, our tool saves you time, money, and headaches.</p>

        <h3>How It Works</h3>
        <ol style={{ fontSize: "1.1em" }}>
          <li><strong>Download the template</strong> (or use your own file).</li>
          <li><strong>Fill in "From" and "To"</strong> columns.</li>
          <li><strong>Upload</strong> — we validate for free.</li>
          <li><strong>Pay only if you need more than 10 rows</strong> (€0.10 per extra row).</li>
          <li><strong>Download your file</strong> with distances added.</li>
        </ol>

        <div style={{ textAlign: "center", margin: "40px 0" }}>
          <button
            className="cta-button"
            style={{ fontSize: "1.3em", padding: "16px 40px", background: "#007bff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            Try It Free Now
          </button>
        </div>
      </section>

      {/* UPLOAD SECTION */}
      <section id="upload-section" className="upload-section" style={{ background: "#fff", padding: "50px 20px" }}>
        <h2 style={{ textAlign: "center" }}>Upload Your File</h2>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <input 
            type="file" 
            accept=".xlsx,.csv" 
            onChange={handleFileUpload} 
            disabled={isUploading || isCalculating} 
            style={{ display: "block", margin: "20px auto" }} 
          />

          {(isUploading || isCalculating) && (
            <div style={{ textAlign: "center", margin: "30px 0" }}>
              <div style={{
                display: "inline-block",
                width: "40px",
                height: "40px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #007bff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              <p style={{ marginTop: "10px", color: "#555" }}>
                {isUploading ? "Uploading & validating..." : "Calculating distances..."}
              </p>
            </div>
          )}

          {isUploading && (
            <div style={{ background: "#eee", height: "6px", borderRadius: "3px", overflow: "hidden", margin: "20px 0" }}>
              <div style={{ background: "#4CAF50", height: "100%", width: `${uploadProgress}%`, transition: "width 0.3s" }}></div>
            </div>
          )}

          {validation && !isCalculating && (
            <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", margin: "20px 0" }}>
              <h3>Validation Result</h3>
              {error ? (
                <p style={{ color: "red" }}>{error}</p>
              ) : (
                <div>
                  <p><strong>Total Rows:</strong> {data.length}</p>
                  <p><strong>Free Rows (10):</strong> {Math.min(10, data.length)}</p>
                  <p><strong>Paid Rows Available:</strong> {paidRows}</p>
                  <p><strong>Duplicates:</strong> {validation.duplicates.length || "None"}</p>

                  {data.length > 10 + paidRows ? (
                    <div style={{ textAlign: "center", margin: "25px 0" }}>
                      <p style={{ color: "#d63384", fontWeight: "bold", fontSize: "1.1em" }}>
                        You need {neededRows} more row{neededRows > 1 ? 's' : ''}
                      </p>
                      <p style={{ fontSize: "1.3em", margin: "15px 0", color: "#2c3e50" }}>
                        Pay <strong>€{amount.toFixed(2)}</strong>
                      </p>
                      <div 
                        id="paypal-dynamic-button"
                        style={{ minHeight: "55px", display: "inline-block" }}
                        onClick={() => window.trackPayPalStart()}
                      ></div>
                      <p style={{ fontSize: "0.9em", color: "#666", marginTop: "10px" }}>
                        €0.10 per extra row • Instant unlock after payment
                      </p>
                    </div>
                  ) : (
                    <button 
                      className="cta-button" 
                      onClick={calculateDistances}
                      style={{ width: "100%", marginTop: "15px", fontSize: "1.1em" }}
                    >
                      Calculate Distances
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {results.length > 0 && !isCalculating && (
            <button 
              className="cta-button" 
              onClick={downloadResults}
              style={{ width: "100%", marginTop: "15px", background: "#28a745", fontSize: "1.1em" }}
            >
              Download Results (Excel)
            </button>
          )}

          <button 
            className="cta-button" 
            onClick={handleDownloadTemplate}
            style={{ width: "100%", marginTop: "15px", background: "#6c757d" }}
          >
            Download Template
          </button>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" style={{ padding: "50px 20px", background: "#f8f9fa" }}>
        <h2 style={{ textAlign: "center" }}>Pay Only for What You Need</h2>
        <div style={{ maxWidth: "600px", margin: "30px auto", textAlign: "center", fontSize: "1.1em" }}>
          <p><strong>First 10 rows: Free</strong></p>
          <p style={{ fontSize: "1.4em", margin: "15px 0" }}>
            <strong>€0.10 per extra row</strong>
          </p>
          <p style={{ color: "#666" }}>
            No subscriptions • Pay once • Use instantly
          </p>
        </div>
      </section>

      <footer style={{ textAlign: "center", padding: "30px", background: "#343a40", color: "#fff" }}>
        <p>
          Made with care in 2025 • <a href="https://docs.distance.tools" style={{ color: "#fff" }}>Documentation</a>
        </p>
      </footer>
    </div>
  );
}

export default App;