// src/pages/AboutPage.js
import React from "react";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="container">
      <div className="content" style={{ marginTop: "60px" }}>
        <h1>About Us</h1>
        <p>
          Hi, I’m <strong>Matīss Briedis</strong> — a logistics professional
          with over 10 years of experience.
        </p>
        <p>
          I needed a <strong>simple, fast, and cheap way</strong> to calculate
          thousands of driving distances and CO₂ emissions. Nothing existed — so
          I built it.
        </p>
        <p>
          <strong>Distances in Bulk</strong> is that solution: upload Excel/CSV,
          get distances + carbon footprint in seconds. First 10 rows free.
        </p>

        <div style={{ textAlign: "center", margin: "40px 0" }}>
          <div
            style={{
              width: "140px",
              height: "140px",
              background: "#007bff",
              color: "white",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "2.5em",
              fontWeight: "bold",
            }}
          >
            M
          </div>
          <p style={{ fontWeight: 600 }}>Matīss Briedis</p>
          <p style={{ color: "#666" }}>Founder</p>
        </div>

        <p style={{ textAlign: "center" }}>
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
