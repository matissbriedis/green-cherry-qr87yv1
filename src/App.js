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
      <header className="hero">
        <h1>Bulk Distance Calculator – Free Excel & CSV Tool</h1>
        <p>Calculate thousands of distances in seconds. Free for 10 rows.</p>
        <button
          className="cta-button"
          onClick={() =>
            document.getElementById("upload-section")?.scrollIntoView()
          }
        >
          Start Now
        </button>
      </header>

      <section id="upload-section" className="upload-section">
        <h2>Upload Your File</h2>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        {isUploading && (
          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {validation && (
          <div className="validation-result">
            <h3>Validation Result</h3>
            {error ? (
              <p style={{ color: "red" }}>{error}</p>
            ) : (
              <div>
                <p>Rows: {data.length}</p>
                <p>Duplicates: {validation.duplicates.length || "None"}</p>
                <p>Price: {validation.price}</p>

                {data.length > 10 + paidRows ? (
                  <div style={{ margin: "20px 0", textAlign: "center" }}>
                    <p style={{ color: "red", fontWeight: "bold" }}>
                      Buy more rows
                    </p>
                    <div id="paypal-container-SZHCMQ36L2RAU"></div>
                  </div>
                ) : (
                  <button
                    className="cta-button"
                    onClick={calculateDistances}
                    disabled={isCalculating}
                  >
                    Calculate
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
            style={{ marginTop: "15px" }}
          >
            Download Results
          </button>
        )}
        <button
          className="cta-button"
          onClick={handleDownloadTemplate}
          style={{ marginTop: "15px" }}
        >
          Download Template
        </button>
      </section>

      <section className="pricing">
        <h2>Pricing</h2>
        <table>
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
              <td>$0.10</td>
            </tr>
            <tr>
              <td>
                Buy 50 rows{" "}
                <div
                  id="paypal-container-SZHCMQ36L2RAU-pricing"
                  style={{ marginTop: "8px" }}
                ></div>
              </td>
              <td>$5.00</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer>
        <p>
          Made with care •{" "}
          <a href="https://docs.distance.tools">Documentation</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
