// src/App.js
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const GEOAPIFY_API_KEY = process.env.REACT_APP_GEOAPIFY_KEY;

export default function App() {
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);
  const [validation, setValidation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [paidRows, setPaidRows] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

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
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 6000);
      }
      window.history.replaceState({}, "", "/");
    }
  }, [paidRows]);

  const handleFile = (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    const interval = setInterval(() => setUploadProgress(p => p >= 90 ? 90 : p + 10), 100);

    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target.result;
      let json = [];
      if (file.name.endsWith('.csv')) {
        json = Papa.parse(new TextDecoder().decode(new Uint8Array(bstr)), { header: true, skipEmptyLines: true }).data;
      } else {
        const wb = XLSX.read(bstr, { type: "binary" });
        json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      }
      const safe = json.map(r => ({ From: String(r.From || "").trim(), To: String(r.To || "").trim() })).filter(r => r.From && r.To);
      setData(safe);
      validate(safe);
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(100);
    };
    file.name.endsWith('.csv') ? reader.readAsArrayBuffer(file) : reader.readAsBinaryString(file);
  };

  const validate = (rows) => {
    const dupes = rows
      .filter((r, i) => rows.findIndex((x, j) => j !== i && x.From === r.From && x.To === r.To) !== -1)
      .map(d => `${d.From} → ${d.To}`);
    setValidation({ duplicates: [...new Set(dupes)] });
  };

  const calculate = async () => {
    const total = 10 + paidRows;
    if (data.length > total) return setError("Need more rows");
    setIsCalculating(true);
    setError("");
    const out = [];
    for (const row of data) {
      try {
        const from = await geocode(row.From);
        const to = await geocode(row.To);
        if (from && to) {
          const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
          const r = await fetch(url);
          if (r.ok) {
            const j = await r.json();
            const km = j.features?.[0]?.properties?.distance ? (j.features[0].properties.distance / 1000).toFixed(2) : "No route";
            out.push({ ...row, Distance: `${km} km` });
          } else out.push({ ...row, Distance: "Error" });
        } else out.push({ ...row, Distance: "Geocode failed" });
      } catch { out.push({ ...row, Distance: "Error" }); }
    }
    setResults(out);
    setIsCalculating(false);
  };

  const geocode = async (addr) => {
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addr)}&apiKey=${GEOAPIFY_API_KEY}`;
      const r = await fetch(url);
      if (!r.ok) return null;
      const j = await r.json();
      const c = j.features?.[0]?.geometry?.coordinates;
      return c ? { lat: c[1], lon: c[0] } : null;
    } catch { return null; }
  };

  const download = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "distances.xlsx");
  };

  const needed = data.length > 10 + paidRows ? data.length - 10 - paidRows : 0;
  const amount = needed * 0.1;
  const PAYPAL_EMAIL = "your-paypal@example.com"; // CHANGE THIS
  const paypalUrl = needed > 0
    ? `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_EMAIL}&item_name=Unlock ${needed} rows&item_number=${needed}&amount=${amount.toFixed(2)}&currency_code=EUR&return=${encodeURIComponent(window.location.origin + `?paid=${needed}`)}`
    : null;

  return (
    <div className="container">
      {/* HERO – ORIGINAL TEXT */}
      <div className="hero">
        <h1>Bulk Distance Calculator – Free Excel & CSV Tool</h1>
        <p>Stop wasting hours on Google Maps. Upload your file and calculate <strong>thousands of driving distances in seconds</strong>.</p>
        <p><strong style={{ color: "#d63384" }}>Free for the first 10 rows</strong>.</p>
        <button className="btn cta" onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}>
          Start Calculating Now
        </button>
        <p style={{ marginTop: "15px", color: "#ddd", fontSize: "1em" }}>
          Used by 5,000+ businesses • 4.9/5 from 127 reviews
        </p>
      </div>

      {/* SUCCESS BANNER */}
      {showSuccess && (
        <div className="success-banner">
          Payment successful! {needed} extra rows unlocked.
        </div>
      )}

      {/* UPLOAD */}
      <div id="upload" className="upload">
        <h2>Upload Your File</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#555" }}>
          Accepts .xlsx or .csv • Max 10 MB
        </p>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={isUploading || isCalculating}
          style={{ display: "block", margin: "20px auto" }}
        />

        {(isUploading || isCalculating) && (
          <div style={{ textAlign: "center" }}>
            <div className="spinner"></div>
            <p style={{ fontSize: "1.1em", color: "#555" }}>
              {isUploading ? "Uploading & validating..." : "Calculating distances..."}
            </p>
          </div>
        )}

        {validation && (
          <div className="validation">
            <h3>Validation Result</h3>
            {error ? <p style={{ color: "red" }}>{error}</p> : (
              <>
                <p><strong>Total Rows:</strong> {data.length}</p>
                <p><strong>Free (10):</strong> {Math.min(10, data.length)}</p>
                <p><strong>Paid Available:</strong> {paidRows}</p>
                <p><strong>Duplicates:</strong> {validation.duplicates.length || "None"}</p>

                {needed > 0 ? (
                  <div style={{ textAlign: "center", marginTop: "20px" }}>
                    <p style={{ color: "#d63384", fontWeight: "bold", fontSize: "1.2em" }}>
                      Need {needed} more row{needed > 1 ? 's' : ''}
                    </p>
                    <p style={{ fontSize: "1.5em", margin: "15px 0" }}>
                      Pay <strong>€{amount.toFixed(2)}</strong>
                    </p>
                    <a href={paypalUrl} target="_blank" rel="noopener" className="btn primary">
                      Pay with PayPal
                    </a>
                    <p style={{ fontSize: "0.95em", color: "#666", marginTop: "10px" }}>
                      €0.10 per extra row • Instant unlock
                    </p>
                  </div>
                ) : (
                  <button onClick={calculate} className="btn primary" disabled={isCalculating}>
                    Calculate Distances
                  </button>
                )}
              </>
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
      </div>

      {/* PRICING – ORIGINAL TEXT */}
      <div className="pricing">
        <h2>Pay Only for What You Need</h2>
        <p style={{ fontSize: "1.3em", margin: "20px 0" }}>
          <strong>First 10 rows: Free</strong>
        </p>
        <p className="price">€0.10</p>
        <p>per extra row</p>
        <p style={{ color: "#666", marginTop: "15px" }}>
          No subscriptions • Pay once • Instant
        </p>
      </div>

      {/* FOOTER – ORIGINAL TEXT */}
      <footer>
        <p>
          Made with care in 2025 • <a href="https://docs.distance.tools" style={{ color: "#fff" }}>Documentation</a>
        </p>
      </footer>
    </div>
  );
}