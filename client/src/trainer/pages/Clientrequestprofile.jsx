import { useState } from "react";

// ─── NEON BLUE TOKENS ─────────────────────────────────────────────────────────
const C = {
  bg:        "#050508",
  surface:   "#08080e",
  card:      "#0d0d18",
  card2:     "#111120",
  border:    "#1a1a30",
  border2:   "#222240",
  neon:      "#00c3ff",
  neonGlow:  "rgba(0,195,255,0.10)",
  neonGlow2: "rgba(0,195,255,0.04)",
  blue2:     "#3d6fff",
  purple:    "#7b5fff",
  purpleGlow:"rgba(123,95,255,0.10)",
  cyan:      "#00f5d4",
  cyanGlow:  "rgba(0,245,212,0.08)",
  red:       "#ff3c5a",
  redGlow:   "rgba(255,60,90,0.08)",
  gold:      "#ffb800",
  goldGlow:  "rgba(255,184,0,0.08)",
  green:     "#00e676",
  orange:    "#ff8c00",
  text:      "#e8e8f0",
  sub:       "#5a5a80",
  muted:     "#2a2a45",
};

// ─── MOCK DATA — EXISTING CLIENT ──────────────────────────────────────────────
const EXISTING_CLIENT = {
  id: 1,
  name: "Arjun Mehta",
  avatar: "AM",
  age: 26,
  gender: "Male",
  location: "Andheri, Mumbai",
  phone: "+91 98200 11111",
  email: "arjun@email.com",
  joinedDate: "Jan 15, 2026",
  status: "active",
  online: true,
  lastActive: "2 hours ago",

  // Physical stats
  weight: 74,
  height: 178,
  bodyFat: 18,
  bmi: 23.4,
  bodyType: "Athletic",
  measurements: { chest: 96, waist: 82, hips: 94, shoulders: 118, arms: 36, thighs: 56 },

  // Fitness profile
  goal: "Muscle Gain / Hypertrophy",
  secondaryGoals: ["Improve posture", "Increase strength"],
  experience: "Intermediate",
  trainingFrequency: "5 days/week",
  preferredTime: "Evening (5–8 PM)",
  equipment: ["Full gym access", "Resistance bands"],
  injuries: ["Previous right shoulder impingement (resolved)"],
  limitations: [],

  // Trainer relationship
  currentPlan: "Hypertrophy Block A",
  planWeek: 6,
  planTotal: 8,
  sessionsCompleted: 22,
  sessionsRemaining: 10,
  nextSession: "Today, 5:00 PM",
  sessionType: "Personal Training",
  streak: 14,
  compliance: 88,
  progress: 82,

  // Posture & biomechanics
  postureScore: 84,
  planes: { sagittal: 84, coronal: 82, transverse: 80 },
  movementFlags: ["Slight anterior pelvic tilt", "Right shoulder elevation tendency"],
  lastAssessment: "Today",
  assessmentHistory: [
    { date: "Jul 28", score: 84, type: "Squat Analysis" },
    { date: "Jul 14", score: 79, type: "Posture Assessment" },
    { date: "Jun 30", score: 74, type: "Movement Screening" },
    { date: "Jun 16", score: 70, type: "Initial Assessment" },
  ],

  // Dashboard metrics
  dashboardMetrics: { steps: 8421, caloriesBurned: 2340, formAccuracy: 84, activeStreak: 14 },

  // Workout logs (last 5)
  recentWorkouts: [
    { date: "Today",     session: "Push Day A", exercises: 5, duration: 58, notes: "Increased bench to 82.5kg. Good form maintained." },
    { date: "Yesterday", session: "Rest Day",   exercises: 0, duration: 0,  notes: "Mobility work completed." },
    { date: "Mon",       session: "Pull Day A", exercises: 5, duration: 62, notes: "Pull-ups with +10kg. PB on cable row." },
    { date: "Sun",       session: "Leg Day A",  exercises: 6, duration: 70, notes: "Squat 100kg×5. Hip crease below parallel." },
    { date: "Sat",       session: "Push Day B", exercises: 5, duration: 55, notes: "OHP feeling strong. Added one rep each set." },
  ],

  // Performance PRs
  prs: [
    { lift: "Bench Press",  weight: "82.5 kg", date: "Today"         },
    { lift: "Deadlift",     weight: "120 kg",  date: "3 weeks ago"   },
    { lift: "Squat",        weight: "100 kg",  date: "Last week"     },
    { lift: "OHP",          weight: "60 kg",   date: "2 weeks ago"   },
  ],

  // Private trainer notes
  trainerNotes: [
    { date: "Jul 28", note: "Right shoulder elevation persists under fatigue. Added more face pulls and rear delt work to compensate. Monitor next 2 sessions." },
    { date: "Jul 14", note: "Client reporting good sleep and energy. Appetite strong. Ready to push volume next block." },
    { date: "Jun 30", note: "Knee tracking improved significantly. Anterior pelvic tilt still needs attention during heavy squat sets." },
  ],

  // Finance
  packagePrice: 25000,
  packageSessions: 32,
  paidAmount: 25000,
  pendingAmount: 0,
};

// ─── MOCK DATA — PROSPECTIVE CLIENT ──────────────────────────────────────────
const PROSPECTIVE_CLIENT = {
  id: 101,
  name: "Ishaan Desai",
  avatar: "ID",
  age: 29,
  gender: "Male",
  location: "Bandra, Mumbai",
  phone: "+91 99200 22222",
  email: "ishaan@email.com",
  requestDate: "2 hours ago",
  requestStatus: "pending",
  online: false,

  // What they shared during onboarding
  weight: 85,
  height: 175,
  bodyFat: 26,
  bmi: 27.8,
  bodyType: "Heavy",
  goal: "Weight Loss & Tone",
  secondaryGoals: ["Build core strength", "Improve energy"],
  experience: "Beginner",
  trainingFrequency: "3–4 days/week",
  preferredTime: "Morning (7–9 AM)",
  preferredLocation: "Home Training",
  equipment: ["Dumbbells (up to 20kg)", "Resistance bands", "Pull-up bar"],
  injuries: ["Lower back pain — chronic (2 years)"],
  limitations: ["Cannot perform high-impact movements"],
  budget: "₹2,000–3,500 / session",
  preferredTrainerGender: "No preference",

  // RepUps AI assessment (done before reaching out)
  postureScore: 62,
  planes: { sagittal: 58, coronal: 65, transverse: 64 },
  movementFlags: ["Anterior pelvic tilt — severe", "Lumbar hyperextension", "Forward head posture"],
  assessmentDate: "Yesterday",

  // Their message to the trainer
  introMessage: "Hi Vikram, I've been struggling with my weight for a few years and finally decided to take it seriously. I have chronic lower back pain which has made me hesitant to exercise, but I saw your specialization in corrective exercise and thought you might be the right fit. I work from home, so home training would be ideal. Looking forward to hearing from you.",

  // Matching score
  matchScore: 94,
  matchReasons: [
    "Goal matches your weight loss expertise",
    "Lower back issue aligns with corrective exercise specialization",
    "Home training — you offer this service",
    "Location: Bandra (within your service area)",
    "Budget matches your home training rate",
  ],

  // Similar clients you've worked with
  similarClients: ["Priya Sharma (Fat Loss)", "Neha Kapoor (Corrective)"],
};

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
function Av({ initials, size = 40, color = C.neon }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}14`, border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 700, color, flexShrink: 0, fontFamily: "Syne, sans-serif" }}>
      {initials}
    </div>
  );
}

function Bdg({ children, color = C.neon }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.4px", background: `${color}14`, color, border: `1px solid ${color}28` }}>
      {children}
    </span>
  );
}

function Card({ children, style = {}, glow = false }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${glow ? `${C.neon}30` : C.border}`, borderRadius: 16, boxShadow: glow ? `0 0 28px ${C.neonGlow}` : undefined, ...style }}>
      {children}
    </div>
  );
}

function SecTitle({ children, color = C.neon }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", color: C.sub, textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 3, height: 12, borderRadius: 2, background: color }} />
      {children}
    </div>
  );
}

function Prog({ value, color = C.neon, h = 5 }) {
  return (
    <div style={{ height: h, borderRadius: h / 2, background: C.border, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, borderRadius: h / 2, background: color, boxShadow: `0 0 8px ${color}55`, transition: "width 0.8s ease" }} />
    </div>
  );
}

function ScoreRing({ value, size = 80, color = C.neon, label = "" }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (value / 100);
  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        {label && <div style={{ fontSize: 9, color: C.sub, marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
}

function StatBox({ label, value, color = C.neon }) {
  return (
    <div style={{ background: C.card2, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 800, color, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.sub }}>{label}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// PAGE 2 — PROSPECTIVE CLIENT INQUIRY PROFILE
// ════════════════════════════════════════════════════════════════════════════════
export default function ClientRequestProfile({ onNavigate }) {
  const p = PROSPECTIVE_CLIENT;
  const [tab, setTab] = useState("inquiry");
  const [replyText, setReplyText] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [customPrice, setCustomPrice] = useState("3500");

  const tabs = ["inquiry", "their profile", "biomechanics", "match analysis"];
  const scoreColor = (s) => s >= 80 ? C.neon : s >= 65 ? C.gold : C.red;

  if (accepted) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${C.green}20`, border: `2px solid ${C.green}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: `0 0 40px rgba(0,230,118,0.2)` }}>✓</div>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 800, color: C.text }}>Request Accepted!</div>
      <div style={{ fontSize: 14, color: C.sub }}>Ishaan has been notified. You can now message and schedule your first session.</div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ padding: "12px 24px", background: `linear-gradient(135deg,${C.neon},${C.blue2})`, border: "none", borderRadius: 11, color: "#000", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Open Chat →</button>
        <button onClick={() => setAccepted(false)} style={{ padding: "12px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 11, color: C.sub, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>← Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 32px", height: 56, display: "flex", alignItems: "center", gap: 14 }}>
        <button style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>← Requests</button>
        <div style={{ flex: 1 }} />
        <Bdg color={C.orange}>● New Request · 2 hours ago</Bdg>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16, color: C.text }}>Rep<span style={{ color: C.neon }}>Ups</span></div>
      </div>

      {/* ── HERO ── */}
      <div style={{ background: `linear-gradient(135deg,${C.surface},${C.bg})`, borderBottom: `1px solid ${C.border}`, padding: "28px 32px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, left: 100, width: 200, height: 200, borderRadius: "50%", background: C.orange, opacity: 0.04, filter: "blur(50px)" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* AI match banner */}
          <div style={{ background: `${C.neon}08`, border: `1px solid ${C.neon}28`, borderRadius: 12, padding: "12px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12, boxShadow: `0 0 20px ${C.neonGlow}` }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, color: C.neon, fontWeight: 700 }}>RepUps AI Match Score: {p.matchScore}%</span>
              <span style={{ fontSize: 12, color: C.sub, marginLeft: 10 }}>This client aligns strongly with your specializations and availability.</span>
            </div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: C.neon }}>{p.matchScore}%</div>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${C.orange}14`, border: `3px solid ${C.orange}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: C.orange }}>
                {p.avatar}
              </div>
              <div style={{ position: "absolute", bottom: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: C.sub, border: `3px solid ${C.surface}` }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>{p.name}</h1>
                <Bdg color={C.orange}>New Request</Bdg>
                <Bdg color={C.sub}>Prospective Client</Bdg>
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 10 }}>
                {p.age} yrs · {p.gender} · 📍 {p.location} · Requested {p.requestDate}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                <Bdg color={C.blue2}>{p.goal}</Bdg>
                <Bdg color={C.purple}>{p.experience}</Bdg>
                <Bdg color={C.cyan}>🏠 {p.preferredLocation}</Bdg>
                <Bdg color={C.gold}>{p.budget}</Bdg>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onNavigate?.("existing")}
                  style={{ padding: "7px 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.sub, fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  🟢 Active Clients
                </button>
                <button onClick={() => onNavigate?.("prospective")}
                  style={{ padding: "7px 16px", borderRadius: 9, border: `1px solid ${C.orange}44`, background: `${C.orange}14`, color: C.orange, fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  🟠 Client Requests
                </button>
              </div>
            </div>

            {/* Accept/Decline CTA */}
            {!declined && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, minWidth: 200 }}>
                <button onClick={() => setAccepted(true)}
                  style={{ padding: "12px 24px", background: `linear-gradient(135deg,${C.neon},${C.blue2})`, border: "none", borderRadius: 11, color: "#000", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 18px ${C.neonGlow}` }}>
                  ✓ Accept Request
                </button>
                <button onClick={() => setDeclined(true)}
                  style={{ padding: "11px 24px", background: C.redGlow, border: `1px solid ${C.red}44`, borderRadius: 11, color: C.red, fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  ✕ Decline
                </button>
                <button style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 11, color: C.sub, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
                  💬 Send Message First
                </button>
              </div>
            )}
            {declined && (
              <div style={{ padding: "16px 20px", background: C.redGlow, border: `1px solid ${C.red}30`, borderRadius: 12, textAlign: "center", minWidth: 200 }}>
                <div style={{ fontSize: 13, color: C.red, fontWeight: 700, marginBottom: 8 }}>Request Declined</div>
                <button onClick={() => setDeclined(false)} style={{ fontSize: 12, color: C.sub, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Undo</button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "10px 18px", borderRadius: "9px 9px 0 0", border: `1px solid ${tab === t ? `${C.neon}40` : "transparent"}`, borderBottom: `1px solid ${tab === t ? C.card : "transparent"}`, background: tab === t ? C.card : "transparent", color: tab === t ? C.neon : C.sub, cursor: "pointer", fontSize: 12, fontFamily: "Syne, sans-serif", fontWeight: tab === t ? 700 : 400, textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px 80px" }}>

        {/* ─ INQUIRY ─ */}
        {tab === "inquiry" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Their message */}
              <Card style={{ padding: 24 }}>
                <SecTitle>Their Introduction</SecTitle>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <Av initials={p.avatar} size={44} color={C.orange} />
                  <div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>{p.name}</div>
                    <div style={{ background: C.card2, border: `1px solid ${C.border2}`, borderRadius: "12px 12px 12px 4px", padding: "14px 18px" }}>
                      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.8 }}>{p.introMessage}</p>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{p.requestDate}</div>
                  </div>
                </div>
              </Card>

              {/* Reply box */}
              <Card style={{ padding: 24 }}>
                <SecTitle>Your Response</SecTitle>
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder={`Hi ${p.name.split(" ")[0]}, thanks for reaching out! I reviewed your profile and…`}
                  style={{ width: "100%", background: C.card2, border: `1px solid ${C.neon}30`, borderRadius: 12, color: C.text, fontFamily: "inherit", fontSize: 14, padding: "14px 16px", resize: "vertical", minHeight: 120, outline: "none", marginBottom: 16 }} />

                <div style={{ padding: "14px 16px", background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 10, textTransform: "uppercase" }}>Propose a Rate</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: C.sub }}>₹</span>
                    <input value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                      style={{ width: 120, background: "transparent", border: `1px solid ${C.neon}40`, borderRadius: 8, color: C.neon, fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 800, padding: "8px 12px", outline: "none", textAlign: "center" }} />
                    <span style={{ fontSize: 13, color: C.sub }}>per session (Home Training)</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setAccepted(true)}
                    style={{ flex: 1, padding: "12px", background: `linear-gradient(135deg,${C.neon},${C.blue2})`, border: "none", borderRadius: 10, color: "#000", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 16px ${C.neonGlow}` }}>
                    Accept & Reply
                  </button>
                  <button style={{ padding: "12px 18px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
                    Send Message Only
                  </button>
                </div>
              </Card>
            </div>

            {/* Right: quick overview */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Card style={{ padding: 20 }}>
                <SecTitle>Quick Overview</SecTitle>
                {[["Goal", p.goal], ["Experience", p.experience], ["Location", p.location], ["Preferred Time", p.preferredTime], ["Training Style", p.preferredLocation], ["Budget", p.budget]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.sub }}>{l}</span>
                    <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </Card>

              <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}22`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 10 }}>⚠ HEALTH FLAGS</div>
                {p.injuries.map((inj, i) => <div key={i} style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>• {inj}</div>)}
                {p.limitations.map((lim, i) => <div key={i} style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>• {lim}</div>)}
              </div>

              <Card style={{ padding: 20 }}>
                <SecTitle color={C.cyan}>Posture Snapshot</SecTitle>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                  <ScoreRing value={p.postureScore} size={88} color={scoreColor(p.postureScore)} label="/100" />
                </div>
                {Object.entries(p.planes).map(([plane, val]) => {
                  const col = scoreColor(val);
                  return (
                    <div key={plane} style={{ marginBottom: 9 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: C.sub, textTransform: "capitalize" }}>{plane}</span>
                        <span style={{ fontSize: 11, color: col, fontWeight: 600 }}>{val}</span>
                      </div>
                      <Prog value={val} color={col} h={4} />
                    </div>
                  );
                })}
                <button onClick={() => setTab("biomechanics")} style={{ width: "100%", marginTop: 10, padding: "9px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 9, color: C.sub, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>View full assessment →</button>
              </Card>
            </div>
          </div>
        )}

        {/* ─ THEIR PROFILE ─ */}
        {tab === "their profile" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

            <Card style={{ padding: 22 }}>
              <SecTitle>Physical Stats</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[["Weight", p.weight + " kg", C.neon], ["Height", p.height + " cm", C.blue2], ["Body Fat", p.bodyFat + "%", C.gold], ["BMI", p.bmi, C.red], ["Body Type", p.bodyType, C.purple]].map(([l, v, col]) => (
                  <div key={l} style={{ background: C.card2, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: C.sub, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 700, color: col }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 14px", background: `${C.gold}0a`, border: `1px solid ${C.gold}22`, borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 4 }}>BMI NOTE</div>
                <div style={{ fontSize: 12, color: C.sub }}>BMI 27.8 — Overweight range. Weight loss goal is appropriate. Factor in lower-back limitation when programming cardio.</div>
              </div>
            </Card>

            <Card style={{ padding: 22 }}>
              <SecTitle>Fitness Profile</SecTitle>
              {[["Primary Goal", p.goal], ["Experience", p.experience], ["Frequency", p.trainingFrequency], ["Preferred Time", p.preferredTime], ["Location", p.preferredLocation], ["Equipment", p.equipment.join(", ")]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.sub }}>{l}</span>
                  <span style={{ fontSize: 12, color: C.text, maxWidth: 200, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </Card>

            <Card style={{ padding: 22 }}>
              <SecTitle color={C.red}>Health & Injury History</SecTitle>
              {p.injuries.map((inj, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "11px 14px", background: `${C.red}0a`, border: `1px solid ${C.red}22`, borderRadius: 10, marginBottom: 8 }}>
                  <span style={{ color: C.red, fontSize: 14 }}>⚠</span>
                  <span style={{ fontSize: 13, color: C.sub }}>{inj}</span>
                </div>
              ))}
              {p.limitations.map((lim, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "9px 12px", background: `${C.orange}0a`, border: `1px solid ${C.orange}22`, borderRadius: 9, marginBottom: 6 }}>
                  <span style={{ color: C.orange, fontSize: 14 }}>🚫</span>
                  <span style={{ fontSize: 12, color: C.sub }}>{lim}</span>
                </div>
              ))}
            </Card>

            <Card style={{ padding: 22 }}>
              <SecTitle>Goals</SecTitle>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>PRIMARY</div>
                <Bdg color={C.neon}>{p.goal}</Bdg>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>SECONDARY</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.secondaryGoals.map(g => <Bdg key={g} color={C.cyan}>{g}</Bdg>)}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ─ BIOMECHANICS ─ */}
        {tab === "biomechanics" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <Card style={{ padding: 24, border: `1px solid ${scoreColor(p.postureScore)}30` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <ScoreRing value={p.postureScore} size={100} color={scoreColor(p.postureScore)} label="/100" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>
                      Posture Score — <span style={{ color: scoreColor(p.postureScore) }}>Needs Work</span>
                    </div>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>Client completed a RepUps AI assessment {p.assessmentDate}. Significant issues detected in the sagittal plane — likely contributing to reported lower back pain.</p>
                  </div>
                </div>
              </Card>

              <Card style={{ padding: 22 }}>
                <SecTitle>3-Plane Analysis</SecTitle>
                {[{ plane: "Sagittal", key: "sagittal", desc: "Anterior pelvic tilt + lumbar hyperextension detected" },
                  { plane: "Coronal",  key: "coronal",  desc: "Mild left lateral lean" },
                  { plane: "Transverse",key:"transverse",desc: "Compensatory rotation pattern noted" }].map(p2 => {
                  const val = p.planes[p2.key];
                  const col = scoreColor(val);
                  return (
                    <div key={p2.key} style={{ padding: "14px 16px", background: C.card2, border: `1px solid ${col}22`, borderRadius: 12, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{p2.plane} Plane</div>
                          <div style={{ fontSize: 11, color: C.sub }}>{p2.desc}</div>
                        </div>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: col }}>{val}</div>
                      </div>
                      <Prog value={val} color={col} h={6} />
                    </div>
                  );
                })}
              </Card>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Card style={{ padding: 20 }}>
                <SecTitle color={C.red}>Movement Flags</SecTitle>
                {p.movementFlags.map((flag, i) => (
                  <div key={i} style={{ padding: "10px 13px", background: `${C.red}0a`, border: `1px solid ${C.red}22`, borderRadius: 9, marginBottom: 8, display: "flex", gap: 8 }}>
                    <span style={{ color: C.red, fontSize: 14 }}>⚠</span>
                    <span style={{ fontSize: 12, color: C.sub }}>{flag}</span>
                  </div>
                ))}
              </Card>

              <div style={{ background: `${C.neon}08`, border: `1px solid ${C.neon}28`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, color: C.neon, fontWeight: 700, marginBottom: 8 }}>🤖 AI TRAINER NOTE</div>
                <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.7 }}>This client's lower back pain is very likely linked to severe anterior pelvic tilt (sagittal score: 58). Starting with corrective hip flexor/glute work and avoiding spinal flexion under load will be critical. Your FMS Level 2 certification is specifically suited for this intake.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─ MATCH ANALYSIS ─ */}
        {tab === "match analysis" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Score breakdown */}
              <Card style={{ padding: 24, border: `1px solid ${C.neon}28`, boxShadow: `0 0 28px ${C.neonGlow}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 52, fontWeight: 800, color: C.neon, lineHeight: 1 }}>{p.matchScore}%</div>
                    <div style={{ fontSize: 12, color: C.sub }}>AI Match Score</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Strong Match</div>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>RepUps AI matched this client to you based on your specializations, location, service types, and availability. {p.name.split(" ")[0]}'s corrective exercise needs align directly with your FMS certification.</p>
                  </div>
                </div>
                <Prog value={p.matchScore} h={8} />
              </Card>

              <Card style={{ padding: 22 }}>
                <SecTitle color={C.green}>Why This Is a Good Match</SecTitle>
                {p.matchReasons.map((reason, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 14px", background: `${C.green}08`, border: `1px solid ${C.green}20`, borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${C.green}20`, border: `1px solid ${C.green}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.green, fontWeight: 700, flexShrink: 0 }}>✓</div>
                    <span style={{ fontSize: 13, color: C.sub }}>{reason}</span>
                  </div>
                ))}
              </Card>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Card style={{ padding: 20 }}>
                <SecTitle color={C.cyan}>Similar Clients You've Coached</SecTitle>
                {p.similarClients.map((sc, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: i === 0 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.neonGlow, border: `1px solid ${C.neon}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.neon, fontWeight: 700, flexShrink: 0 }}>
                      {sc.split(" ")[0][0]}{sc.split(" ")[1][0]}
                    </div>
                    <span style={{ fontSize: 13, color: C.sub }}>{sc}</span>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: C.sub, marginTop: 10, lineHeight: 1.6 }}>You have proven results with this client type. Use their success as a reference.</div>
              </Card>

              <Card style={{ padding: 20 }}>
                <SecTitle>Potential Revenue</SecTitle>
                {[["Per Session", `₹${customPrice}`], ["Monthly (×12 sessions)", `₹${(parseInt(customPrice) * 12).toLocaleString()}`], ["Package (24 sessions)", `₹${(parseInt(customPrice) * 24).toLocaleString()}`]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.sub }}>{l}</span>
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 800, color: C.gold }}>{v}</span>
                  </div>
                ))}
              </Card>

              <button onClick={() => setAccepted(true)}
                style={{ padding: "14px", background: `linear-gradient(135deg,${C.neon},${C.blue2})`, border: "none", borderRadius: 12, color: "#000", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: `0 4px 20px ${C.neonGlow}` }}>
                ✓ Accept This Client
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}