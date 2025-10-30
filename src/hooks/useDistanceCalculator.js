import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const GEOAPIFY_API_KEY = process.env.REACT_APP_GEOAPIFY_KEY;

export default function useDistanceCalculator() {
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);
  const [validation, setValidation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  const clean = (str) => (str || "").replace(/[<>&"'/]/g, "").trim();

  const handleFile = (file) => {
    if (!file) return;
    if (![".xlsx", ".csv"].some((ext) => file.name.endsWith(ext))) {
      setError("Only .xlsx or .csv");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Max 10 MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(
      () => setUploadProgress((p) => (p >= 100 ? 100 : p + 10)),
      100
    );

    const reader = new FileReader();
    reader.onload = (e) => {
      const bstr = e.target.result;
      let json = [];

      if (file.name.endsWith(".csv")) {
        json = Papa.parse(new TextDecoder().decode(new Uint8Array(bstr)), {
          header: true,
          skipEmptyLines: true,
        }).data;
      } else {
        const wb = XLSX.read(bstr, { type: "binary" });
        json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      }

      const safe = json.map((r) => ({ From: clean(r.From), To: clean(r.To) }));
      setData(safe);
      validate(safe);
      clearInterval(interval);
      setIsUploading(false);
    };

    file.name.endsWith(".csv")
      ? reader.readAsArrayBuffer(file)
      : reader.readAsBinaryString(file);
  };

  const validate = (rows) => {
    const dupes = rows
      .filter(
        (r, i) =>
          rows.findIndex(
            (x, j) => j !== i && x.From === r.From && x.To === r.To
          ) !== -1
      )
      .map((d) => `${d.From} - ${d.To}`);
    setValidation({ duplicates: [...new Set(dupes)] });
  };

  const geocode = async (addr) => {
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        addr
      )}&apiKey=${GEOAPIFY_API_KEY}`;
      const r = await fetch(url);
      if (!r.ok) return null;
      const j = await r.json();
      const c = j.features?.[0]?.geometry?.coordinates;
      return c ? { lat: c[1], lon: c[0] } : null;
    } catch {
      return null;
    }
  };

  const calculate = async (paidRows) => {
    if (data.length > 10 + paidRows) return setError("Need more rows");
    setIsCalculating(true);
    setError("");
    const out = [];

    for (const row of data) {
      const from = await geocode(row.From);
      const to = await geocode(row.To);
      if (from && to) {
        const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const json = await resp.json();
          const km = json.features?.[0]?.properties?.distance
            ? (json.features[0].properties.distance / 1000).toFixed(2)
            : "No route";
          out.push({ ...row, Distance: `${km} km` });
        } else out.push({ ...row, Distance: "Error" });
      } else out.push({ ...row, Distance: "Geocode failed" });
    }
    setResults(out);
    setIsCalculating(false);
  };

  const download = () => {
    if (!results.length) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "calculated_distances.xlsx");
  };

  return {
    data,
    results,
    validation,
    isUploading,
    isCalculating,
    uploadProgress,
    error,
    handleFile,
    calculate,
    download,
  };
}
