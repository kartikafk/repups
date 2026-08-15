import { useEffect, useState } from "react";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

const GOALS = ["Cut", "Bulk", "Recomp", "Maintain"];
const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "?";

export default function ClientProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", age: "", goal: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch(apiUrl("me"), { headers: authHeaders() })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Request failed");
        return data;
      })
      .then((data) => {
        setUser(data.user);
        setForm({
          name: data.user.name || "",
          age: data.user.age ?? "",
          goal: data.user.goal || "",
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("photo", file);
    try {
      const response = await fetch(apiUrl("me/photo"), {
        method: "POST",
        headers: authHeaders(),
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const response = await fetch(apiUrl("me"), {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setUser(data.user);
      setSaveMsg("Saved ✓");
    } catch (err) {
      setSaveMsg(err.message || "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2500);
    }
  };
  const topbar = <header className="client-topbar"><div className="client-topbar-brand"><div className="client-topbar-logo">💪</div><div><div className="client-topbar-title">Rep<span>Ups</span></div><div className="client-topbar-subtitle">My Profile</div></div></div><div className="client-topbar-right"><span className="client-topbar-status"><i />Online</span><div className="client-topbar-avatar">{initials(user?.name)}</div><button className="client-topbar-menu-btn" aria-label="Menu"><span /><span /><span /></button></div></header>;

  if (error) {
    return (
      <div className="client-shell">{topbar}<main className="client-profile-page state-center">
        <p>{error}</p>
      </main></div>
    );
  }

  if (!user) {
    return (
      <div className="client-shell">{topbar}<main className="client-profile-page state-center state-loading">
        Loading profile…
      </main></div>
    );
  }

  return (
    <div className="client-shell">{topbar}<main className="client-profile-page client-main">
      <div className="client-profile-inner">
        <h2 className="client-profile-title">My Profile</h2>

        {/* Basic Information */}
        <section className="trainer-card client-profile-card">
          <div className="trainer-section-label">Basic Information</div>

          <div className="client-profile-photo-row">
            <div
              className="trainer-avatar client-profile-avatar"
              style={user.photoUrl ? { backgroundImage: `url(${user.photoUrl})` } : undefined}
            >
              {!user.photoUrl && (user.name?.slice(0, 2).toUpperCase() || "?")}
            </div>
            <div>
              <label htmlFor="photo-upload" className="client-profile-photo-label">
                Change profile photo
              </label>
              <input
                id="photo-upload"
                onChange={uploadPhoto}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="client-profile-photo-input"
              />
            </div>
          </div>

          <div className="modal-fields">
            <div>
              <div className="modal-label">Name</div>
              <input
                className="modal-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <div className="modal-label">Email</div>
              <input
                className="modal-input client-profile-input-disabled"
                value={user.email}
                disabled
              />
            </div>

            <div className="client-profile-grid-2">
              <div>
                <div className="modal-label">Age</div>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                />
              </div>
              <div>
                <div className="modal-label">Goal</div>
                <select
                  className="modal-input"
                  value={form.goal}
                  onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Status badge row */}
        <section className="trainer-card client-profile-card">
          <div className="trainer-section-label">Status</div>
          <div className="client-profile-badges">
            <span className="trainer-badge">Active Client</span>
            {form.goal && <span className="trainer-badge">Goal: {form.goal}</span>}
          </div>
        </section>

        <button
          className="action-btn client-profile-save-btn"
          onClick={saveProfile}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
        {saveMsg && <p className="save-status">{saveMsg}</p>}
      </div>
    </main></div>
  );
}
