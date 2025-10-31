// src/pages/DocsPage.js
import React from "react";
import { Link } from "react-router-dom";

export default function DocsPage() {
  return (
    <div className="container">
      <div className="content" style={{ marginTop: "60px" }}>
        <h1>Help & Documentation</h1>

        <h3>How to Use</h3>
        <ol>
          <li>
            Download the{" "}
            <a href="/distance_template.xlsx" download>
              free template
            </a>
          </li>
          <li>
            Fill columns: <code>From</code> and <code>To</code> (addresses,
            cities, postcodes)
          </li>
          <li>Upload your Excel or CSV file</li>
          <li>Select vehicle type</li>
          <li>Click "Calculate Now"</li>
          <li>Download results with distances + CO₂</li>
        </ol>

        <h3>File Format</h3>
        <p>
          First row must be headers: <code>From</code>, <code>To</code>
        </p>

        <h3>Example</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            margin: "20px 0",
          }}
        >
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>
                From
              </th>
              <th style={{ border: "1px solid #ddd", padding: "10px" }}>To</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                Riga, Latvia
              </td>
              <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                Vilnius, Lithuania
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ textAlign: "center", marginTop: "40px" }}>
          <Link
            to="/"
            className="btn primary"
            style={{ display: "inline-block" }}
          >
            Back to Calculator
          </Link>
        </p>
      </div>

      <footer style={{ marginTop: "80px", textAlign: "center" }}>
        <p>
          © 2025 Distances in Bulk • <Link to="/contact">Contact</Link>
        </p>
      </footer>
    </div>
  );
}
