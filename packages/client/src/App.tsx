import { useState, useEffect } from "react";
import type { ApiResponse, HealthResponse } from "shared";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: ApiResponse<HealthResponse>) => {
        if (data.success && data.data) {
          setHealth(data.data);
        } else {
          setError(data.message || "Unknown error");
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>MiFix</h1>
      <p>Fixed Asset Management System</p>
      <hr />
      <h2>API Health Check</h2>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {health && (
        <div>
          <p>Status: {health.status}</p>
          <p>Timestamp: {health.timestamp}</p>
        </div>
      )}
      {!health && !error && <p>Loading...</p>}
    </div>
  );
}

export default App;
