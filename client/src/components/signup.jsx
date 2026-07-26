import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";
const C = {
  bg: "#08080c",
  surface: "#111116",
  card: "#16161f",
  border: "#222232",
  accent: "#c8ff00",
  accentDim: "#8fb200",
  red: "#ff3c5a",
  textPrimary: "#f0f0f5",
  textSecondary: "#8a8aab",
  textMuted: "#3a3a52",
};

export default function Signup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signup");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const totalSteps = 3;

  const [form, setForm] = useState({
    emailOrMobile: "", password: "", name: "", profession: "Desk Worker / Professional",
    height: "", weight: "", age: "", gender: "male", bodyFat: "", bodyType: "athletic",
    experience: "beginner", injuryHistory: "None", flexibility: "average", mobility: "average", strengthLevel: "novice",
    fitnessGoal: "hypertrophy", availableEquipment: ["gym"]
  });

  const update = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (error) setError("");
  };

  const toggleEquipment = (eq) => {
    setForm(p => ({
      ...p,
      availableEquipment: p.availableEquipment.includes(eq)
        ? p.availableEquipment.filter(x => x !== eq)
        : [...p.availableEquipment, eq]
    }));
  };

  const handleSignIn = async () => {
    if (!form.emailOrMobile || !form.password) {
      setError("Please fill out your email/mobile and password.");
      return;
    }
    setError("");

    try {
      const response = await fetch('/api/profile/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrMobile: form.emailOrMobile, password: form.password })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("profileId", data.profileId);
        localStorage.setItem("userName", data.user?.name || "");
        navigate('/dashboard'); 
      } else {
        setError(data.error || "Sign in failed. Please check credentials.");
      }
    } catch (err) {
      setError("Unable to connect to backend server.");
    }
  };

  const handleNextStep1 = async () => {
    if (!form.name || !form.emailOrMobile || !form.password || !form.profession) {
      setError("Please fill out your name, profession, email/mobile, and password.");
      return;
    }
    setError("");

    try {
      const response = await fetch('/api/profile/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrMobile: form.emailOrMobile })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An account with this email or mobile number already exists.");
        return;
      }

      setError("");
      setStep(2);
    } catch (err) {
      setError("Unable to verify account uniqueness with server.");
    }
  };

  const handleNextStep2 = () => {
    if (!form.height || !form.weight || !form.age || !form.bodyFat) {
      setError("Please fill in all core body metrics (height, weight, age, body fat).");
      return;
    }
    setError("");
    setStep(3);
  };

  const handleComplete = async () => {
    if (!form.fitnessGoal || form.availableEquipment.length === 0) {
      setError("Please select a fitness goal and equipment option.");
      return;
    }
    setError("");

    try {
      const response = await fetch('/api/profile/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("profileId", data.profileId);
        localStorage.setItem("userName", data.user?.name || form.name);
        navigate('/ai-onboarding'); 
      } else {
        setError(data.error || "Registration failed on backend.");
      }
    } catch (err) {
      setError("Unable to connect to backend server.");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100vw", background: C.bg, color: C.textPrimary, overflowX: "hidden" }}>
      
      {/* Brand Panel */}
      <div style={{ flex: 1, background: C.surface, padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", borderRight: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
          {/* Logo container with neon green background & shadow glow */}
          <div style={{ width: 42, height: 42, borderRadius: 12, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: `0 0 15px ${C.accent}40`, border: `1px solid ${C.accent}` }}>
            <img src="/repup-logo.jpeg" alt="RepUps Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.5px", fontFamily: "sans-serif" }}>
            Rep<span style={{ color: C.accent }}>Ups</span>
          </span>
        </div>

        <div style={{ zIndex: "1", maxWidth: 420, margin: "auto 0" }}>
          <span style={{ background: `${C.accent}15`, color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: "1px", padding: "4px 12px", borderRadius: 20, border: `1px solid ${C.accent}30` }}>
            AI BIOMECHANICS ENGINE
          </span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, lineHeight: 1.15, marginTop: 16, marginBottom: 12 }}>
            Calibrate your <span style={{ color: C.accent }}>digital twin</span>
          </h1>
          <p style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>
            Track rep accuracy, form compensation, and performance metrics in real-time using computer vision.
          </p>
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary }}>© 2026 RepUps Systems</div>
      </div>

      {/* Form Panel */}
      <div style={{ width: "520px", background: C.bg, padding: "50px 40px", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" }}>
        
        {/* Tabs Bar */}
        <div style={{ display: "flex", background: C.surface, padding: "4px", borderRadius: "12px", marginBottom: "24px", border: `1px solid ${C.border}` }}>
          <button style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: mode === "signin" ? C.card : "transparent", color: mode === "signin" ? C.textPrimary : C.textSecondary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setMode("signin"); setError(""); }}>Sign In</button>
          <button style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: mode === "signup" ? C.card : "transparent", color: mode === "signup" ? C.textPrimary : C.textSecondary, fontWeight: 600, cursor: "pointer" }} onClick={() => { setMode("signup"); setStep(1); setError(""); }}>Create Account</button>
        </div>

        {mode === "signin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Welcome Back</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>Email or Mobile Number</label>
              <input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", color: C.textPrimary, outline: "none" }} type="text" placeholder="name@example.com" value={form.emailOrMobile} onChange={e => update('emailOrMobile', e.target.value)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>Password</label>
              <input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", color: C.textPrimary, outline: "none" }} type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />
            </div>

            {error && <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}30`, color: C.red, padding: "10px", borderRadius: "8px", fontSize: 13 }}>{error}</div>}

            <button style={{ background: C.accent, color: "#000", border: "none", padding: "14px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", marginTop: "8px" }} onClick={handleSignIn}>
              Sign In →
            </button>
          </div>
        )}

        {mode === "signup" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 6, fontWeight: 600 }}>STEP {step} OF {totalSteps}</div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ flex: 1, height: "4px", background: i <= step ? C.accent : C.border, borderRadius: "2px" }} />
                ))}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>
                {step === 1 && "Credentials & Identity"}
                {step === 2 && "Physical Profile & Metrics"}
                {step === 3 && "Goals & Setup"}
              </h2>
            </div>

            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>Full Name</label>
                  <input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", color: C.textPrimary, outline: "none" }} type="text" placeholder="John Doe" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>Profession / Lifestyle</label>
                  <input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", color: C.textPrimary, outline: "none" }} type="text" placeholder="Software Engineer, Desk Worker, etc." value={form.profession} onChange={e => update('profession', e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>Email or Mobile Number</label>
                  <input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", color: C.textPrimary, outline: "none" }} type="text" placeholder="name@example.com" value={form.emailOrMobile} onChange={e => update('emailOrMobile', e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>Password</label>
                  <input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", color: C.textPrimary, outline: "none" }} type="password" placeholder="Create password" value={form.password} onChange={e => update('password', e.target.value)} />
                </div>

                {error && <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}30`, color: C.red, padding: "10px", borderRadius: "8px", fontSize: 13 }}>{error}</div>}

                <button style={{ background: C.accent, color: "#000", border: "none", padding: "14px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", marginTop: "8px" }} onClick={handleNextStep1}>Next Step →</button>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Height (cm)</label><input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} type="number" placeholder="178" value={form.height} onChange={e => update('height', e.target.value)} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Weight (kg)</label><input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} type="number" placeholder="75" value={form.weight} onChange={e => update('weight', e.target.value)} /></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Age</label><input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} type="number" placeholder="24" value={form.age} onChange={e => update('age', e.target.value)} /></div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Gender</label>
                    <select style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} value={form.gender} onChange={e => update('gender', e.target.value)}>
                      <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Body Fat %</label>
                    <input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} type="number" placeholder="15" value={form.bodyFat} onChange={e => update('bodyFat', e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Experience</label>
                    <select style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} value={form.experience} onChange={e => update('experience', e.target.value)}>
                      <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Strength Level</label>
                    <select style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} value={form.strengthLevel} onChange={e => update('strengthLevel', e.target.value)}>
                      <option value="novice">Novice</option><option value="intermediate">Intermediate</option><option value="proficient">Proficient</option><option value="elite">Elite</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Flexibility</label>
                    <select style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} value={form.flexibility} onChange={e => update('flexibility', e.target.value)}>
                      <option value="poor">Poor</option><option value="average">Average</option><option value="good">Good</option><option value="excellent">Excellent</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Mobility</label>
                    <select style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} value={form.mobility} onChange={e => update('mobility', e.target.value)}>
                      <option value="poor">Poor</option><option value="average">Average</option><option value="good">Good</option><option value="excellent">Excellent</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>Injury History</label>
                  <input style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px", color: C.textPrimary, outline: "none" }} type="text" placeholder="None or specify" value={form.injuryHistory} onChange={e => update('injuryHistory', e.target.value)} />
                </div>

                {error && <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}30`, color: C.red, padding: "10px", borderRadius: "8px", fontSize: 13 }}>{error}</div>}

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => { setStep(1); setError(""); }} style={{ width: 48, background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", color: C.textSecondary, cursor: "pointer", fontSize: 16 }}>←</button>
                  <button style={{ flex: 1, background: C.accent, color: "#000", border: "none", padding: "12px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }} onClick={handleNextStep2}>Next Step →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>Fitness Goal</label>
                  <select style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", color: C.textPrimary, outline: "none" }} value={form.fitnessGoal} onChange={e => update('fitnessGoal', e.target.value)}>
                    <option value="fat loss">Fat Loss</option><option value="hypertrophy">Hypertrophy</option><option value="strength">Strength</option><option value="sports">Sports</option><option value="rehab">Rehab</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>Available Equipment</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {["gym", "home workout", "dumbbells", "bodyweight", "resistance bands"].map(eq => (
                      <button key={eq} type="button" style={{ background: form.availableEquipment.includes(eq) ? `${C.accent}25` : C.surface, border: `1px solid ${form.availableEquipment.includes(eq) ? C.accent : C.border}`, color: form.availableEquipment.includes(eq) ? C.accent : C.textSecondary, padding: "8px 14px", borderRadius: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => toggleEquipment(eq)}>
                        {eq.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <div style={{ background: `${C.red}15`, border: `1px solid ${C.red}30`, color: C.red, padding: "10px", borderRadius: "8px", fontSize: 13 }}>{error}</div>}

                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                  <button onClick={() => { setStep(2); setError(""); }} style={{ width: 48, background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", color: C.textSecondary, cursor: "pointer", fontSize: 16 }}>←</button>
                  <button style={{ flex: 1, background: C.accent, color: "#000", border: "none", padding: "14px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }} onClick={handleComplete}>Complete & Calibrate ✓</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}