// src/App.js
import React from "react";
import UploadComponent from "./UploadComponent";
import "./Landing.css";

function App() {
  return (
    <div className="app">
      <header className="hero">
        <h1>
          Excel, XLSX, CSV, Google Drive & Spreadsheet Bulk Distance Calculation
        </h1>
        <p>
          Calculate distances between locations in bulk. First 10 rows free, buy
          more as needed!
        </p>
        <button
          className="cta-button"
          onClick={() =>
            document.getElementById("upload-section").scrollIntoView()
          }
        >
          Start Now
        </button>
      </header>

      <section className="features">
        <h2>Features You Love</h2>
        <ul>
          <li>
            Supports countries, cities, regions, postal addresses, postcodes,
            airport codes (IATA), what3words, coordinates.
          </li>
          <li>
            Output: Airline distance, driving distance/duration, time
            difference, bearing, compass direction.
          </li>
          <li>Free input validation (duplicates & fault detection).</li>
          <li>No sign-up required—pay per use with PayPal.</li>
        </ul>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <ol>
          <li>Download the template or use your own XLSX/CSV/Google Sheet.</li>
          <li>
            Upload your file for free validation (detects issues, shows price).
          </li>
          <li>Buy rows via PayPal if needed (first 10 free).</li>
          <li>
            Receive full results by email (with distances added to your sheet).
          </li>
        </ol>
      </section>

      <section id="upload-section" className="upload-section">
        <h2>Upload Your File</h2>
        <UploadComponent />
      </section>

      <section className="pricing">
        <h2>Pricing</h2>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Validation (duplicates & faults)</td>
              <td>Free</td>
            </tr>
            <tr>
              <td>Additional Rows (per row, after 10 free)</td>
              <td>$0.10</td>
            </tr>
            <tr>
              <td>Buy 50 Rows</td>
              <td>$5.00</td>
            </tr>
            <tr>
              <td>Buy 100 Rows</td>
              <td>$9.00</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer>
        <p>
          Questions? Check{" "}
          <a href="https://docs.distance.tools/tools/spreadsheet">
            documentation
          </a>{" "}
          or contact us.
        </p>
      </footer>
    </div>
  );
}

export default App;
