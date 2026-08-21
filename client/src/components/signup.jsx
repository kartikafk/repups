import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config.js";

const C = {
  bg: "#080A0E",
  surface: "#0F1117",
  card: "#161B24",
  border: "#232B3A",
  accentGreen: "#C8FF4D",
  accentBlue: "#4D9FFF",
  red: "#FF4D6D",
  textPrimary: "#EDF2FF",
  textSecondary: "#7A8BA8",
  textMuted: "#3D4F66",
};

const trainerFeatures = [
  { icon: "👥", title: "Client Management", desc: "Full database of clients with progress tracking and streak analytics." },
  { icon: "🧬", title: "AI Diet Plans", desc: "Auto-generate cutting, maintenance, or bulk plans via Mifflin-St Jeor." },
  { icon: "📊", title: "Growth Analytics", desc: "Visual dashboards for calorie adherence, workout frequency, and PRs." },
];

const clientFeatures = [
  { icon: "⚡", title: "AI Workout Plans", desc: "Beginner to Advanced splits generated in seconds by your AI trainer." },
  { icon: "📋", title: "Workout Logger", desc: "Track every set, rep, weight and calorie in real-time." },
  { icon: "🌐", title: "Community", desc: "Rate gyms, find local events, and connect with other athletes." },
];

const specialtiesList = ["Strength Training", "Corrective Exercise", "Hypertrophy", "Powerlifting", "Sports Performance", "Weight Loss", "Mobility", "Functional Training"];
const goals = ["Cut", "Maintain", "Bulk", "Athletic Performance"];

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", color: C.textSecondary, textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  color: C.textPrimary,
  fontSize: 14,
  padding: "13px 16px",
  width: "100%",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  minHeight: 46,
};

export default function RepUpsSignup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [role, setRole] = useState("trainer");
  const [showPass, setShowPass] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [step, setStep] = useState(1);
  const [coords, setCoords] = useState([72.8777, 19.0760]);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    gym: "", experience: "", location: "Detecting location...", title: "Elite Strength & Conditioning Coach",
    personalTrainingPrice: "2500", videoConsultationPrice: "1500",
    weight: "", height: "", age: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoords([lng, lat]);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.state_district || "";
              const suburb = data.address.suburb || data.address.neighbourhood || "";
              setForm((f) => ({ ...f, location: suburb && city ? `${suburb}, ${city}` : (city || "Mumbai, India") }));
            }
          } catch { setForm((f) => ({ ...f, location: "Mumbai, India" })); }
        },
        () => setForm((f) => ({ ...f, location: "Mumbai, India" }))
      );
    } else { setForm((f) => ({ ...f, location: "Mumbai, India" })); }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isTrainer = role === "trainer";
  const accentColor = isTrainer ? C.accentBlue : C.accentGreen;
  const features = isTrainer ? trainerFeatures : clientFeatures;
  const totalSteps = isTrainer ? 3 : 2;

  const toggleSpecialty = (s) =>
    setSelectedSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handleAuthSubmit = async () => {
    setError(""); setLoading(true);
    localStorage.removeItem("user"); localStorage.removeItem("profileId");
    localStorage.removeItem("userId"); localStorage.removeItem("userRole"); localStorage.removeItem("token");
    const endpoint = isTrainer
      ? apiUrl(mode === "signin" ? "trainers/signin" : "trainers/register")
      : apiUrl(mode === "signin" ? "auth/signin" : "auth/register");
    const payload = mode === "signin"
      ? { email: form.email, password: form.password }
      : { role, name: form.name, email: form.email, password: form.password, gym: form.gym, experience: form.experience, location: form.location, title: form.title, specialties: selectedSpecialties, locationCoords: coords, pricing: { personalTraining: Number(form.personalTrainingPrice) || 2500, videoConsultation: Number(form.videoConsultationPrice) || 1500 }, weight: form.weight, height: form.height, age: form.age, goal: selectedGoal };
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const contentType = res.headers.get("content-type") || "";
      const responseText = await res.text();
      let data;
      try { data = responseText ? JSON.parse(responseText) : {}; }
      catch { throw new Error(contentType.includes("text/html") ? `Request failed (${res.status}). HTML error page returned.` : `Request failed (${res.status}).`); }
      if (res.ok && data.success) {
        const loggedUser = data.user || data;
        const uniqueId = loggedUser._id || loggedUser.id || data.profileId;
        if (uniqueId) {
          localStorage.setItem("user", JSON.stringify({ ...loggedUser, role: isTrainer ? "trainer" : "client" }));
          localStorage.setItem("profileId", uniqueId); localStorage.setItem("userId", uniqueId);
          localStorage.setItem("userRole", isTrainer ? "trainer" : "client");
          if (data.token) localStorage.setItem("token", data.token);
        } else { throw new Error("Authentication response did not contain a valid user ID."); }
        navigate(isTrainer ? '/trainer-dashboard' : '/dashboard');
      } else { setError(data.error || "Authentication failed"); }
    } catch (err) { setError(err.message || "Unable to reach server."); }
    finally { setLoading(false); }
  };

  const chipStyle = (active) => ({
    padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    border: `1px solid ${active ? accentColor : C.border}`,
    background: active ? `${accentColor}18` : C.card,
    color: active ? accentColor : C.textSecondary, transition: "all 0.15s",
  });

  const btnPrimary = {
    width: "100%", padding: "14px 0", border: "none", borderRadius: 12,
    fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800,
    background: accentColor, color: "#080A0E",
    boxShadow: `0 0 24px ${accentColor}40`, cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", background: C.bg, color: C.textPrimary, fontFamily: "'DM Sans', sans-serif", overflowY: "auto" }}>

      {/* ── Left panel ── */}
      {!isMobile && (
        <div style={{ flex: 1.1, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "48px 52px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${C.border}44 1px, transparent 1px), linear-gradient(90deg, ${C.border}44 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
          <div style={{ position: "absolute", top: -100, left: -100, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${accentColor}14 0%, transparent 70%)`, pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48, position: "relative", zIndex: 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#080A0E", boxShadow: `0 0 20px ${accentColor}55` }}>💪</div>
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px", fontFamily: "'Syne', sans-serif" }}>Rep<span style={{ color: accentColor }}>Ups</span></span>
          </div>

          <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={{ background: `${accentColor}14`, color: accentColor, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", padding: "5px 14px", borderRadius: 999, border: `1px solid ${accentColor}28`, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", display: "inline-block", marginBottom: 14 }}>
              {isTrainer ? "For Coaches & Trainers" : "For Athletes & Clients"}
            </span>
            <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.12, marginBottom: 16, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" }}>
              {isTrainer ? <><span>Build your</span><br /><span style={{ color: accentColor }}>fitness empire</span></> : <><span>Train smarter,</span><br /><span style={{ color: accentColor }}>not harder</span></>}
            </h1>
            <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.65, marginBottom: 36, maxWidth: 360 }}>
              {isTrainer ? "The all-in-one platform to manage clients, assign AI-powered diet & workout plans, and grow your coaching business." : "Get AI-personalized workouts, track every rep, find nearby gyms and events — all in one place."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accentColor}12`, border: `1px solid ${accentColor}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3, fontFamily: "'Syne', sans-serif" }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "auto", paddingTop: 32 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, color: C.textSecondary }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4DFFA0", boxShadow: "0 0 8px #4DFFA0", display: "inline-block" }} />
                Trusted by 10,000+ athletes & coaches
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Right panel (form) ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "28px 20px" : "48px 52px", width: "100%", maxWidth: isMobile ? "100%" : 520, margin: "0 auto", boxSizing: "border-box" }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#080A0E" }}>💪</div>
            <span style={{ fontWeight: 800, fontSize: 20, fontFamily: "'Syne', sans-serif" }}>Rep<span style={{ color: accentColor }}>Ups</span></span>
          </div>
        )}

        {/* Mode switcher */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: isMobile ? 24 : 32, alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => { setRole(role === "trainer" ? "client" : "trainer"); setStep(1); }} style={{ fontSize: 12, background: "none", border: `1px solid ${C.border}`, padding: "7px 12px", borderRadius: 8, color: C.textSecondary, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Switch to {role === "trainer" ? "Client" : "Trainer"} mode
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: C.textSecondary }}>{mode === "signin" ? "New here?" : "Have account?"}</span>
            <button onClick={() => { setMode((m) => (m === "signin" ? "signup" : "signin")); setStep(1); setError(""); }} style={{ background: "none", border: `1px solid ${accentColor}55`, borderRadius: 8, padding: "7px 16px", color: accentColor, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
              {mode === "signin" ? "Register" : "Sign in"}
            </button>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, marginBottom: 6, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.5px" }}>
            {mode === "signin" ? `Welcome back${isTrainer ? ", Coach" : ""} 👋` : step === 1 ? "Create account" : step === 2 && isTrainer ? "Professional details" : isTrainer ? "Specialties & Pricing" : "Your profile"}
          </h2>
          <p style={{ fontSize: 14, color: C.textSecondary }}>
            {mode === "signin" ? `Sign in as a ${isTrainer ? "Trainer" : "Client"}` : step === 1 ? "Fill in your credentials to start" : "Personalize your experience"}
          </p>
        </div>

        {error && <div style={{ background: "#FF4D6D15", border: "1px solid #FF4D6D50", color: "#FF4D6D", padding: "11px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16, lineHeight: 1.4 }}>{error}</div>}

        {mode === "signup" && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} style={{ height: 3, borderRadius: 2, width: i + 1 === step ? 28 : 10, background: i + 1 <= step ? accentColor : C.border, transition: "all 0.3s ease" }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, fontFamily: "'Space Mono', monospace" }}>Step {step} of {totalSteps}</div>
          </div>
        )}

        {/* Sign In */}
        {mode === "signin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Email address"><input type="email" placeholder={isTrainer ? "coach@example.com" : "athlete@example.com"} style={inputStyle} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 48 }} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                <button onClick={() => setShowPass((p) => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textSecondary, fontSize: 18 }}>{showPass ? "🙈" : "👁"}</button>
              </div>
            </Field>
            <button onClick={handleAuthSubmit} disabled={loading} style={{ ...btnPrimary, marginTop: 4, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Signing In..." : `Sign In as ${isTrainer ? "Trainer" : "Client"} →`}
            </button>
          </div>
        )}

        {/* Sign Up Step 1 */}
        {mode === "signup" && step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <Field label="Full name"><input type="text" placeholder="Your name" style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Email"><input type="email" placeholder="you@example.com" style={inputStyle} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
            </div>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} placeholder="Min. 8 characters" style={{ ...inputStyle, paddingRight: 48 }} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                <button onClick={() => setShowPass((p) => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textSecondary, fontSize: 18 }}>{showPass ? "🙈" : "👁"}</button>
              </div>
            </Field>
            {!isTrainer && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[["Weight (kg)", "weight", "75"], ["Height (cm)", "height", "175"], ["Age", "age", "25"]].map(([l, k, ph]) => (
                  <Field key={k} label={l}><input type="number" placeholder={ph} style={inputStyle} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} /></Field>
                ))}
              </div>
            )}
            <button onClick={() => setStep(2)} style={{ ...btnPrimary, marginTop: 4 }}>Continue →</button>
          </div>
        )}

        {/* Sign Up Step 2 — Trainer */}
        {mode === "signup" && step === 2 && isTrainer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Professional Title"><input type="text" placeholder="e.g. Elite Strength Coach" style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              <Field label="Gym / Studio"><input type="text" placeholder="Iron Temple Gym" style={inputStyle} value={form.gym} onChange={(e) => setForm((f) => ({ ...f, gym: e.target.value }))} /></Field>
              <Field label="Location"><input type="text" style={inputStyle} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></Field>
            </div>
            <Field label="Years of Experience">
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}>
                <option value="">Select experience</option><option>Under 1 year</option><option>1–3 years</option><option>3–7 years</option><option>7+ years</option>
              </select>
            </Field>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(1)} style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.textSecondary, cursor: "pointer", fontSize: 18 }}>←</button>
              <button onClick={() => setStep(3)} style={{ ...btnPrimary, flex: 1, width: "auto" }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Sign Up Step 2 — Client */}
        {mode === "signup" && step === 2 && !isTrainer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Fitness level">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 4 }}>
                {[["Beginner", "🌱"], ["Intermediate", "🔥"], ["Advanced", "⚡"]].map(([l, emoji]) => {
                  const active = selectedGoal === l;
                  return <button key={l} onClick={() => setSelectedGoal(active ? "" : l)} style={{ padding: "11px 6px", borderRadius: 10, border: `1px solid ${active ? accentColor : C.border}`, background: active ? `${accentColor}15` : C.card, color: active ? accentColor : C.textSecondary, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{emoji} {l}</button>;
                })}
              </div>
            </Field>
            <Field label="Primary goal">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {goals.map((g) => <button key={g} onClick={() => setSelectedGoal(selectedGoal === g ? "" : g)} style={chipStyle(selectedGoal === g)}>{g}</button>)}
              </div>
            </Field>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(1)} style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.textSecondary, cursor: "pointer", fontSize: 18 }}>←</button>
              <button onClick={handleAuthSubmit} disabled={loading} style={{ ...btnPrimary, flex: 1, width: "auto", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Creating..." : "Create Account ✓"}</button>
            </div>
          </div>
        )}

        {/* Sign Up Step 3 — Trainer */}
        {mode === "signup" && step === 3 && isTrainer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Specialties & Core Focus">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {specialtiesList.map((s) => <button key={s} onClick={() => toggleSpecialty(s)} style={chipStyle(selectedSpecialties.includes(s))}>{s}</button>)}
              </div>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Personal Training (₹/hr)"><input type="number" placeholder="2500" style={inputStyle} value={form.personalTrainingPrice} onChange={(e) => setForm((f) => ({ ...f, personalTrainingPrice: e.target.value }))} /></Field>
              <Field label="Video Consult (₹/45min)"><input type="number" placeholder="1500" style={inputStyle} value={form.videoConsultationPrice} onChange={(e) => setForm((f) => ({ ...f, videoConsultationPrice: e.target.value }))} /></Field>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(2)} style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.textSecondary, cursor: "pointer", fontSize: 18 }}>←</button>
              <button onClick={handleAuthSubmit} disabled={loading} style={{ ...btnPrimary, flex: 1, width: "auto", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Creating..." : "Complete Setup & Launch Dashboard ✓"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
