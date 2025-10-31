// src/pages/ContactPage.js
import React from "react";
import { Link } from "react-router-dom";

export default function ContactPage() {
  return (
    <div className="container">
      <div className="content" style={{ marginTop: "60px" }}>
        <h1>Contact Us</h1>
        <p>Questions? Feedback? Need help with large files?</p>
        <p>Email me directly:</p>

        <div
          style={{
            background: "#f1f3f5",
            padding: "25px",
            borderRadius: "12px",
            textAlign: "center",
            margin: "25px 0",
          }}
        >
          <p style={{ fontSize: "1.3em" }}>
            <a
              href="mailto:matissbriedis90@gmail.com"
              style={{ color: "#007bff", textDecoration: "none" }}
            >
              matissbriedis90@gmail.com
            </a>
          </p>
          <p style={{ color: "#555" }}>Matīss Briedis</p>
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
          © 2025 Distances in Bulk • <Link to="/about">About</Link>
        </p>
      </footer>
    </div>
  );
}
