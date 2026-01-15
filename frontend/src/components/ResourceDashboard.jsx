import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// connect to backend socket
const socket = io(
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
);

export default function ResourceDashboard() {
  const [resources, setResources] = useState([]);

  // initial fetch
  useEffect(() => {
    fetch("http://localhost:3000/api/resources")
      .then(res => res.json())
      .then(data => setResources(data))
      .catch(err => console.error("Resource fetch error:", err));
  }, []);

  // realtime updates
  useEffect(() => {
    socket.on("resourceUpdated", (updatedResource) => {
      setResources(prev => {
        const exists = prev.find(r => r._id === updatedResource._id);
        if (exists) {
          return prev.map(r =>
            r._id === updatedResource._id ? updatedResource : r
          );
        }
        return [updatedResource, ...prev];
      });
    });

    return () => socket.off("resourceUpdated");
  }, []);

  const statusColor = (status) => {
    if (status === "Available") return "#22c55e";
    if (status === "Deployed") return "#f59e0b";
    return "#ef4444";
  };

  const updateStatus = async (id, status) => {
    await fetch(`http://localhost:3000/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 16 }}>Response Capabilities</h2>

      {resources.length === 0 && (
        <p style={{ color: "#888" }}>No resources available</p>
      )}

      {resources.map(resource => (
        <div
          key={resource._id}
          style={{
            border: "1px solid #333",
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
            background: "#111"
          }}
        >
          <div style={{ fontSize: 16, fontWeight: "600" }}>
            {resource.capability}
          </div>

          <div style={{ fontSize: 14, color: "#aaa" }}>
            {resource.domain}
          </div>

          <div
            style={{
              marginTop: 8,
              fontWeight: "bold",
              color: statusColor(resource.status)
            }}
          >
            {resource.status}
          </div>

          <select
            value={resource.status}
            onChange={(e) =>
              updateStatus(resource._id, e.target.value)
            }
            style={{
              marginTop: 10,
              padding: 6,
              background: "#000",
              color: "#fff",
              border: "1px solid #444"
            }}
          >
            <option value="Available">Available</option>
            <option value="Deployed">Deployed</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>
      ))}
    </div>
  );
}
