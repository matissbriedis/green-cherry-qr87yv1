import { useState } from "react";

export default function UploadSection({
  onFileUpload,
  isUploading,
  uploadProgress,
  children,
}) {
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      onFileUpload(f);
    }
  };

  return (
    <section
      id="upload-section"
      style={{ background: "#fff", padding: "50px 20px" }}
    >
      <h2 style={{ textAlign: "center" }}>Upload Your File</h2>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleChange}
          disabled={isUploading}
          style={{ display: "block", margin: "20px auto" }}
        />

        {isUploading && (
          <>
            <div style={{ textAlign: "center", margin: "30px 0" }}>
              <div
                style={{
                  display: "inline-block",
                  width: "40px",
                  height: "40px",
                  border: "4px solid #f3f3f3",
                  borderTop: "4px solid #007bff",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              <p style={{ marginTop: "10px", color: "#555" }}>
                Uploading & validating...
              </p>
            </div>
            <div
              style={{
                background: "#eee",
                height: "6px",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "#4CAF50",
                  height: "100%",
                  width: `${uploadProgress}%`,
                  transition: "width 0.3s",
                }}
              ></div>
            </div>
          </>
        )}

        {children}
      </div>
    </section>
  );
}
