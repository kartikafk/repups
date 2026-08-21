import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { apiUrl } from "../config.js";

const C = {
  bg: "#080A0E", panel: "#0F1117", card: "#161B24",
  border: "#232B3A", border2: "#2D3748",
  go: "#C8FF4D", blue: "#4D9FFF", bad: "#FF4D6D",
  ink: "#EDF2FF", inkDim: "#7A8BA8", inkMuted: "#3D4F66",
};

const api = async (path, options = {}) => {
  const response = await fetch(apiUrl(`admin/${path}`), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Admin request failed.");
  return data;
};

const inputStyle = {
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
  color: C.ink, padding: "10px 14px", fontSize: 13, outline: "none",
  fontFamily: "'DM Sans', sans-serif", minHeight: 40,
};

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(apiUrl("auth/signin"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16, width: 360, padding: 32, background: C.panel, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: C.go, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#080A0E", boxShadow: `0 0 16px ${C.go}55` }}>💪</div>
          <span style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Syne', sans-serif" }}>Rep<span style={{ color: C.go }}>Ups</span></span>
        </div>

        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>Admin Portal</h1>
          <p style={{ fontSize: 13, color: C.inkDim }}>Sign in with an administrator account.</p>
        </div>

        {error && (
          <div style={{ background: `${C.bad}15`, border: `1px solid ${C.bad}50`, color: C.bad, padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>{error}</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "'Space Mono', monospace" }}>Email</label>
          <input type="email" placeholder="admin@repups.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "'Space Mono', monospace" }}>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        </div>

        <button type="submit" disabled={loading} style={{ padding: "13px 0", border: "none", borderRadius: 12, background: C.go, color: "#080A0E", fontWeight: 800, fontSize: 14, fontFamily: "'Syne', sans-serif", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: `0 0 20px ${C.go}40`, marginTop: 4 }}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
      </form>
    </main>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
            {headers.map((h) => (
              <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: C.inkDim, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.panel : "transparent", transition: "background 0.15s" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "12px 16px", color: C.ink, verticalAlign: "middle" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div style={{ padding: "32px", textAlign: "center", color: C.inkDim, fontSize: 13, fontFamily: "'Space Mono', monospace" }}>No data available</div>
      )}
    </div>
  );
}

const emptyGym = { name: "", city: "", location: "", address: "", mapsUrl: "", description: "", contact: "", openingHours: "", facilities: "", latitude: "", longitude: "", active: true };

function GymManager() {
  const [gyms, setGyms] = useState([]); const [form, setForm] = useState(emptyGym); const [editingId, setEditingId] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const loadGyms = async () => { try { setError(""); const result = await api("gyms"); setGyms(result.gyms || []); } catch (err) { setError(err.message); } };
  useEffect(() => { loadGyms(); }, []);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const edit = (gym) => { const [longitude = "", latitude = ""] = gym.coordinates?.coordinates || []; setEditingId(gym._id); setForm({ name: gym.name || "", city: gym.city || "", location: gym.location || "", address: gym.address || "", mapsUrl: gym.mapsUrl || "", description: gym.description || "", contact: gym.contact || "", openingHours: gym.openingHours || "", facilities: (gym.facilities || []).join(", "), latitude, longitude, active: gym.active !== false }); };
  const submit = async (event) => { event.preventDefault(); try { setSaving(true); setError(""); await api(editingId ? `gyms/${editingId}` : "gyms", { method: editingId ? "PATCH" : "POST", body: JSON.stringify(form) }); setForm(emptyGym); setEditingId(""); await loadGyms(); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const fields = [["name", "Gym name", true], ["city", "City"], ["location", "Area / locality"], ["address", "Full address"], ["mapsUrl", "Google Maps / directions link", false, "url"], ["contact", "Contact number"], ["openingHours", "Opening hours"], ["facilities", "Facilities (comma separated)"]];
  return <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 440px) minmax(300px, 1fr)", gap: 22, alignItems: "start" }}>
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, borderRadius: 16, border: `1px solid ${C.border}`, background: C.panel }}>
      <div><h2 style={{ margin: 0, fontSize: 17 }}>{editingId ? "Edit gym" : "Add nearby gym"}</h2><p style={{ margin: "5px 0 0", fontSize: 12, color: C.inkDim }}>The location and directions link are shown to clients.</p></div>
      {error && <div style={{ color: C.bad, fontSize: 12 }}>{error}</div>}
      {fields.map(([key, label, required, type]) => <label key={key} style={{ display: "grid", gap: 5, color: C.inkDim, fontSize: 11, fontWeight: 700 }}>{label}<input required={required} type={type || "text"} value={form[key]} onChange={(event) => update(key, event.target.value)} style={inputStyle} /></label>)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><label style={{ display: "grid", gap: 5, color: C.inkDim, fontSize: 11, fontWeight: 700 }}>Latitude<input type="number" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} style={inputStyle} /></label><label style={{ display: "grid", gap: 5, color: C.inkDim, fontSize: 11, fontWeight: 700 }}>Longitude<input type="number" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} style={inputStyle} /></label></div>
      <label style={{ display: "grid", gap: 5, color: C.inkDim, fontSize: 11, fontWeight: 700 }}>Description<textarea value={form.description} onChange={(event) => update("description", event.target.value)} style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} /></label><label style={{ display: "flex", gap: 8, alignItems: "center", color: C.inkDim, fontSize: 12 }}><input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} /> Visible to clients</label>
      <div style={{ display: "flex", gap: 10 }}><button disabled={saving} type="submit" style={{ flex: 1, padding: "12px", border: 0, borderRadius: 10, background: C.go, color: C.bg, fontWeight: 800, cursor: "pointer" }}>{saving ? "Saving..." : editingId ? "Save gym" : "Add gym"}</button>{editingId && <button type="button" onClick={() => { setEditingId(""); setForm(emptyGym); }} style={{ ...inputStyle, cursor: "pointer" }}>Cancel</button>}</div>
    </form>
    <div><h2 style={{ margin: "3px 0 12px", fontSize: 17 }}>Saved gyms</h2><Table headers={["Gym", "Location", "Directions", "Action"]} rows={gyms.map((gym) => [<span style={{ fontWeight: 700 }}>{gym.name}</span>, <span style={{ color: C.inkDim, fontSize: 12 }}>{gym.location || gym.address || "Not set"}</span>, gym.mapsUrl ? <a href={gym.mapsUrl} target="_blank" rel="noreferrer" style={{ color: C.blue, fontSize: 12 }}>Open map</a> : <span style={{ color: C.inkMuted, fontSize: 12 }}>Not set</span>, <button onClick={() => edit(gym)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.go}55`, background: "transparent", color: C.go, cursor: "pointer" }}>Edit</button>])} /></div>
  </div>;
}

export function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const load = async () => {
    try {
      setError("");
      const endpoint = tab === "users"
        ? `users?role=${role}&q=${encodeURIComponent(query)}`
        : tab === "audit" ? "audit-logs" : "dashboard";
      setData(await api(endpoint));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [tab, role]);

  if (user?.role !== "admin") return <Navigate to="/admin/login" replace />;

  const suspend = async (item) => {
    await api(`users/${item.role}/${item._id}`, {
      method: "PATCH",
      body: JSON.stringify({ accountStatus: item.accountStatus === "suspended" ? "active" : "suspended" }),
    });
    load();
  };

  const navTabs = [
    { id: "gyms", label: "Gyms", icon: "📍" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "audit", label: "Audit Logs", icon: "📋" },
  ];

  return (
    <main style={{ minHeight: "100vh", display: "flex", background: C.bg, color: C.ink, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: C.panel, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.go, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#080A0E" }}>💪</div>
          <span style={{ fontWeight: 800, fontSize: 17, fontFamily: "'Syne', sans-serif" }}>Rep<span style={{ color: C.go }}>Ups</span></span>
        </div>

        <div style={{ padding: "8px 10px", flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.inkMuted, letterSpacing: "1.2px", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", padding: "12px 10px 8px" }}>Navigation</div>
          {navTabs.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, border: "1px solid transparent",
                background: tab === id ? `${C.go}12` : "transparent",
                borderColor: tab === id ? `${C.go}30` : "transparent",
                color: tab === id ? C.go : C.inkDim,
                cursor: "pointer", fontSize: 13, fontWeight: tab === id ? 600 : 400,
                fontFamily: "'DM Sans', sans-serif", textAlign: "left",
                marginBottom: 2, transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 15 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: "12px 10px", borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => { localStorage.clear(); navigate("/admin/login"); }}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.inkDim, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
          >
            <span>🚪</span> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <section style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>
            {tab === "dashboard" ? "Dashboard" : tab === "users" ? "User Management" : tab === "gyms" ? "Gym Management" : "Audit Logs"}
          </h1>
          <p style={{ fontSize: 13, color: C.inkDim }}>
            {tab === "dashboard" ? "Platform overview and key metrics" : tab === "users" ? "Manage clients, trainers, and admins" : tab === "gyms" ? "Add nearby gyms, their locations, and directions links" : "Track all admin actions"}
          </p>
        </div>

        {error && (
          <div style={{ background: `${C.bad}15`, border: `1px solid ${C.bad}50`, color: C.bad, padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20 }}>{error}</div>
        )}

        {/* Dashboard stats */}
        {tab === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {Object.entries(data?.stats || {}).map(([key, value]) => (
              <div key={key} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.inkDim, textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "'Space Mono', monospace", marginBottom: 10 }}>
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.go, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</div>
              </div>
            ))}
            {!data?.stats && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: C.inkDim, fontSize: 13, fontFamily: "'Space Mono', monospace" }}>Loading stats...</div>
            )}
          </div>
        )}

        {/* Users tab */}
        {tab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                placeholder="Search name or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 200 }}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {["all", "client", "trainer", "admin"].map((x) => <option key={x} value={x}>{x.charAt(0).toUpperCase() + x.slice(1)}</option>)}
              </select>
              <button type="submit" style={{ padding: "10px 20px", border: "none", borderRadius: 10, background: C.go, color: "#080A0E", fontWeight: 800, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontSize: 13 }}>Search</button>
            </form>

            <Table
              headers={["Name", "Role", "Status", "Created", "Action"]}
              rows={(data?.users || []).map((item) => [
                <span style={{ fontWeight: 600 }}>{item.name}</span>,
                <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: item.role === "trainer" ? `${C.blue}18` : `${C.go}18`, color: item.role === "trainer" ? C.blue : C.go, border: `1px solid ${item.role === "trainer" ? C.blue : C.go}30` }}>{item.role}</span>,
                <span style={{ color: item.accountStatus === "suspended" ? C.bad : "#4DFFA0", fontWeight: 600, fontSize: 12 }}>{item.accountStatus || "active"}</span>,
                <span style={{ color: C.inkDim, fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString()}</span>,
                <button
                  onClick={() => suspend(item)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${item.accountStatus === "suspended" ? "#4DFFA0" : C.bad}`, background: "transparent", color: item.accountStatus === "suspended" ? "#4DFFA0" : C.bad, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {item.accountStatus === "suspended" ? "Reactivate" : "Suspend"}
                </button>,
              ])}
            />
          </div>
        )}

        {tab === "gyms" && <GymManager />}

        {/* Audit logs tab */}
        {tab === "audit" && (
          <Table
            headers={["When", "Action", "Target"]}
            rows={(data?.logs || []).map((item) => [
              <span style={{ color: C.inkDim, fontSize: 12, fontFamily: "'Space Mono', monospace" }}>{new Date(item.createdAt).toLocaleString()}</span>,
              <span style={{ fontWeight: 600 }}>{item.action}</span>,
              <span style={{ color: C.inkDim, fontSize: 12 }}>{item.targetType}: {item.targetId}</span>,
            ])}
          />
        )}
      </section>
    </main>
  );
}
