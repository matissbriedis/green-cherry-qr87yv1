// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import DocsPage from "./pages/DocsPage";

const GEOAPIFY_KEY = process.env.REACT_APP_GEOAPIFY_KEY;

// EU CO₂ emissions (kg/km)
const CO2_PER_KM = {
  car: 0.171,
  van: 0.25,
  truck: 0.85,
  electric: 0.05,
};

function Home() {
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);
  const [vehicle, setVehicle] = useState("car");
  const [isUploading, setIsUploading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState("");
  const [paidRows, setPaidRows] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [totalCO2Saved, setTotalCO2Saved] = useState(null);
  const [totalTrees, setTotalTrees] = useState(null);

  // Load paid rows + PayPal return
  useEffect(() => {
    const saved = localStorage.getItem("paidRows");
    if (saved) setPaidRows(parseInt(saved, 10));

    const params = new URLSearchParams(window.location.search);
    const paid = params.get("paid");
    if (paid) {
      const num = parseInt(paid, 10);
      if (num > 0) {
        const total = (paidRows || 0) + num;
        setPaidRows(total);
        localStorage.setItem("paidRows", total.toString());
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 6000);
      }
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // File upload
  const handleFile = (file) => {
    if (!file) return;
    setIsUploading(true);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target.result;
      let json = [];
      if (file.name.endsWith(".csv")) {
        json = Papa.parse(bstr, { header: true, skipEmptyLines: true }).data;
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
      setIsUploading(false);
    };
    file.name.endsWith(".csv")
      ? reader.readAsText(file)
      : reader.readAsBinaryString(file);
  };

  // Calculate distances + CO₂
  const calculate = async () => {
    const total = 10 + paidRows;
    if (data.length > total) return setError("Need more rows. Upgrade below.");
    setIsCalculating(true);
    setError("");
    const out = [];
    let totalCO2Actual = 0;
    let totalCO2Truck = 0;

    for (const row of data) {
      try {
        const from = await geocode(row.From);
        const to = await geocode(row.To);
        if (!from || !to) {
          out.push({
            ...row,
            Vehicle: vehicle,
            Distance: "Geocode failed",
            CO2: "Error",
            CO2_Saved: "Error",
          });
          continue;
        }

        const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=drive&apiKey=${GEOAPIFY_KEY}`;
        const r = await fetch(url);
        if (!r.ok) {
          out.push({
            ...row,
            Vehicle: vehicle,
            Distance: "Routing error",
            CO2: "Error",
            CO2_Saved: "Error",
          });
          continue;
        }

        const j = await r.json();
        const distance = j.features?.[0]?.properties?.distance / 1000 || 0;
        const co2Actual = distance * CO2_PER_KM[vehicle];
        const co2Truck = distance * CO2_PER_KM.truck;
        const co2Saved = (co2Truck - co2Actual).toFixed(3);

        totalCO2Actual += co2Actual;
        totalCO2Truck += co2Truck;

        out.push({
          ...row,
          Vehicle: vehicle,
          Distance: `${distance.toFixed(2)} km`,
          CO2: `${co2Actual.toFixed(3)} kg`,
          CO2_Saved: `+${co2Saved} kg`,
        });
      } catch (err) {
        out.push({
          ...row,
          Vehicle: vehicle,
          Distance: "Error",
          CO2: "Error",
          CO2_Saved: "Error",
        });
      }
    }

    const saved = (totalCO2Truck - totalCO2Actual).toFixed(2);
    const trees = (saved / 22).toFixed(1);
    setTotalCO2Saved(saved);
    setTotalTrees(trees);
    setResults(out);
    setIsCalculating(false);
  };

  // Geocode helper
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

  // Download Excel
  const download = () => {
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
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "distances_co2_saved.xlsx");
  };

  // PayPal
  const needed = Math.max(0, data.length - 10 - paidRows);
  const amount = (needed * 0.1).toFixed(2);
  const PAYPAL_EMAIL = "matiss.briedis@hotmail.com";
  const PAYPAL_URL = `https://www.paypal.com/cgi-bin/webscr`;

  const paypalForm = needed > 0 && (
    <form
      action={PAYPAL_URL}
      method="post"
      target="_top"
      style={{ marginTop: "20px" }}
    >
      <input type="hidden" name="cmd" value="_xclick" />
      <input type="hidden" name="business" value={PAYPAL_EMAIL} />
      <input
        type="hidden"
        name="item_name"
        value={`Unlock ${needed} extra rows`}
      />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="currency_code" value="EUR" />
      <input
        type="hidden"
        name="return"
        value={`${window.location.origin}?paid=${needed}`}
      />
      <input
        type="hidden"
        name="cancel_return"
        value={window.location.origin}
      />
      <button type="submit" className="btn primary">
        Pay €{amount} with PayPal
      </button>
    </form>
  );

  return (
    <div className="container">
      {/* HERO */}
      <div className="hero">
        <h1>Bulk Distance & CO₂ Calculator</h1>
        <p>Free Excel/CSV tool • First 10 rows free • €0.10 per extra row</p>
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
        <h2>Upload File</h2>

        {/* Vehicle Selector */}
        <div style={{ textAlign: "center", margin: "25px 0" }}>
          <p style={{ fontWeight: 600 }}>Vehicle:</p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {Object.keys(CO2_PER_KM).map((v) => (
              <label
                key={v}
                style={{
                  padding: "10px 16px",
                  border:
                    vehicle === v ? "2px solid #007bff" : "2px solid #ddd",
                  borderRadius: "8px",
                  background: vehicle === v ? "#f0f8ff" : "white",
                  cursor: "pointer",
                  fontWeight: vehicle === v ? "bold" : "normal",
                }}
              >
                <input
                  type="radio"
                  name="vehicle"
                  value={v}
                  checked={vehicle === v}
                  onChange={(e) => setVehicle(e.target.value)}
                  style={{ marginRight: "6px" }}
                />
                {v} ({CO2_PER_KM[v]} kg/km)
              </label>
            ))}
          </div>
        </div>

        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={isUploading || isCalculating}
          style={{ display: "block", margin: "20px auto" }}
        />

        {isUploading && (
          <div style={{ textAlign: "center" }}>
            <div className="spinner"></div>
            <p>Reading file...</p>
          </div>
        )}

        {data.length > 0 && !isCalculating && (
          <div className="validation">
            <p>
              <strong>Rows:</strong> {data.length}
            </p>
            <p>
              <strong>Free:</strong> 10
            </p>
            <p>
              <strong>Paid:</strong> {paidRows}
            </p>
            {needed > 0 ? (
              <>
                <p style={{ color: "#d63384", fontWeight: "bold" }}>
                  Need {needed} more rows
                </p>
                {paypalForm}
              </>
            ) : (
              <button
                onClick={calculate}
                className="btn primary"
                disabled={isCalculating}
              >
                Calculate Now
              </button>
            )}
          </div>
        )}

        {isCalculating && (
          <div style={{ textAlign: "center" }}>
            <div className="spinner"></div>
            <p>Calculating...</p>
          </div>
        )}

        {/* RESULTS */}
        {results.length > 0 && !isCalculating && (
          <>
            <div className="co2-saved-badge">
              <div className="badge-content">
                <span className="leaf-icon">Leaf</span>
                <div className="badge-text">
                  <strong>{totalCO2Saved} kg</strong> CO₂ saved
                  <p>
                    = <strong>{totalTrees} trees</strong> planted
                  </p>
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              <button onClick={download} className="btn success">
                Download Excel
              </button>
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer>
        <p>
          © 2025 Distances in Bulk • <Link to="/about">About</Link> •{" "}
          <Link to="/contact">Contact</Link> • <Link to="/docs">Help</Link>
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
    </Router>
  );
}
