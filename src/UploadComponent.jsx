// src/UploadComponent.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { useTranslation } from "react-i18next";
import "./i18n";
import "./UploadComponent.css";
import { PayPalButtons } from "@paypal/react-paypal-js";

const GEOAPIFY_API_KEY = "7da23bd96a564a17b6fc360f35c5177e";

function UploadComponent() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState("en");
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);
  const [validation, setValidation] = useState(null); // { duplicates: [], faults: [], price: 0.1 * (data.length - 10) }
  const [darkMode, setDarkMode] = useState(false);
  const [credits, setCredits] = useState(10); // Start with 10 free rows
  const [error, setError] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [uploadMethod, setUploadMethod] = useState("local");

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          validateData(results.data);
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

  const handleSheetUrlSubmit = async (e) => {
    e.preventDefault();
    if (!sheetUrl) return;

    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      setError(
        "Invalid Google Sheets URL. Use a valid public sheet link (e.g., https://docs.google.com/spreadsheets/d/[ID]/edit)."
      );
      return;
    }

    const sheetId = sheetIdMatch[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    try {
      const response = await fetch(csvUrl);
      if (!response.ok)
        throw new Error(
          "Failed to fetch. Ensure the sheet is published to web as CSV."
        );
      const csvText = await response.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          validateData(results.data);
        },
      });
      setError("");
    } catch (err) {
      setError("Error fetching Google Sheet: " + err.message);
    }
  };

  const geocode = async (address) => {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      address
    )}&apiKey=${GEOAPIFY_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.features?.[0]?.geometry?.coordinates
      ? {
          lat: data.features[0].geometry.coordinates[1],
          lon: data.features[0].geometry.coordinates[0],
        }
      : null;
  };

  const calculateDistances = async () => {
    if (!validation || data.length > credits) {
      setError(
        `You need ${validation ? validation.price : 0} credits. Buy more rows!`
      );
      return;
    }

    const calculated = [];
    for (const row of data) {
      const from = await geocode(row.From);
      const to = await geocode(row.To);

      if (from && to) {
        const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
        const response = await fetch(url);
        const result = await response.json();
        calculated.push({
          ...row,
          Distance: result.features?.[0]?.properties?.distance
            ? `${(result.features[0].properties.distance / 1000).toFixed(2)} km`
            : "Error",
        });
      } else {
        calculated.push({ ...row, Distance: "Geocode failed" });
      }
    }
    setResults(calculated);
    setCredits(credits - data.length); // Deduct used rows
    setValidation(null); // Reset validation after calculation
  };

  const downloadResults = () => {
    if (!results.length) return;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "calculated_distances.xlsx");
  };

  const buyRows = (rows, amount) => {
    return (
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={(data, actions) =>
          actions.order.create({
            purchase_units: [
              { amount: { value: amount.toFixed(2), currency_code: "USD" } },
            ],
          })
        }
        onApprove={(data, actions) => {
          actions.order.capture().then(() => {
            setCredits(credits + rows);
            alert(`Purchased ${rows} rows! New total: ${credits + rows}`);
          });
        }}
      />
    );
  };

  return (
    <div className={`container ${darkMode ? "dark" : "light"}`}>
      <div className="header-controls">
        <button
          onClick={() => setDarkMode((prev) => !prev)}
          className={`theme-toggle ${darkMode ? "dark" : "light"}`}
          title={t("toggle_theme")}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="language-section">
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
          <option value="lv">Latviešu</option>
          <option value="et">Eesti</option>
          <option value="lt">Lietuvių</option>
          <option value="pl">Polski</option>
          <option value="sv">Svenska</option>
          <option value="no">Norsk</option>
          <option value="da">Dansk</option>
          <option value="fi">Suomi</option>
        </select>
      </div>

      <div className="upload-section">
        <div className="upload-method-toggle">
          <button
            onClick={() => {
              setUploadMethod("local");
              setData([]);
            }}
            className={`method-btn ${uploadMethod === "local" ? "active" : ""}`}
          >
            Local File
          </button>
          <button
            onClick={() => {
              setUploadMethod("sheets");
              setData([]);
              setSheetUrl("");
            }}
            className={`method-btn ${
              uploadMethod === "sheets" ? "active" : ""
            }`}
          >
            Google Sheets URL
          </button>
        </div>

        {uploadMethod === "local" ? (
          <div className="file-input">
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileUpload}
            />
          </div>
        ) : (
          <form onSubmit={handleSheetUrlSubmit} className="sheet-input">
            <input
              type="url"
              placeholder="Paste Google Sheets URL (e.g., https://docs.google.com/spreadsheets/d/[ID]/edit)"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="sheet-url-input"
            />
            <button type="submit" className="auth-button">
              Load Sheet
            </button>
          </form>
        )}
      </div>

      {validation && (
        <div className="validation-summary">
          <h3>Validation Results</h3>
          {validation.duplicates.length > 0 && (
            <p>Duplicates found: {validation.duplicates.join(", ")}</p>
          )}
          {validation.faults > 0 && (
            <p>Faults (missing From/To): {validation.faults}</p>
          )}
          <p>
            Total rows: {data.length} | Additional cost: ${validation.price}{" "}
            (first 10 free)
          </p>
          {validation.price > 0 && (
            <div>
              <p>Buy more rows:</p>
              {buyRows(50, 5.0)}
              {buyRows(100, 9.0)}
            </div>
          )}
        </div>
      )}

      <div className="action-buttons">
        <a href="/distance_template.xlsx" download className="auth-button">
          {t("download_template")}
        </a>
        {data.length > 0 && validation && validation.price <= 0 && (
          <button
            onClick={calculateDistances}
            className="auth-button calculate"
          >
            {t("calculate")}
          </button>
        )}
        {results.length > 0 && (
          <button onClick={downloadResults} className="auth-button download">
            {t("download_results")}
          </button>
        )}
      </div>
    </div>
  );
}

export default UploadComponent;
