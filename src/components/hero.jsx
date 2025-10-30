export default function Hero() {
    const scrollToUpload = () => {
      document
        .getElementById("upload-section")
        ?.scrollIntoView({ behavior: "smooth" });
    };
  
    return (
      <header
        className="hero"
        style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "#f1f3f5",
          color: "#1a1a1a",
        }}
      >
        <h1 style={{ color: "#2c3e50", fontSize: "2.4em", marginBottom: "16px" }}>
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
          Stop wasting hours on Google Maps. Upload your file and calculate{" "}
          <strong>thousands of driving distances in seconds</strong>.
          <strong style={{ color: "#d63384" }}>Free for the first 10 rows</strong>
          .
        </p>
        <button
          onClick={scrollToUpload}
          style={{
            fontSize: "1.2em",
            padding: "14px 32px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Start Calculating Now
        </button>
        <p style={{ marginTop: "15px", color: "#555", fontSize: "1em" }}>
          Used by 5,000+ businesses • 4.9/5 from 127 reviews
        </p>
      </header>
    );
  }
