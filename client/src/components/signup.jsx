import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#0a0a0f",
  surface: "#111118",
  card: "#16161f",
  border: "#1e1e2e",
  accentGreen: "#c8ff00", 
  accentBlue: "#2979FF",  
  red: "#ff3c5a",
  textPrimary: "#f0f0f5",
  textSecondary: "#7a7a9a",
  textMuted: "#3a3a5a",
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
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px", color: C.textSecondary, textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  color: C.textPrimary,
  fontSize: 14,
  padding: "13px 16px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

export default function RepUpsSignup() {
  const navigate = useNavigate();
  
  const [mode, setMode] = useState("signin");
  const [role, setRole] = useState("trainer"); 
  const [showPass, setShowPass] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [step, setStep] = useState(1);
  const [coords, setCoords] = useState([72.8777, 19.0760]); // Default GPS (Mumbai)

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
              const resolvedLocation = suburb && city ? `${suburb}, ${city}` : (city || "Mumbai, India");

              setForm((f) => ({ ...f, location: resolvedLocation }));
            }
          } catch (geoErr) {
            console.warn("Reverse geocoding failed, using coordinates only.");
            setForm((f) => ({ ...f, location: "Mumbai, India" }));
          }
        },
        () => {
          setForm((f) => ({ ...f, location: "Mumbai, India" }));
        }
      );
    } else {
      setForm((f) => ({ ...f, location: "Mumbai, India" }));
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isTrainer = role === "trainer";
  const accentColor = isTrainer ? C.accentBlue : C.accentGreen;
  const features = isTrainer ? trainerFeatures : clientFeatures;
  const totalSteps = isTrainer ? 3 : 2;

  const toggleSpecialty = (s) =>
    setSelectedSpecialties((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handleAuthSubmit = async () => {
    setError("");
    setLoading(true);
    
    localStorage.removeItem("user");
    localStorage.removeItem("profileId");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");

    const endpoint = isTrainer 
      ? (mode === "signin" ? "http://localhost:5001/api/trainers/signin" : "http://localhost:5001/api/trainers/register")
      : (mode === "signin" ? "http://localhost:5001/api/auth/signin" : "http://localhost:5001/api/auth/register");

    const payload = mode === "signin"
      ? { email: form.email, password: form.password }
      : { 
          role, name: form.name, email: form.email, password: form.password, 
          gym: form.gym, experience: form.experience, location: form.location, 
          title: form.title, specialties: selectedSpecialties, 
          locationCoords: coords, 
          pricing: {
            personalTraining: Number(form.personalTrainingPrice) || 2500,
            videoConsultation: Number(form.videoConsultationPrice) || 1500
          },
          weight: form.weight, height: form.height, age: form.age, goal: selectedGoal 
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server didn't return JSON. Ensure your Node backend is running.");
      }

      const data = await res.json();

      if (res.ok && data.success) {
        const loggedUser = data.user || data;
        const uniqueId = loggedUser._id || loggedUser.id || data.profileId;

        if (uniqueId) {
          const userSession = {
            ...loggedUser,
            role: isTrainer ? "trainer" : "client"
          };
          localStorage.setItem("user", JSON.stringify(userSession));
          localStorage.setItem("profileId", uniqueId);
          localStorage.setItem("userId", uniqueId);
          localStorage.setItem("userRole", isTrainer ? "trainer" : "client");
        } else {
          throw new Error("Authentication response did not contain a valid user ID.");
        }

        if (isTrainer) {
          navigate('/trainer-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Network Error:", err);
      setError(err.message || "Unable to reach server. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", background: C.bg, color: C.textPrimary, fontFamily: "'DM Sans', sans-serif", overflowY: "auto" }}>
      {!isMobile && (
        <div style={{ flex: 1.1, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: 48, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${C.border}55 1px, transparent 1px), linear-gradient(90deg, ${C.border}55 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, position: "relative", zIndex: 1 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff" }}>💪</div>
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px", fontFamily: "Syne, sans-serif" }}>Rep<span style={{ color: accentColor }}>Ups</span></span>
          </div>

          <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ background: `${accentColor}18`, color: accentColor, fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "4px 12px", borderRadius: 20, border: `1px solid ${accentColor}33` }}>
                {isTrainer ? "FOR COACHES & TRAINERS" : "FOR ATHLETES & CLIENTS"}
              </span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, marginBottom: 16, marginTop: 14, fontFamily: "Syne, sans-serif" }}>
              {isTrainer ? <><>Build your<br /></><span style={{ color: accentColor }}>fitness empire</span></> : <><>Train smarter,<br /></><span style={{ color: accentColor }}>not harder</span></>}
            </h1>
            <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6, marginBottom: 32, maxWidth: 380 }}>
              {isTrainer ? "The all-in-one platform to manage clients, assign AI-powered diet & workout plans, and grow your coaching business." : "Get AI-personalized workouts, track every rep, find nearby gyms and events — all in one place."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accentColor}15`, border: `1px solid ${accentColor}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, fontFamily: "Syne, sans-serif" }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "24px 20px" : 48, width: "100%", maxWidth: isMobile ? "100%" : 520, margin: "0 auto", boxSizing: "border-box" }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💪</div>
            <span style={{ fontWeight: 800, fontSize: 18, fontFamily: "Syne, sans-serif" }}>Rep<span style={{ color: accentColor }}>Ups</span></span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: isMobile ? 24 : 32, alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => { setRole(role === "trainer" ? "client" : "trainer"); setStep(1); }} style={{ fontSize: 11, background: "none", border: `1px solid ${C.border}`, padding: "6px 10px", borderRadius: 6, color: C.textSecondary, cursor: "pointer" }}>
            Switch to {role === "trainer" ? "Client" : "Trainer"} mode
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: C.textSecondary }}>{mode === "signin" ? "New here?" : "Have account?"}</span>
            <button onClick={() => { setMode((m) => (m === "signin" ? "signup" : "signin")); setStep(1); setError(""); }} style={{ background: "none", border: `1px solid ${accentColor}55`, borderRadius: 8, padding: "6px 14px", color: accentColor, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
              {mode === "signin" ? "Register" : "Sign in"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, marginBottom: 6, fontFamily: "Syne, sans-serif" }}>
            {mode === "signin" ? `Welcome back${isTrainer ? ", Coach" : ""} 👋` : step === 1 ? "Create account" : step === 2 && isTrainer ? "Professional details" : isTrainer ? "Specialties & Pricing" : "Your profile"}
          </h2>
          <p style={{ fontSize: 13, color: C.textSecondary }}>
            {mode === "signin" ? `Sign in as a ${isTrainer ? "Trainer" : "Client"}` : step === 1 ? "Fill in your credentials to start" : "Personalize your experience"}
          </p>
        </div>

        {error && (
          <div style={{ background: "#ff3c5a15", border: "1px solid #ff3c5a50", color: "#ff3c5a", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {mode === "signup" && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} style={{ height: 4, borderRadius: 2, width: i + 1 === step ? 24 : 8, background: i + 1 <= step ? accentColor : C.border, transition: "all 0.3s" }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>Step {step} of {totalSteps}</div>
          </div>
        )}

        {mode === "signin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Email address"><input type="email" placeholder={isTrainer ? "coach@example.com" : "athlete@example.com"} style={inputStyle} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 44 }} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                <button onClick={() => setShowPass((p) => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textSecondary, fontSize: 18 }}>{showPass ? "🙈" : "👁"}</button>
              </div>
            </Field>
            <button onClick={handleAuthSubmit} disabled={loading} style={{ width: "100%", padding: 13, border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: accentColor, color: "#fff", marginTop: 6, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing In..." : `Sign In as ${isTrainer ? "Trainer" : "Client"} →`}
            </button>
          </div>
        )}

        {mode === "signup" && step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <Field label="Full name"><input type="text" placeholder="Your name" style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Email"><input type="email" placeholder="you@example.com" style={inputStyle} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
            </div>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} placeholder="Min. 8 characters" style={{ ...inputStyle, paddingRight: 44 }} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                <button onClick={() => setShowPass((p) => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textSecondary, fontSize: 18 }}>{showPass ? "🙈" : "👁"}</button>
              </div>
            </Field>
            {!isTrainer && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[["Weight (kg)", "weight", "75"], ["Height (cm)", "height", "175"], ["Age", "age", "25"]].map(([l, k, ph]) => (
                  <Field key={k} label={l}><input type="number" placeholder={ph} style={inputStyle} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} /></Field>
                ))}
              </div>
            )}
            <button onClick={() => setStep(2)} style={{ width: "100%", padding: 13, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, background: accentColor, color: "#fff", marginTop: 4 }}>Continue →</button>
          </div>
        )}

        {mode === "signup" && step === 2 && isTrainer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Professional Title"><input type="text" placeholder="e.g. Elite Strength Coach" style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <Field label="Gym / Studio Affiliation"><input type="text" placeholder="Iron Temple Gym" style={inputStyle} value={form.gym} onChange={(e) => setForm((f) => ({ ...f, gym: e.target.value }))} /></Field>
              <Field label="Auto-Detected Location"><input type="text" style={inputStyle} value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></Field>
            </div>
            <Field label="Years of Experience">
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}>
                <option value="">Select experience</option><option>Under 1 year</option><option>1–3 years</option><option>3–7 years</option><option>7+ years</option>
              </select>
            </Field>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(1)} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.textSecondary, cursor: "pointer", fontSize: 18 }}>←</button>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: 13, border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, background: accentColor, color: "#fff" }}>Continue →</button>
            </div>
          </div>
        )}

        {mode === "signup" && step === 2 && !isTrainer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Fitness level">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 4 }}>
                {[["Beginner", "🌱"], ["Intermediate", "🔥"], ["Advanced", "⚡"]].map(([l, emoji]) => {
                  const active = selectedGoal === l;
                  return <button key={l} onClick={() => setSelectedGoal(active ? "" : l)} style={{ padding: "10px 6px", borderRadius: 10, border: `1px solid ${active ? accentColor : C.border}`, background: active ? `${accentColor}15` : C.card, color: active ? accentColor : C.textSecondary, cursor: "pointer", fontSize: 12 }}>{emoji} {l}</button>;
                })}
              </div>
            </Field>
            <Field label="Primary goal">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {goals.map((g) => {
                  const active = selectedGoal === g;
                  return <button key={g} onClick={() => setSelectedGoal(active ? "" : g)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer", border: `1px solid ${active ? accentColor : C.border}`, background: active ? `${accentColor}15` : C.card, color: active ? accentColor : C.textSecondary }}>{g}</button>;
                })}
              </div>
            </Field>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(1)} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.textSecondary, cursor: "pointer", fontSize: 18 }}>←</button>
              <button onClick={handleAuthSubmit} disabled={loading} style={{ flex: 1, padding: 13, border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, background: accentColor, color: "#fff", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Creating..." : "Create Account ✓"}
              </button>
            </div>
          </div>
        )}

        {mode === "signup" && step === 3 && isTrainer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Specialties & Core Focus">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {specialtiesList.map((s) => {
                  const active = selectedSpecialties.includes(s);
                  return <button key={s} onClick={() => toggleSpecialty(s)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${active ? accentColor : C.border}`, background: active ? `${accentColor}15` : C.card, color: active ? accentColor : C.textSecondary }}>{s}</button>;
                })}
              </div>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Personal Training (₹/hr)"><input type="number" placeholder="2500" style={inputStyle} value={form.personalTrainingPrice} onChange={(e) => setForm((f) => ({ ...f, personalTrainingPrice: e.target.value }))} /></Field>
              <Field label="Video Consult (₹/45min)"><input type="number" placeholder="1500" style={inputStyle} value={form.videoConsultationPrice} onChange={(e) => setForm((f) => ({ ...f, videoConsultationPrice: e.target.value }))} /></Field>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(2)} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.textSecondary, cursor: "pointer", fontSize: 18 }}>←</button>
              <button onClick={handleAuthSubmit} disabled={loading} style={{ flex: 1, padding: 13, border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer", fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, background: accentColor, color: "#fff", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Creating..." : "Complete Setup & Launch Dashboard ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}