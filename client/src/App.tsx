import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let timer: number | undefined;
    if (loading) {
      const start = Date.now();
      timer = window.setInterval(() => {
        setElapsed(((Date.now() - start) / 1000).toFixed(1));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setError("");
    setLoading(true);
    setCsv("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Server error: ${res.statusText}`);

      const text = await res.text();
      setCsv(text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form">
        <h1>Bank Statement Parser</h1>
        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Upload & Parse"}
          </button>
        </form>

        {loading && (
          <p>
            ⏱️ Elapsed: <span>{elapsed}s</span>
          </p>
        )}
        {!loading && csv && parseFloat(elapsed) >= 0 && <p>✅ Completed in {elapsed}s</p>}

        {error && <p className="error">❌ {error}</p>}
        {csv && (
          <>
            <h3>Extracted CSV:</h3>
            <pre className="csv-box">{csv}</pre>
            <button
              onClick={() => {
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "transactions.csv";
                a.click();
              }}
            >
              Download CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
