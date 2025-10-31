// src/pages/DocsPage.jsx
import React from "react";

const DocsPage = () => {
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        lineHeight: "1.8",
        color: "#333",
        background: "#f8f9fa",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ---------- Header ---------- */}
      <header style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            color: "#2c3e50",
            marginBottom: "10px",
          }}
        >
          Distances in Bulk – Documentation
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#555" }}>
          Quick-start guide, troubleshooting, and FAQs for the free bulk
          distance calculator.
        </p>
      </header>

      {/* ---------- Table of Contents ---------- */}
      <nav
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "40px",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            color: "#007bff",
            marginBottom: "15px",
          }}
        >
          Table of Contents
        </h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {[
            { id: "quick-start", title: "Quick Start Guide" },
            { id: "features", title: "Features & Capabilities" },
            { id: "troubleshooting", title: "Troubleshooting" },
            { id: "faq", title: "FAQ" },
            { id: "support", title: "Support & Contact" },
          ].map((item) => (
            <li key={item.id} style={{ marginBottom: "8px" }}>
              <a
                href={`#${item.id}`}
                style={{ color: "#007bff", textDecoration: "none" }}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---------- Quick Start ---------- */}
      <section id="quick-start" style={{ marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "2.2rem",
            color: "#2c3e50",
            marginBottom: "25px",
          }}
        >
          Quick Start Guide
        </h2>
        <p>
          Follow these four steps to get driving distances from your Excel/CSV
          file in under two minutes.
        </p>
        <ol style={{ fontSize: "1.1rem", margin: "20px 0" }}>
          <li>
            <strong>Prepare your file</strong> – two columns named{" "}
            <code>From</code> and <code>To</code>. Save as .xlsx or .csv.
          </li>
          <li>
            <strong>Upload</strong> – click “Upload Your File” on the homepage.
          </li>
          <li>
            <strong>Review & Pay</strong> – first 10 rows free; extra rows €0.10
            each via PayPal.
          </li>
          <li>
            <strong>Download</strong> – receive an Excel file with a new{" "}
            <code>Distance (km)</code> column.
          </li>
        </ol>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" style={{ marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "2.2rem",
            color: "#2c3e50",
            marginBottom: "25px",
          }}
        >
          Features & Capabilities
        </h2>
        <ul style={{ fontSize: "1.1rem", margin: "20px 0" }}>
          <li>Global coverage – any address, city, or postal code.</li>
          <li>Real-road routing (not straight-line).</li>
          <li>Automatic duplicate & error detection.</li>
          <li>Instant results – thousands of rows in seconds.</li>
          <li>Pay-per-row pricing – first 10 rows free.</li>
          <li>100 % private – files deleted after processing.</li>
          <li>No API key required.</li>
        </ul>
      </section>

      {/* ---------- Troubleshooting ---------- */}
      <section id="troubleshooting" style={{ marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "2.2rem",
            color: "#2c3e50",
            marginBottom: "25px",
          }}
        >
          Troubleshooting
        </h2>
        <ul style={{ fontSize: "1.1rem", margin: "20px 0" }}>
          <li>
            <strong>File won’t upload</strong> – ensure ≤ 10 MB and .xlsx/.csv.
          </li>
          <li>
            <strong>“Geocode failed”</strong> – add zip code or full street.
          </li>
          <li>
            <strong>Payment not unlocking rows</strong> – clear cache or email
            support with PayPal transaction ID.
          </li>
        </ul>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" style={{ marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "2.2rem",
            color: "#2c3e50",
            marginBottom: "25px",
          }}
        >
          Frequently Asked Questions
        </h2>

        {[
          {
            q: "How does the bulk distance calculator work?",
            a: "Upload an Excel/CSV with “From” and “To” columns. The tool geocodes each address and returns real driving distances in a new Excel file.",
          },
          {
            q: "Is the first 10 rows really free?",
            a: "Yes – 100 % free, no credit card. Extra rows cost €0.10 each via PayPal.",
          },
          {
            q: "What file formats are supported?",
            a: ".xlsx (Excel) and .csv. Use the free template for perfect formatting.",
          },
          {
            q: "Are my files secure?",
            a: "Files are processed in memory and deleted immediately after the job finishes. Nothing is stored.",
          },
          {
            q: "Can I calculate distances between countries?",
            a: "Absolutely – any location worldwide, as long as it’s reachable by road.",
          },
          {
            q: "Why not just use Google Maps?",
            a: "Google Maps caps bulk queries and requires a paid API key. Our tool has no limits and no setup.",
          },
          {
            q: "How accurate are the distances?",
            a: "We use premium routing APIs that follow real roads, one-way streets, and traffic rules – GPS-level accuracy.",
          },
          {
            q: "Do I need an API key?",
            a: "No. Everything is handled server-side.",
          },
        ].map((item, idx) => (
          <details
            key={idx}
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #eee",
              paddingBottom: "15px",
            }}
          >
            <summary
              style={{
                fontWeight: "600",
                fontSize: "1.15rem",
                cursor: "pointer",
                color: "#2c3e50",
              }}
            >
              {item.q}
            </summary>
            <p style={{ marginTop: "10px", paddingLeft: "20px" }}>{item.a}</p>
          </details>
        ))}
      </section>

      {/* ---------- Support ---------- */}
      <section id="support" style={{ marginBottom: "50px" }}>
        <h2
          style={{
            fontSize: "2.2rem",
            color: "#2c3e50",
            marginBottom: "25px",
          }}
        >
          Support & Contact
        </h2>
        <p>
          Questions? Email us at{" "}
          <a href="mailto:support@distancesinbulk.com">
            support@distancesinbulk.com
          </a>
          . We reply within 24 hours.
        </p>
      </section>

      {/* ---------- Footer ---------- */}
      <footer
        style={{
          textAlign: "center",
          padding: "30px",
          background: "#343a40",
          color: "#fff",
          marginTop: "60px",
        }}
      >
        <p>
          © 2025 Distances in Bulk •{" "}
          <a href="/" style={{ color: "#fff", textDecoration: "underline" }}>
            Back to Calculator
          </a>
        </p>
      </footer>
    </div>
  );
};

export default DocsPage;
