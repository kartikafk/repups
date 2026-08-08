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
// PAGE 1 — EXISTING CLIENT FULL PROFILE
// ════════════════════════════════════════════════════════════════════════════════
export default function ActiveClientProfile({ onNavigate }) {
  const c = EXISTING_CLIENT;
  const [tab, setTab] = useState("overview");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState(c.trainerNotes);

  const tabs = ["overview", "biomechanics", "workout log", "progress", "finance", "notes"];

  const scoreColor = (s) => s >= 80 ? C.neon : s >= 65 ? C.gold : C.red;
  const planPct = Math.round((c.planWeek / c.planTotal) * 100);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 32px", height: 56, display: "flex", alignItems: "center", gap: 14 }}>
        <button style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>← My Clients</button>
        <div style={{ flex: 1 }} />
        <Bdg color={C.green}>● Active Client</Bdg>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16, color: C.text }}>Rep<span style={{ color: C.neon }}>Ups</span></div>
      </div>

      {/* ── HERO BANNER ── */}
      <div style={{ background: `linear-gradient(135deg, ${C.surface} 0%, ${C.bg} 100%)`, borderBottom: `1px solid ${C.border}`, padding: "28px 32px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: 80, width: 280, height: 280, borderRadius: "50%", background: C.neon, opacity: 0.04, filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Top row */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 24 }}>

            {/* Avatar + online */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 86, height: 86, borderRadius: "50%", background: `${C.neon}14`, border: `3px solid ${C.neon}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: C.neon, boxShadow: `0 0 32px ${C.neonGlow}` }}>{c.avatar}</div>
              {c.online && <div style={{ position: "absolute", bottom: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: C.green, border: `3px solid ${C.surface}`, boxShadow: `0 0 8px ${C.green}` }} />}
            </div>

            {/* Name block */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.4px" }}>{c.name}</h1>
                <Bdg color={C.neon}>Active Client</Bdg>
                {c.online ? <Bdg color={C.green}>● Online Now</Bdg> : <Bdg color={C.sub}>Last seen {c.lastActive}</Bdg>}
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 10 }}>
                {c.age} yrs · {c.gender} · 📍 {c.location} · Client since {c.joinedDate}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onNavigate?.("existing")}
                  style={{ padding: "7px 16px", borderRadius: 9, border: `1px solid ${C.neon}44`, background: C.neonGlow, color: C.neon, fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  🟢 Active Clients
                </button>
                <button onClick={() => onNavigate?.("prospective")}
                  style={{ padding: "7px 16px", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.sub, fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  🟠 Client Requests
                </button>
              </div>
            </div>

            {/* Quick action buttons */}
            <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>
              <button style={{ padding: "10px 18px", background: C.neonGlow, border: `1px solid ${C.neon}40`, borderRadius: 10, color: C.neon, fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💬 Message</button>
              <button style={{ padding: "10px 18px", background: `${C.blue2}18`, border: `1px solid ${C.blue2}40`, borderRadius: 10, color: C.blue2, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>📹 Video Call</button>
              <button style={{ padding: "10px 18px", background: `linear-gradient(135deg,${C.neon},${C.blue2})`, border: "none", borderRadius: 10, color: "#000", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: `0 4px 16px ${C.neonGlow}` }}>Edit Plan</button>
            </div>
          </div>

          {/* Quick metric strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 24 }}>
            {[
              ["Posture Score", c.postureScore, scoreColor(c.postureScore)],
              ["Compliance", c.compliance + "%", C.cyan],
              ["Progress", c.progress + "%", C.neon],
              ["Sessions Done", c.sessionsCompleted, C.blue2],
              ["Form Accuracy", c.dashboardMetrics.formAccuracy + "%", C.purple],
              ["Next Session", c.nextSession, C.gold],
            ].map(([l, v, col]) => (
              <div key={l} style={{ background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 11, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 800, color: col, marginBottom: 3 }}>{v}</div>
                <div style={{ fontSize: 10, color: C.sub }}>{l}</div>
              </div>
            ))}
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

        {/* ─ OVERVIEW ─ */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

            {/* Physical stats */}
            <Card style={{ padding: 22 }}>
              <SecTitle>Physical Stats</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[["Weight", c.weight + " kg", C.neon], ["Height", c.height + " cm", C.blue2], ["Body Fat", c.bodyFat + "%", C.gold], ["BMI", c.bmi, C.cyan], ["Body Type", c.bodyType, C.purple]].map(([l, v, col]) => (
                  <div key={l} style={{ background: C.card2, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: C.sub, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 700, color: col }}>{v}</div>
                  </div>
                ))}
              </div>
              <SecTitle color={C.purple}>Measurements (cm)</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {Object.entries(c.measurements).map(([k, v]) => (
                  <div key={k} style={{ background: C.card2, borderRadius: 9, padding: "9px 11px", textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: C.purple, marginBottom: 2 }}>{v}</div>
                    <div style={{ fontSize: 10, color: C.sub, textTransform: "capitalize" }}>{k}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Fitness profile */}
            <Card style={{ padding: 22 }}>
              <SecTitle>Fitness Profile</SecTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                {[["Primary Goal", c.goal, C.neon], ["Experience", c.experience, C.blue2], ["Training Frequency", c.trainingFrequency, C.cyan], ["Preferred Time", c.preferredTime, C.sub], ["Equipment", c.equipment.join(", "), C.sub]].map(([l, v, col]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.sub }}>{l}</span>
                    <span style={{ fontSize: 12, color: col, fontWeight: 500, textAlign: "right", maxWidth: 220 }}>{v}</span>
                  </div>
                ))}
              </div>

              {c.injuries.length > 0 && (
                <>
                  <SecTitle color={C.red}>Injuries / Limitations</SecTitle>
                  {c.injuries.map((inj, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "9px 12px", background: `${C.red}0a`, border: `1px solid ${C.red}22`, borderRadius: 9, marginBottom: 7 }}>
                      <span style={{ color: C.red, fontSize: 13 }}>⚠</span>
                      <span style={{ fontSize: 12, color: C.sub }}>{inj}</span>
                    </div>
                  ))}
                </>
              )}

              <SecTitle color={C.gold}>Secondary Goals</SecTitle>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {c.secondaryGoals.map(g => <Bdg key={g} color={C.gold}>{g}</Bdg>)}
              </div>
            </Card>

            {/* Current plan */}
            <Card style={{ padding: 22 }}>
              <SecTitle>Current Plan Status</SecTitle>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4 }}>{c.currentPlan}</div>
                  <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>Week {c.planWeek} of {c.planTotal}</div>
                  <Prog value={planPct} h={7} />
                  <div style={{ fontSize: 11, color: C.neon, marginTop: 5 }}>{planPct}% complete</div>
                </div>
                <ScoreRing value={planPct} size={72} color={C.neon} label="done" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <StatBox label="Completed" value={c.sessionsCompleted} color={C.neon} />
                <StatBox label="Remaining" value={c.sessionsRemaining} color={C.gold} />
                <StatBox label="Compliance" value={c.compliance + "%"} color={C.cyan} />
              </div>

              <div style={{ marginTop: 14, padding: "11px 14px", background: C.neonGlow2, border: `1px solid ${C.neon}20`, borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: C.neon, fontWeight: 700, marginBottom: 4 }}>NEXT SESSION</div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{c.nextSession}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{c.sessionType} · 60 min</div>
              </div>
            </Card>

            {/* Personal records */}
            <Card style={{ padding: 22 }}>
              <SecTitle color={C.gold}>Personal Records</SecTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {c.prs.map((pr, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 11 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${C.gold}14`, border: `1px solid ${C.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏆</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{pr.lift}</div>
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{pr.date}</div>
                    </div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 800, color: C.gold }}>{pr.weight}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ─ BIOMECHANICS ─ */}
        {tab === "biomechanics" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Score banner */}
              <Card style={{ padding: 24, border: `1px solid ${C.neon}28`, boxShadow: `0 0 30px ${C.neonGlow}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <ScoreRing value={c.postureScore} size={100} color={scoreColor(c.postureScore)} label="/100" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>
                      Overall Posture Score — <span style={{ color: scoreColor(c.postureScore) }}>
                        {c.postureScore >= 80 ? "Optimal" : c.postureScore >= 65 ? "Moderate" : "Needs Work"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, marginBottom: 12 }}>Last assessed: {c.lastAssessment}. Improvement of +14 pts since intake assessment.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {Object.entries(c.planes).map(([plane, val]) => (
                        <Bdg key={plane} color={scoreColor(val)}>{plane.charAt(0).toUpperCase() + plane.slice(1)}: {val}</Bdg>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 28, fontWeight: 800, color: C.cyan }}>+14 ↑</div>
                    <div style={{ fontSize: 11, color: C.sub }}>since intake</div>
                  </div>
                </div>
              </Card>

              {/* 3-plane breakdown */}
              <Card style={{ padding: 22 }}>
                <SecTitle>3-Plane Analysis</SecTitle>
                {[
                  { plane: "Sagittal", key: "sagittal", desc: "Forward/backward — spine curvature, pelvic tilt", color: C.neon },
                  { plane: "Coronal",  key: "coronal",  desc: "Left/right — shoulder elevation, lateral lean",  color: C.blue2 },
                  { plane: "Transverse",key:"transverse",desc: "Rotational — trunk rotation, scapular winging", color: C.purple },
                ].map(p => {
                  const val = c.planes[p.key];
                  const col = scoreColor(val);
                  return (
                    <div key={p.key} style={{ padding: "16px 18px", background: C.card2, borderRadius: 12, border: `1px solid ${C.border2}`, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{p.plane} Plane</div>
                          <div style={{ fontSize: 11, color: C.sub }}>{p.desc}</div>
                        </div>
                        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 24, fontWeight: 800, color: col }}>{val}</div>
                      </div>
                      <Prog value={val} color={col} h={6} />
                    </div>
                  );
                })}
              </Card>

              {/* Movement flags */}
              <Card style={{ padding: 22 }}>
                <SecTitle color={C.gold}>Detected Movement Flags</SecTitle>
                {c.movementFlags.map((flag, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "11px 14px", background: `${C.gold}0a`, border: `1px solid ${C.gold}22`, borderRadius: 10, marginBottom: 8 }}>
                    <span style={{ color: C.gold, fontSize: 16, flexShrink: 0 }}>⚠</span>
                    <span style={{ fontSize: 13, color: C.sub }}>{flag}</span>
                  </div>
                ))}
              </Card>
            </div>

            {/* Assessment history */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Card style={{ padding: 20 }}>
                <SecTitle>Assessment History</SecTitle>
                {c.assessmentHistory.map((a, i) => {
                  const col = scoreColor(a.score);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < c.assessmentHistory.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ minWidth: 48, fontSize: 11, color: C.sub }}>{a.date}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>{a.type}</div>
                        <Prog value={a.score} color={col} h={4} />
                      </div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 800, color: col, minWidth: 28, textAlign: "right" }}>{a.score}</div>
                    </div>
                  );
                })}
              </Card>

              <Card style={{ padding: 20 }}>
                <SecTitle color={C.cyan}>Trend</SecTitle>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                  {c.assessmentHistory.slice().reverse().map((a, i) => {
                    const h = (a.score / 100) * 70;
                    const col = scoreColor(a.score);
                    const isLast = i === c.assessmentHistory.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 10, color: isLast ? col : C.sub, fontFamily: "monospace" }}>{a.score}</div>
                        <div style={{ width: "100%", height: h, borderRadius: "4px 4px 0 0", background: isLast ? `linear-gradient(180deg,${C.neon},${C.blue2})` : `${C.neon}25`, boxShadow: isLast ? `0 0 10px ${C.neonGlow}` : undefined }} />
                        <div style={{ fontSize: 9, color: C.sub }}>{a.date}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <div style={{ padding: "14px 18px", background: C.neonGlow2, border: `1px solid ${C.neon}20`, borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: C.neon, fontWeight: 700, marginBottom: 6 }}>🤖 AI RECOMMENDATION</div>
                <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.65 }}>Transverse plane lags behind sagittal and coronal. Prioritise anti-rotation work and thoracic mobility drills in the next block. Consider adding Copenhagen planks and Pallof press variations.</p>
              </div>
            </div>
          </div>
        )}

        {/* ─ WORKOUT LOG ─ */}
        {tab === "workout log" && (
          <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <StatBox label="Total Sessions" value={c.sessionsCompleted} color={C.neon} />
              <StatBox label="This Week" value="4" color={C.blue2} />
              <StatBox label="Avg Duration" value="60 min" color={C.cyan} />
              <StatBox label="Compliance" value={c.compliance + "%"} color={C.gold} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {c.recentWorkouts.map((w, i) => (
                <Card key={i} style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: w.exercises > 0 ? C.neonGlow : C.card2, border: `1px solid ${w.exercises > 0 ? `${C.neon}30` : C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {w.exercises > 0 ? "💪" : "🧘"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 3 }}>{w.session}</div>
                          <div style={{ fontSize: 12, color: C.sub }}>{w.date} {w.duration > 0 ? `· ${w.duration} min · ${w.exercises} exercises` : "· Active recovery"}</div>
                        </div>
                        {w.exercises > 0 && <Bdg color={C.neon}>Completed</Bdg>}
                      </div>
                      {w.notes && (
                        <div style={{ fontSize: 12, color: C.sub, padding: "8px 12px", background: C.card2, borderRadius: 8, border: `1px solid ${C.border2}`, fontStyle: "italic" }}>
                          📝 {w.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ─ PROGRESS ─ */}
        {tab === "progress" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Card style={{ padding: 22 }}>
              <SecTitle>Weekly Metrics</SecTitle>
              {[["Steps Today", "8,421", "/ 10,000 goal", C.neon, 84], ["Calories Burned", "2,340 kcal", "/ 2,800 goal", C.red, 84], ["Form Accuracy", "84%", "RepUps AI score", C.cyan, 84], ["Active Streak", "14 days", "Personal best!", C.gold, 93]].map(([l, v, sub, col, pct]) => (
                <div key={l} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{l}</div>
                      <div style={{ fontSize: 11, color: C.sub }}>{sub}</div>
                    </div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 17, fontWeight: 800, color: col }}>{v}</div>
                  </div>
                  <Prog value={pct} color={col} h={6} />
                </div>
              ))}
            </Card>

            <Card style={{ padding: 22 }}>
              <SecTitle color={C.purple}>Goal Progress</SecTitle>
              {[["Strength", 76, C.neon], ["Hypertrophy", 82, C.blue2], ["Consistency", 88, C.cyan], ["Posture", 84, C.purple], ["Nutrition", 65, C.gold], ["Recovery", 72, C.red]].map(([l, v, col]) => (
                <div key={l} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: C.text }}>{l}</span>
                    <span style={{ fontSize: 12, color: col, fontWeight: 600, fontFamily: "monospace" }}>{v}%</span>
                  </div>
                  <Prog value={v} color={col} h={5} />
                </div>
              ))}
            </Card>

            <Card style={{ padding: 22, gridColumn: "1 / -1" }}>
              <SecTitle color={C.gold}>Body Composition Change</SecTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[["Weight", "74 kg", "−4 kg", C.neon], ["Body Fat", "18%", "−3%", C.cyan], ["Muscle Mass", "+2.1 kg", "est. lean gain", C.blue2], ["Posture Score", "84", "+14 pts", C.gold]].map(([l, v, delta, col]) => (
                  <div key={l} style={{ background: C.card2, borderRadius: 12, padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>{l}</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, color: col, marginBottom: 4 }}>{v}</div>
                    <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>{delta}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ─ FINANCE ─ */}
        {tab === "finance" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Card style={{ padding: 22 }}>
              <SecTitle>Package Details</SecTitle>
              {[["Package", `${c.packageSessions} Personal Training Sessions`], ["Total Value", `₹${c.packagePrice.toLocaleString()}`], ["Sessions Used", c.sessionsCompleted], ["Sessions Remaining", c.sessionsRemaining], ["Amount Paid", `₹${c.paidAmount.toLocaleString()}`], ["Pending", c.pendingAmount === 0 ? "₹0 — Fully Paid" : `₹${c.pendingAmount.toLocaleString()}`]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.sub }}>{l}</span>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <Prog value={(c.sessionsCompleted / c.packageSessions) * 100} color={C.neon} h={8} />
                <div style={{ fontSize: 11, color: C.sub, marginTop: 6, textAlign: "center" }}>{c.sessionsCompleted}/{c.packageSessions} sessions used</div>
              </div>
            </Card>

            <Card style={{ padding: 22 }}>
              <SecTitle color={C.gold}>Invoice History</SecTitle>
              {[["Jan 15, 2026", "Package (32 sessions)", "₹25,000", "Paid"], ["Today", "Renewal discussion", "Pending", "Upcoming"]].map(([date, desc, amt, status]) => (
                <div key={date} style={{ padding: "14px 16px", background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 11, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{desc}</span>
                    <Bdg color={status === "Paid" ? C.neon : C.gold}>{status}</Bdg>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: C.sub }}>{date}</span>
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 800, color: C.gold }}>{amt}</span>
                  </div>
                </div>
              ))}
              <button style={{ width: "100%", marginTop: 8, padding: "11px", background: `linear-gradient(135deg,${C.neon},${C.blue2})`, border: "none", borderRadius: 10, color: "#000", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Offer Renewal Package
              </button>
            </Card>
          </div>
        )}

        {/* ─ NOTES ─ */}
        {tab === "notes" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 18 }}>
            <Card style={{ padding: 22 }}>
              <SecTitle>Private Trainer Notes</SecTitle>
              <div style={{ background: `${C.red}08`, border: `1px solid ${C.red}20`, borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 8 }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>🔒</span>
                <span style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>These notes are private and only visible to you. The client cannot see them.</span>
              </div>
              {notes.map((n, i) => (
                <div key={i} style={{ padding: "14px 16px", background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: C.neon, fontWeight: 700, marginBottom: 7 }}>{n.date}</div>
                  <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{n.note}</div>
                </div>
              ))}
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Card style={{ padding: 20 }}>
                <SecTitle>Add Note</SecTitle>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Write a session note, observation, or flag…"
                  style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "12px 14px", resize: "vertical", minHeight: 120, outline: "none", marginBottom: 12 }} />
                <button onClick={() => { if (noteText.trim()) { setNotes([{ date: "Today", note: noteText }, ...notes]); setNoteText(""); } }}
                  style={{ width: "100%", padding: "11px", background: `linear-gradient(135deg,${C.neon},${C.blue2})`, border: "none", borderRadius: 10, color: "#000", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer", boxShadow: `0 4px 14px ${C.neonGlow}` }}>
                  Save Note
                </button>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}