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
  const { t } = useTranslation();
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
    // i18n.changeLanguage(lang); // Moved to App.js
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
    if (address && address.startsWith("///")) {
      // what3words format (e.g., ///index.home.raft)
      const w3wUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        address
      )}&apiKey=${GEOAPIFY_API_KEY}&type=what3words`;
      const response = await fetch(w3wUrl);
      const data = await response.json();
      return data.features?.[0]?.geometry?.coordinates
        ? {
            lat: data.features[0].geometry.coordinates[1],
            lon: data.features[0].geometry.coordinates[0],
          }
        : null;
    } else {
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
    }
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
        // Driving distance and duration
        const driveUrl = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
        const driveResponse = await fetch(driveUrl);
        const driveData = await driveResponse.json();
        const driveDistance = driveData.features?.[0]?.properties?.distance
          ? `${(driveData.features[0].properties.distance / 1000).toFixed(
              2
            )} km`
          : "Error";
        const driveDuration = driveData.features?.[0]?.properties?.time
          ? `${(driveData.features[0].properties.time / 60).toFixed(0)} min`
          : "Error";

        // Straight-line (airline) distance
        const straightUrl = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=straight&apiKey=${GEOAPIFY_API_KEY}`;
        const straightResponse = await fetch(straightUrl);
        const straightData = await straightResponse.json();
        const airlineDistance = straightData.features?.[0]?.properties?.distance
          ? `${(straightData.features[0].properties.distance / 1000).toFixed(
              2
            )} km`
          : "Error";

        // Bearing and compass direction
        const lat1 = (from.lat * Math.PI) / 180;
        const lat2 = (to.lat * Math.PI) / 180;
        const lon1 = (from.lon * Math.PI) / 180;
        const lon2 = (to.lon * Math.PI) / 180;
        const deltaLon = lon2 - lon1;
        const y = Math.sin(deltaLon) * Math.cos(lat2);
        const x =
          Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
        const bearing = (Math.atan2(y, x) * 180) / Math.PI;
        const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
          Math.round((bearing % 360) / 45) % 8
        ];

        // Time difference (placeholder, requires timezone API)
        const timeDiff = "N/A";

        calculated.push({
          ...row,
          "Driving Distance": driveDistance,
          "Driving Duration": driveDuration,
          "Airline Distance": airlineDistance,
          Bearing: `${bearing.toFixed(1)}°`,
          Compass: compass,
          "Time Difference": timeDiff,
        });
      } else {
        calculated.push({ ...row, "Driving Distance": "Geocode failed" });
      }
    }
    setResults(calculated);
    setCredits(credits - data.length);
    setValidation(null);
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

      {results.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>{t("from")}</th>
              <th>{t("to")}</th>
              <th>{t("driving_distance")}</th>
              <th>{t("driving_duration")}</th>
              <th>{t("airline_distance")}</th>
              <th>{t("bearing")}</th>
              <th>{t("compass")}</th>
              <th>{t("time_difference")}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={index}>
                <td>{row.From}</td>
                <td>{row.To}</td>
                <td>{row["Driving Distance"]}</td>
                <td>{row["Driving Duration"]}</td>
                <td>{row["Airline Distance"]}</td>
                <td>{row.Bearing}</td>
                <td>{row.Compass}</td>
                <td>{row["Time Difference"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UploadComponent;
