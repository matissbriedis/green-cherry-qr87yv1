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
        setTimeout(() => setShowSuccess(false), 5000);
      }
      window.history.replaceState({}, "", "/");
    }
  }, [paidRows]);

  const handleFile = (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    const interval = setInterval(
      () => setUploadProgress((p) => (p >= 90 ? 90 : p + 10)),
      100
    );

    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target.result;
      let json = [];
      if (file.name.endsWith(".csv")) {
        json = Papa.parse(new TextDecoder().decode(new Uint8Array(bstr)), {
          header: true,
          skipEmptyLines: true,
        }).data;
      } else {
        const wb = XLSX.read(bstr, { type: "binary" });
        json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      }
      const safe = json
        .map((r) => ({ From: (r.From || "").trim(), To: (r.To || "").trim() }))
        .filter((r) => r.From && r.To);
      setData(safe);
      validate(safe);
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(100);
    };
    file.name.endsWith(".csv")
      ? reader.readAsArrayBuffer(file)
      : reader.readAsBinaryString(file);
  };

  const validate = (rows) => {
    const dupes = rows
      .filter(
        (r, i) =>
          rows.findIndex(
            (x, j) => j !== i && x.From === r.From && x.To === r.To
          ) !== -1
      )
      .map((d) => `${d.From} → ${d.To}`);
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
            const km = j.features?.[0]?.properties?.distance
              ? (j.features[0].properties.distance / 1000).toFixed(2)
              : "No route";
            out.push({ ...row, Distance: `${km} km` });
          } else out.push({ ...row, Distance: "Error" });
        } else out.push({ ...row, Distance: "Geocode failed" });
      } catch {
        out.push({ ...row, Distance: "Error" });
      }
    }
    setResults(out);
    setIsCalculating(false);
  };

  const geocode = async (addr) => {
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        addr
      )}&apiKey=${GEOAPIFY_API_KEY}`;
      const r = await fetch(url);
      if (!r.ok) return null;
      const j = await r.json();
      const c = j.features?.[0]?.geometry?.coordinates;
      return c ? { lat: c[1], lon: c[0] } : null;
    } catch {
      return null;
    }
  };

  const download = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "distances.xlsx");
  };

  const needed = data.length > 10 + paidRows ? data.length - 10 - paidRows : 0;
  const amount = needed * 0.1;
  const PAYPAL_EMAIL = "your-paypal@example.com";
  const paypalUrl =
    needed > 0
      ? `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_EMAIL}&item_name=Unlock ${needed} rows&item_number=${needed}&amount=${amount.toFixed(
          2
        )}&currency_code=EUR&return=${encodeURIComponent(
          window.location.origin + `?paid=${needed}`
        )}`
      : null;

  return (
    <div className="container">
      {/* HERO */}
      <div className="hero">
        <h1>Bulk Distance Calculator</h1>
        <p>Free for 10 rows • €0.10 per extra row</p>
        <button
          className="btn primary cta"
          onClick={() =>
            document
              .getElementById("upload")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Start Now
        </button>
      </div>

      {/* SUCCESS BANNER */}
      {showSuccess && (
        <div className="success-banner">
          Payment successful! {needed} rows unlocked.
        </div>
      )}

      {/* UPLOAD */}
      <div id="upload" className="upload">
        <h2 style={{ textAlign: "center" }}>Upload File</h2>
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
            <p>{isUploading ? "Uploading..." : "Calculating..."}</p>
          </div>
        )}

        {validation && (
          <div className="validation">
            <h3>Result</h3>
            {error ? (
              <p style={{ color: "red" }}>{error}</p>
            ) : (
              <>
                <p>
                  <strong>Rows:</strong> {data.length}
                </p>
                <p>
                  <strong>Free:</strong> {Math.min(10, data.length)}
                </p>
                <p>
                  <strong>Paid:</strong> {paidRows}
                </p>
                <p>
                  <strong>Duplicates:</strong>{" "}
                  {validation.duplicates.length || "None"}
                </p>

                {needed > 0 ? (
                  <>
                    <p
                      style={{
                        color: "#d63384",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Need {needed} more row{needed > 1 ? "s" : ""}
                    </p>
                    <p style={{ textAlign: "center", fontSize: "1.3em" }}>
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
                  </>
                ) : (
                  <button
                    onClick={calculate}
                    className="btn primary"
                    disabled={isCalculating}
                  >
                    Calculate Distances
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {results.length > 0 && (
          <button onClick={download} className="btn success">
            Download Results
          </button>
        )}

        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = "/distance_template.xlsx";
            a.download = "template.xlsx";
            a.click();
          }}
          className="btn secondary"
        >
          Download Template
        </button>
      </div>
    </div>
  );
}
