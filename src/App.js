// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import DocsPage from "./pages/DocsPage";

const GEOAPIFY_KEY = process.env.REACT_APP_GEOAPIFY_KEY;

// Default EU emissions
const DEFAULT_CO2_PER_KM = {
  car: 0.171,
  van: 0.25,
  truck: 0.85,
  electric: 0.05,
};

function Home() {
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);
  const [vehicle, setVehicle] = useState("car");
  const [customCO2, setCustomCO2] = useState({}); // Pro: custom values
  const [isPro, setIsPro] = useState(false); // Pro tier
  const [validation, setValidation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [paidRows, setPaidRows] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [totalCO2Saved, setTotalCO2Saved] = useState(null);
  const [totalTrees, setTotalTrees] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("paidRows");
    if (saved) setPaidRows(parseInt(saved, 10));
    const pro = localStorage.getItem("isPro") === "true";
    setIsPro(pro);

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

  const CO2_PER_KM = { ...DEFAULT_CO2_PER_KM, ...customCO2 };

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
        .map((r) => ({
          From: String(r.From || "").trim(),
          To: String(r.To || "").trim(),
        }))
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
      .map((d) => `${d.From} to ${d.To}`);
    setValidation({ duplicates: [...new Set(dupes)] });
  };

  const calculate = async () => {
    const total = 10 + paidRows + (isPro ? 10000 : 0);
    if (data.length > total)
      return setError("Need more rows or upgrade to Pro");
    setIsCalculating(true);
    setError("");
    const out = [];
    let totalDistance = 0;
    let totalCO2Actual = 0;
    let totalCO2Truck = 0;

    for (const row of data) {
      try {
        const from = await geocode(row.From);
        const to = await geocode(row.To);
        if (from && to) {
          const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=drive&apiKey=${GEOAPIFY_KEY}`;
          const r = await fetch(url);
          if (r.ok) {
            const j = await r.json();
            const distance = j.features?.[0]?.properties?.distance / 1000 || 0;
            const co2Actual = distance * CO2_PER_KM[vehicle];
            const co2Truck = distance * DEFAULT_CO2_PER_KM.truck;
            const co2Saved = (co2Truck - co2Actual).toFixed(3);

            totalDistance += distance;
            totalCO2Actual += co2Actual;
            totalCO2Truck += co2Truck;

            out.push({
              ...row,
              Vehicle: vehicle,
              Distance: `${distance.toFixed(2)} km`,
              CO2: `${co2Actual.toFixed(3)} kg`,
              CO2_Saved: `+${co2Saved} kg`,
            });
          } else {
            out.push({
              ...row,
              Vehicle: vehicle,
              Distance: "Error",
              CO2: "Error",
              CO2_Saved: "Error",
            });
          }
        } else {
          out.push({
            ...row,
            Vehicle: vehicle,
            Distance: "Geocode failed",
            CO2: "Geocode failed",
            CO2_Saved: "Geocode failed",
          });
        }
      } catch {
        out.push({
          ...row,
          Vehicle: vehicle,
          Distance: "Error",
          CO2: "Error",
          CO2_Saved: "Error",
        });
      }
    }

    const saved = totalCO2Truck - totalCO2Actual;
    const trees = (saved / 22).toFixed(1); // 1 tree absorbs ~22kg CO₂/year
    setTotalCO2Saved(saved.toFixed(2));
    setTotalTrees(trees);
    setResults(out);
    setIsCalculating(false);
  };

  const geocode = async (addr) => {
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        addr
      )}&apiKey=${GEOAPIFY_KEY}`;
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
    const ws = XLSX.utils.json_to_sheet(
      results.map((r) => ({
        From: r.From,
        To: r.To,
        Vehicle: r.Vehicle,
        "Distance (km)": r.Distance.replace(" km", ""),
        "CO2 (kg)": r.CO2.replace(" kg", ""),
        "CO2 Saved vs Truck (kg)": r.CO2_Saved.replace("+", "").replace(
          " kg",
          ""
        ),
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "distances_co2_saved.xlsx");
  };

  const needed =
    data.length > 10 + paidRows + (isPro ? 10000 : 0)
      ? data.length - 10 - paidRows - (isPro ? 10000 : 0)
      : 0;
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
        <h1>Bulk Distance & CO₂ Calculator – Free Excel & CSV Tool</h1>
        <p>
          Calculate <strong>driving distances + carbon savings</strong> in
          seconds.
        </p>
        <p>
          <strong style={{ color: "#ff9f1c" }}>First 10 rows FREE</strong> •
          €0.10/row • <strong>Pro: €99/mo</strong>
        </p>
        <button
          className="btn cta"
          onClick={() =>
            document
              .getElementById("upload")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Start Free Now
        </button>
      </div>

      {showSuccess && (
        <div className="success-banner">
          Payment successful! {needed} extra rows unlocked.
        </div>
      )}

      {/* UPLOAD */}
      <div id="upload" className="upload">
        <h2>Upload File & Select Vehicle</h2>

        {/* PRO TIER UPGRADE */}
        {!isPro && (
          <div
            style={{
              textAlign: "center",
              margin: "20px 0",
              padding: "15px",
              background: "#fff3cd",
              borderRadius: "8px",
            }}
          >
            <p>
              <strong>Pro Tier:</strong> Unlimited rows + Custom CO₂ factors
            </p>
            <a
              href="https://paypal.com"
              className="btn primary"
              style={{ fontSize: "1em", padding: "10px 20px" }}
            >
              Upgrade €99/mo
            </a>
          </div>
        )}

        {/* CUSTOM CO2 (PRO ONLY) */}
        {isPro && (
          <div
            style={{
              background: "#e9f7ef",
              padding: "20px",
              borderRadius: "10px",
              margin: "20px 0",
            }}
          >
            <h3>Custom CO₂ Factors (kg/km)</h3>
            {Object.keys(DEFAULT_CO2_PER_KM).map((v) => (
              <div
                key={v}
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "8px 0",
                }}
              >
                <label style={{ width: "100px", textTransform: "capitalize" }}>
                  {v}:
                </label>
                <input
                  type="number"
                  step="0.001"
                  defaultValue={CO2_PER_KM[v]}
                  onChange={(e) =>
                    setCustomCO2((prev) => ({
                      ...prev,
                      [v]: parseFloat(e.target.value) || DEFAULT_CO2_PER_KM[v],
                    }))
                  }
                  style={{
                    width: "80px",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* VEHICLE SELECTOR */}
        <div style={{ textAlign: "center", margin: "30px 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            {Object.entries(CO2_PER_KM).map(([key, value]) => (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 18px",
                  border:
                    vehicle === key ? "2px solid #007bff" : "2px solid #ddd",
                  borderRadius: "10px",
                  background: vehicle === key ? "#f0f8ff" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontWeight: vehicle === key ? "bold" : "normal",
                  boxShadow:
                    vehicle === key ? "0 4px 8px rgba(0,123,255,0.2)" : "none",
                }}
              >
                <input
                  type="radio"
                  name="vehicle"
                  value={key}
                  checked={vehicle === key}
                  onChange={(e) => setVehicle(e.target.value)}
                  style={{ marginRight: "8px" }}
                />
                <span style={{ textTransform: "capitalize" }}>
                  {key} ({value} kg/km)
                </span>
              </label>
            ))}
          </div>
        </div>

        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={isUploading || isCalculating}
          style={{ display: "block", margin: "22px auto", padding: "12px" }}
        />

        {(isUploading || isCalculating) && (
          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <div className="spinner"></div>
            <p>{isUploading ? "Validating..." : "Calculating..."}</p>
          </div>
        )}

        {validation && (
          <div className="validation">
            <h3>Ready</h3>
            {error ? (
              <p style={{ color: "red" }}>{error}</p>
            ) : (
              <>
                <p>
                  <strong>Rows:</strong> {data.length}
                </p>
                <p>
                  <strong>Free:</strong> 10
                </p>
                <p>
                  <strong>Paid:</strong> {paidRows}
                </p>
                <p>
                  <strong>Pro:</strong> {isPro ? "Unlimited" : "€99/mo"}
                </p>
                {needed > 0 ? (
                  <div style={{ textAlign: "center" }}>
                    <p>
                      Need {needed} more • Pay €{amount.toFixed(2)}
                    </p>
                    <a
                      href={paypalUrl}
                      target="_blank"
                      rel="noopener"
                      className="btn primary"
                    >
                      Pay with PayPal
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={calculate}
                    className="btn primary"
                    disabled={isCalculating}
                  >
                    Calculate Now
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* CO2 SAVED + TREES */}
        {results.length > 0 && !isCalculating && totalCO2Saved && (
          <div className="co2-saved-badge">
            <div className="badge-content">
              <span className="leaf-icon">Leaf</span>
              <div className="badge-text">
                <strong>{totalCO2Saved} kg</strong> CO₂ saved
                <p style={{ margin: "5px 0 0", color: "#155724" }}>
                  = <strong>{totalTrees} trees</strong> planted this year
                </p>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && !isCalculating && (
          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <button onClick={download} className="btn success">
              Download Results (Excel)
            </button>
          </div>
        )}
      </div>

      {/* CONTENT + FAQ + PRICING + FOOTER */}
      <div className="content"> {/* ... same as before ... */} </div>
      <div className="faq"> {/* ... */} </div>
      <div className="pricing"> {/* ... */} </div>
      <footer> {/* ... */} </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
    </Router>
  );
}
