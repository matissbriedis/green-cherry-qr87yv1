// src/UploadComponent.jsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { useTranslation } from "react-i18next";
import "./i18n";
import "./UploadComponent.css";
import {
  auth,
  provider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "./firebase";
import { PayPalButtons } from "@paypal/react-paypal-js";

const GEOAPIFY_API_KEY = "7da23bd96a564a17b6fc360f35c5177e";

function UploadComponent() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState("en");
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [uploadMethod, setUploadMethod] = useState("local"); // "local" or "sheets"

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleLogin = async (method) => {
    try {
      if (method === "google") {
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);
        console.log("Signed in:", result.user.displayName);
        alert("Signed in successfully!");
      } else if (method === "email") {
        const result = await signInWithEmailAndPassword(auth, email, password);
        setUser(result.user);
        console.log("Signed in:", result.user.email);
        alert("Signed in successfully!");
        setEmail("");
        setPassword("");
        setError("");
      }
    } catch (error) {
      console.error("Login error:", error.message);
      setError(error.message);
      alert("Login failed: " + error.message);
    }
  };

  const handleSignup = async () => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(result.user);
      console.log("Signed up:", result.user.email);
      alert("Signed up successfully! You can now log in.");
      setEmail("");
      setPassword("");
      setError("");
    } catch (error) {
      console.error("Signup error:", error.message);
      setError(error.message);
      alert("Signup failed: " + error.message);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => setData(results.data),
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
      };
      reader.readAsBinaryString(file);
    }
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
        complete: (results) => setData(results.data),
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
    const limitedData = user || paymentCompleted ? data : data.slice(0, 10);
    const calculated = [];

    for (const row of limitedData) {
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
  };

  const downloadResults = () => {
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "calculated_distances.xlsx");
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

      <div className="auth-section">
        {user ? (
          <button onClick={handleLogout} className="auth-button">
            👤 {user.email || user.displayName}
          </button>
        ) : (
          <div className="auth-form">
            <button
              onClick={() => handleLogin("google")}
              className="auth-button"
            >
              Sign In/Sign Up
            </button>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
            <button
              onClick={() => handleLogin("email")}
              className="auth-button"
            >
              Sign in with Email
            </button>
            <button onClick={handleSignup} className="auth-button signup">
              Sign up
            </button>
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <h2>{t("title")}</h2>

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

      <div className="action-buttons">
        <a href="/distance_template.xlsx" download className="auth-button">
          {t("download_template")}
        </a>
        {data.length > 0 && (
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

      {!user && data.length > 10 && !paymentCompleted && (
        <div className="payment-notice">
          <p>To calculate more than 10 rows, please complete payment:</p>
          <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={(data, actions) =>
              actions.order.create({
                purchase_units: [
                  { amount: { value: (data.length * 0.1).toFixed(2) } },
                ],
              })
            }
            onApprove={(data, actions) =>
              actions.order.capture().then(() => {
                setPaymentCompleted(true);
                alert("Payment successful. You can now calculate all rows.");
              })
            }
          />
        </div>
      )}

      {results.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>{t("from")}</th>
              <th>{t("to")}</th>
              <th>{t("distance")}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={index}>
                <td>{row.From}</td>
                <td>{row.To}</td>
                <td>{row.Distance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UploadComponent;
