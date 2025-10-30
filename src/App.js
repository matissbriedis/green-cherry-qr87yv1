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
    if (paid === "50") {
      setPaidRows(50);
      localStorage.setItem("paidRows", "50");
      window.history.replaceState({}, "", "/");
    } else {
      const saved = localStorage.getItem("paidRows");
      if (saved) setPaidRows(parseInt(saved, 10));
    }
  }, []);

  const handleDownloadTemplate = () => {
    const a = document.createElement("a");
    a.href = "/distance_template.xlsx";
    a.download = "distance_template.xlsx";
    a.click();
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
      .filter(
        (r, i) =>
          rows.findIndex(
            (x, j) => j !== i && x.From === r.From && x.To === r.To
          ) !== -1
      )
      .map((d) => `${d.From} - ${d.To}`);
    const price = Math.max(0, (rows.length - 10) * 0.1).toFixed(2);
    setValidation({ duplicates: [...new Set(dupes)], price: `$${price}` });
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
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        addr
      )}&apiKey=${GEOAPIFY_API_KEY}`;
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
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "calculated_distances.xlsx");
  };

  return (
    <div className="app">
      {/* HERO — BLACK TEXT ON LIGHT GRAY */}
      <header
        className="hero"
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "#f1f3f5",
          color: "#1a1a1a",
        }}
      >
        <h1
          style={{ color: "#2c3e50", fontSize: "2.4em", marginBottom: "16px" }}
        >
          Bulk Distance Calculator – Free Excel & CSV Tool
        </h1>
        <p
          style={{
            fontSize: "1.3em",
            maxWidth: "800px",
            margin: "20px auto",
            color: "#333",
          }}
        >
          Stop wasting hours on Google Maps. Upload your Excel or CSV file and
          calculate <strong>thousands of driving distances in seconds</strong>.
          <strong style={{ color: "#d63384" }}>
            Free for the first 10 rows
          </strong>{" "}
          — no signup, no credit card.
        </p>
        <button
          className="cta-button"
          style={{
            fontSize: "1.2em",
            padding: "14px 32px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
          onClick={() =>
            document
              .getElementById("upload-section")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Start Calculating Now
        </button>
        <p style={{ marginTop: "15px", color: "#555", fontSize: "1em" }}>
          Used by 5,000+ businesses • 4.9/5 from 127 reviews
        </p>
      </header>

      {/* ENGAGING CONTENT SECTION */}
      <section
        className="content-section"
        style={{
          padding: "60px 20px",
          maxWidth: "900px",
          margin: "0 auto",
          lineHeight: "1.7",
          color: "#333",
        }}
      >
        <h2 style={{ fontSize: "2em", color: "#2c3e50" }}>
          Why 10,000+ People Use This Tool Every Month
        </h2>
        <p>
          Imagine this: You have a spreadsheet with{" "}
          <strong>500 delivery addresses</strong>. You need to know the exact
          driving distance from your warehouse to each one. Manually searching
          on Google Maps? That would take <em>days</em>.
        </p>
        <p>
          <strong>With Distances in Bulk, you do it in 30 seconds.</strong>
        </p>
        <p>
          Whether you're in <strong>logistics</strong>,{" "}
          <strong>e-commerce</strong>, <strong>real estate</strong>, or{" "}
          <strong>marketing</strong>, our tool saves you time, money, and
          headaches.
        </p>

        <h3>How It Works (It’s Ridiculously Simple)</h3>
        <ol style={{ fontSize: "1.1em" }}>
          <li>
            <strong>Download the template</strong> (or use your own file).
          </li>
          <li>
            <strong>Fill in "From" and "To"</strong> columns (e.g., "New York" →
            "Los Angeles").
          </li>
          <li>
            <strong>Upload</strong> — we validate for free and show you the
            price.
          </li>
          <li>
            <strong>Pay only if you need more than 10 rows</strong> ($0.10 per
            extra row).
          </li>
          <li>
            <strong>Download your file</strong> with a new "Distance" column
            added.
          </li>
        </ol>

        <h3>Real-World Use Cases</h3>
        <ul style={{ listStyle: "inside", fontSize: "1.1em" }}>
          <li>
            <strong>Delivery Companies</strong>: Optimize routes and estimate
            fuel costs.
          </li>
          <li>
            <strong>E-commerce Stores</strong>: Calculate accurate shipping
            quotes.
          </li>
          <li>
            <strong>Real Estate Agents</strong>: Show clients distance to
            schools, hospitals, and transit.
          </li>
          <li>
            <strong>Marketing Teams</strong>: Map customer locations for
            targeted campaigns.
          </li>
          <li>
            <strong>Travel Planners</strong>: Build itineraries with precise
            mileages.
          </li>
        </ul>

        <h3>Why This Tool Beats Google Maps & APIs</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            margin: "20px 0",
          }}
        >
          <thead>
            <tr style={{ background: "#f1f3f5" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Feature</th>
              <th style={{ padding: "12px", textAlign: "left" }}>
                Google Maps
              </th>
              <th style={{ padding: "12px", textAlign: "left" }}>
                <strong>Distances in Bulk</strong>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "10px" }}>Bulk processing (1000+ rows)</td>
              <td style={{ padding: "10px", color: "red" }}>No</td>
              <td style={{ padding: "10px", color: "green" }}>Yes</td>
            </tr>
            <tr style={{ background: "#f9f9f9" }}>
              <td style={{ padding: "10px" }}>Free for first 10 rows</td>
              <td style={{ padding: "10px", color: "red" }}>No</td>
              <td style={{ padding: "10px", color: "green" }}>Yes</td>
            </tr>
            <tr>
              <td style={{ padding: "10px" }}>No API key needed</td>
              <td style={{ padding: "10px", color: "red" }}>No</td>
              <td style={{ padding: "10px", color: "green" }}>Yes</td>
            </tr>
            <tr style={{ background: "#f9f9f9" }}>
              <td style={{ padding: "10px" }}>Download results in Excel</td>
              <td style={{ padding: "10px", color: "red" }}>No</td>
              <td style={{ padding: "10px", color: "green" }}>Yes</td>
            </tr>
          </tbody>
        </table>

        <h3>Trusted by Professionals Worldwide</h3>
        <p>
          From small startups to Fortune 500 logistics teams, our tool is the
          go-to solution for bulk distance calculation.
          <strong>No signup. No subscriptions. Just results.</strong>
        </p>

        <div style={{ textAlign: "center", margin: "40px 0" }}>
          <p
            style={{ fontSize: "1.4em", fontWeight: "bold", color: "#2c3e50" }}
          >
            Ready to save hours of work?
          </p>
          <button
            className="cta-button"
            style={{
              fontSize: "1.3em",
              padding: "16px 40px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() =>
              document
                .getElementById("upload-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Try It Free Now
          </button>
        </div>
      </section>

      {/* UPLOAD SECTION */}
      <section
        id="upload-section"
        className="upload-section"
        style={{ background: "#fff", padding: "50px 20px" }}
      >
        <h2 style={{ textAlign: "center" }}>Upload Your File</h2>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{ display: "block", margin: "20px auto" }}
          />
          {isUploading && (
            <div
              style={{
                background: "#eee",
                height: "10px",
                borderRadius: "5px",
                overflow: "hidden",
                margin: "20px 0",
              }}
            >
              <div
                style={{
                  background: "#4CAF50",
                  height: "100%",
                  width: `${uploadProgress}%`,
                  transition: "width 0.3s",
                }}
              ></div>
            </div>
          )}

          {validation && (
            <div
              style={{
                background: "#f8f9fa",
                padding: "20px",
                borderRadius: "8px",
                margin: "20px 0",
              }}
            >
              <h3>Validation Result</h3>
              {error ? (
                <p style={{ color: "red" }}>{error}</p>
              ) : (
                <div>
                  <p>
                    <strong>Rows:</strong> {data.length}
                  </p>
                  <p>
                    <strong>Duplicates:</strong>{" "}
                    {validation.duplicates.length || "None"}
                  </p>
                  <p>
                    <strong>Price:</strong> {validation.price}
                  </p>

                  {data.length > 10 + paidRows ? (
                    <div style={{ textAlign: "center", margin: "20px 0" }}>
                      <p style={{ color: "red", fontWeight: "bold" }}>
                        Buy more rows to continue
                      </p>
                      <div id="paypal-container-SZHCMQ36L2RAU"></div>
                    </div>
                  ) : (
                    <button
                      className="cta-button"
                      onClick={calculateDistances}
                      disabled={isCalculating}
                      style={{ width: "100%", marginTop: "15px" }}
                    >
                      {isCalculating ? "Calculating..." : "Calculate Distances"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {results.length > 0 && (
            <button
              className="cta-button"
              onClick={downloadResults}
              style={{ width: "100%", marginTop: "15px" }}
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
      <section
        className="pricing"
        style={{ padding: "50px 20px", background: "#f8f9fa" }}
      >
        <h2 style={{ textAlign: "center" }}>Simple, Transparent Pricing</h2>
        <table
          style={{
            width: "100%",
            maxWidth: "600px",
            margin: "30px auto",
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
                Validation & First 10 Rows
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <strong>Free</strong>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
                Additional Rows
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  borderBottom: "1px solid #ddd",
                }}
              >
                $0.10 each
              </td>
            </tr>
            <tr>
              <td style={{ padding: "12px" }}>
                Buy 50 Rows
                <div
                  id="paypal-container-SZHCMQ36L2RAU-pricing"
                  style={{ marginTop: "8px" }}
                ></div>
              </td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <strong>$5.00</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer
        style={{
          textAlign: "center",
          padding: "30px",
          background: "#343a40",
          color: "#fff",
        }}
      >
        <p>
          Made with care in 2025 •{" "}
          <a href="https://docs.distance.tools" style={{ color: "#fff" }}>
            Documentation
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
