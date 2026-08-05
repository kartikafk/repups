import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#0a0a0a", surface: "#111111", card: "#161616", border: "#222222",
  lime: "#C8F135", red: "#FF4444", blue: "#3B82F6", purple: "#B892FF", orange: "#FF9F43",
  muted: "#555555", text: "#EEEEEE", sub: "#888888",
};

const dashboardData = {
  streak: 12,
  postureScore: 78,
  activeMinutesGoal: 60,
  caloriesLogged: 1740,
  calorieGoal: 2000,
  todayPlan: { name: "Leg Day — Push Focus", exercisesDone: 0, exercisesTotal: 4, estMinutes: 45 },
  coachTip: "Your posture score is up 6 points this week. Keep prioritizing the hip mobility routine before squats.",
};

const quickLinks = [
  { id: "posture", label: "Posture", icon: "🧍", color: C.blue, route: "/posture-assessment" },
  { id: "trainer", label: "Find Trainer", icon: "🤝", color: C.lime, route: "/trainers" },
  { id: "ai-coach", label: "AI Coach", icon: "🤖", color: "#FF9F43", route: "/ai-coach" },
  { id: "community", label: "Community", icon: "👥", color: "#B892FF", route: "/community" },
];

const badgeDefs = [
  { id: "streak7", label: "7 Day Streak", icon: "🔥", type: "streak", threshold: 7 },
  { id: "streak14", label: "14 Day Streak", icon: "⚡", type: "streak", threshold: 14 },
  { id: "streak30", label: "30 Day Streak", icon: "🏅", type: "streak", threshold: 30 },
  { id: "gym10", label: "10 Gym Visits", icon: "🏢", type: "gym", threshold: 10 },
  { id: "gym25", label: "Gym Regular", icon: "🏆", type: "gym", threshold: 25 },
  { id: "prbreak", label: "PR Breaker", icon: "💥", type: "pr", threshold: 1 },
];

const epley1RM = (weight, reps) => Math.round(weight * (1 + reps / 30) * 10) / 10;

const getMuscleGroup = (exerciseName = "") => {
  const name = exerciseName.toLowerCase();
  if (name.includes("squat") || name.includes("leg") || name.includes("calf") || name.includes("deadlift")) return "Legs";
  if (name.includes("bench") || name.includes("push") || name.includes("chest") || name.includes("fly")) return "Chest";
  if (name.includes("row") || name.includes("pull") || name.includes("lat") || name.includes("chin")) return "Back";
  if (name.includes("press") || name.includes("shoulder") || name.includes("raise")) return "Shoulders";
  if (name.includes("curl") || name.includes("tricep") || name.includes("extension")) return "Arms";
  return "Core";
};

function Ring({ pct, color, size = 70, stroke = 7, icon, value, label }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 8px" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: C.sub }}>{label}</div>
    </div>
  );
}

function LineChart({ points, color, metricKey, unit }) {
  const width = 640, height = 200, padX = 30, padY = 24;
  if (!points || points.length === 0) return <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.sub, fontSize: 12 }}>No graph data available for this timeframe</div>;

  const values = points.map(p => p[metricKey] || 0);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const isFlat = max === min;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1 || 1)) * (width - padX * 2);
    const y = isFlat
      ? height / 2
      : height - padY - ((p[metricKey] - min) / range) * (height - padY * 2);
    return { x, y, ...p };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - padY} L ${coords[0].x} ${height - padY} Z`;
  const maxPoint = coords.reduce((a, b) => ((b[metricKey] || 0) > (a[metricKey] || 0) ? b : a), coords[0]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      <defs>
        <linearGradient id="rp-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={padX} x2={width - padX} y1={padY + f * (height - padY * 2)} y2={padY + f * (height - padY * 2)}
          stroke={C.border} strokeWidth="1" />
      ))}
      <path d={areaD} fill="url(#rp-fade)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={c[metricKey] === maxPoint[metricKey] ? 5 : 3.5}
            fill={c[metricKey] === maxPoint[metricKey] ? color : C.bg}
            stroke={color} strokeWidth="2" />
          {c[metricKey] === maxPoint[metricKey] && (
            <text x={c.x} y={c.y - 12} textAnchor="middle" fontSize="12" fontWeight="900" fill={color}
              fontFamily="'Barlow Condensed',sans-serif">{c[metricKey]}{unit}</text>
          )}
        </g>
      ))}
      {coords.map((c, i) => (
        (i === 0 || i === coords.length - 1 || i % Math.max(1, Math.floor(coords.length / 5)) === 0) && (
          <text key={"lbl"+i} x={c.x} y={height - 4} textAnchor="middle" fontSize="9" fill={C.sub}>{c.date}</text>
        )
      ))}
    </svg>
  );
}

function MuscleGroupMetricWidget({ userId }) {
  const muscleGroups = ["Legs", "Chest", "Back", "Shoulders", "Arms", "Core"];
  const [selectedMuscle, setSelectedMuscle] = useState("Legs");
  const [metric, setMetric] = useState("oneRM");
  const [timeframe, setTimeframe] = useState("1month");
  const [muscleLogs, setMuscleLogs] = useState({});

  useEffect(() => {
    if (!userId) return;
    async function fetchAndAggregate() {
      try {
        const res = await fetch(`/api/sessions?userId=${userId}`);
        if (res.ok) {
          const sessions = await res.json();
          const groupedByMuscle = {};

          const sortedSessions = [...sessions].sort((a, b) => {
            const ta = a.date ? new Date(a.date).getTime() : 0;
            const tb = b.date ? new Date(b.date).getTime() : 0;
            return ta - tb;
          });

          sortedSessions.forEach((s, i) => {
            const muscle = s.muscleGroup || getMuscleGroup(s.exercise);
            if (!groupedByMuscle[muscle]) groupedByMuscle[muscle] = [];

            const rawDate = s.date ? new Date(s.date) : new Date();
            const label = !isNaN(rawDate.getTime()) ? rawDate.toISOString().split('T')[0] : `Day ${i + 1}`;
            const weight = Number(s.weight) || 0;
            const reps = s.reps?.length || Number(s.repCount) || 1;
            const volume = weight * reps;
            const score = Number(s.avgScore) || Number(s.formAccuracy) || 85;
            const oneRM = epley1RM(weight, reps);

            groupedByMuscle[muscle].push({
              rawDate: rawDate,
              date: label.slice(5),
              oneRM,
              volume,
              formAccuracy: Math.round(score),
            });
          });

          setMuscleLogs(groupedByMuscle);
        }
      } catch (err) {
        console.error("Failed to load aggregated muscle group metrics:", err);
      }
    }
    fetchAndAggregate();
  }, [userId]);

  const metricConfig = {
    oneRM: { label: "Peak Estimated 1RM", unit: "kg", color: C.lime },
    volume: { label: "Total Volume Load", unit: "kg", color: C.blue },
    formAccuracy: { label: "Avg Form Accuracy", unit: "%", color: C.purple }
  };

  const currentConfig = metricConfig[metric];
  
  const allPoints = muscleLogs[selectedMuscle] || [];
  const filteredPoints = useMemo(() => {
    if (allPoints.length === 0) return [];
    if (timeframe === "lifetime") return allPoints;

    const now = new Date();
    let cutoff = new Date();

    if (timeframe === "1week") cutoff.setDate(now.getDate() - 7);
    else if (timeframe === "1month") cutoff.setMonth(now.getMonth() - 1);
    else if (timeframe === "3months") cutoff.setMonth(now.getMonth() - 3);
    else if (timeframe === "6months") cutoff.setMonth(now.getMonth() - 6);
    else if (timeframe === "1year") cutoff.setFullYear(now.getFullYear() - 1);
    else return allPoints;

    return allPoints.filter(p => p.rawDate >= cutoff);
  }, [allPoints, timeframe]);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>
            MUSCLE GROUP PERFORMANCE
          </div>
          <div style={{ fontSize: 11, color: C.sub }}>Aggregated metrics across targeted muscle groups</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)} style={{
            background: C.surface, border: `1px solid ${C.border}`, color: C.text,
            borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", outline: "none", fontFamily: "inherit"
          }}>
            <option value="1week">1 Week</option>
            <option value="1month">1 Month</option>
            <option value="3months">3 Months</option>
            <option value="6months">6 Months</option>
            <option value="1year">1 Year</option>
            <option value="lifetime">Lifetime</option>
          </select>

          <div style={{ display: "flex", background: C.surface, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            {[
              { id: "oneRM", label: "1RM" },
              { id: "volume", label: "Volume" },
              { id: "formAccuracy", label: "Form" }
            ].map(m => (
              <button key={m.id} onClick={() => setMetric(m.id)} style={{
                background: metric === m.id ? currentConfig.color + "22" : "transparent",
                border: metric === m.id ? `1px solid ${currentConfig.color}` : "none",
                color: metric === m.id ? currentConfig.color : C.sub,
                borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
              }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {muscleGroups.map(muscle => (
          <button key={muscle} onClick={() => setSelectedMuscle(muscle)} style={{
            background: selectedMuscle === muscle ? currentConfig.color : C.surface,
            border: `1px solid ${selectedMuscle === muscle ? currentConfig.color : C.border}`,
            color: selectedMuscle === muscle ? "#000" : C.text, borderRadius: 99, padding: "6px 14px",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {muscle}
          </button>
        ))}
      </div>

      {filteredPoints.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: C.sub, fontSize: 12 }}>
          No session activity recorded for {selectedMuscle} in this timeframe. Complete a workout to view performance graphs!
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2 }}>{selectedMuscle} — {currentConfig.label}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: currentConfig.color, fontFamily: "'Barlow Condensed',sans-serif" }}>
                {filteredPoints[filteredPoints.length - 1]?.[metric]} {currentConfig.unit}
              </div>
            </div>
          </div>

          <LineChart points={filteredPoints} color={currentConfig.color} metricKey={metric} unit={currentConfig.unit} />
        </>
      )}
    </div>
  );
}

function CalorieTracker() {
  const [logged, setLogged] = useState(dashboardData.caloriesLogged);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [mealLabel, setMealLabel] = useState("");
  const goal = dashboardData.calorieGoal;
  const pct = Math.min((logged / goal) * 100, 100);

  const submit = () => {
    const kcal = Number(amount);
    if (!kcal || kcal <= 0) return;
    setLogged(l => l + kcal);
    setAmount(""); setMealLabel(""); setShowForm(false);
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2 }}>Calories</div>
        <span style={{ fontSize: 11, color: C.sub }}>{logged} / {goal} kcal</span>
      </div>
      <div style={{ background: C.border, borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#FF9F43", borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ width: "100%", background: "#FF9F4315", border: "1px solid #FF9F43", color: "#FF9F43", borderRadius: 8, padding: "10px 0", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>+ Log Calories</button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={mealLabel} onChange={e => setMealLabel(e.target.value)} placeholder="Meal (optional)" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 12, outline: "none" }} />
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="kcal amount" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 12, outline: "none" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setShowForm(false); setAmount(""); setMealLabel(""); }} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, color: C.sub, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button onClick={submit} style={{ flex: 1, background: "#FF9F43", border: "none", color: "#000", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StreakBadges() {
  const userProgress = { streak: dashboardData.streak, gymVisits: 6, prsBroken: 2 };
  const progressFor = (b) => {
    if (b.type === "streak") return userProgress.streak;
    if (b.type === "gym") return userProgress.gymVisits;
    if (b.type === "pr") return userProgress.prsBroken;
    return 0;
  };
  const nextBadge = badgeDefs
    .filter(b => progressFor(b) < b.threshold)
    .sort((a, b) => (a.threshold - progressFor(a)) - (b.threshold - progressFor(b)))[0];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Badges & Streak</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: "#FF9F43", fontFamily: "'Barlow Condensed',sans-serif" }}>🔥 {userProgress.streak}</span>
            <span style={{ fontSize: 12, color: C.sub }}>day streak</span>
          </div>
        </div>
        {nextBadge && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.sub }}>Next badge</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.lime }}>{nextBadge.icon} {nextBadge.label}</div>
            <div style={{ fontSize: 11, color: C.sub }}>{Math.max(nextBadge.threshold - progressFor(nextBadge), 0)} more to go</div>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
        {badgeDefs.map(b => {
          const unlocked = progressFor(b) >= b.threshold;
          return (
            <div key={b.id} style={{ background: unlocked ? C.lime + "12" : C.surface, border: `1px solid ${unlocked ? C.lime + "55" : C.border}`, borderRadius: 12, padding: "14px 8px", textAlign: "center", opacity: unlocked ? 1 : 0.55 }}>
              <div style={{ fontSize: 24, marginBottom: 6, filter: unlocked ? "none" : "grayscale(1)" }}>{b.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: unlocked ? C.lime : C.sub, lineHeight: 1.3 }}>{b.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReferralSection() {
  const [copied, setCopied] = useState(false);
  const referralCode = "PRIYA-FIT240";
  const copyCode = () => {
    navigator.clipboard?.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: `linear-gradient(135deg,${C.lime}14,${C.card})`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Refer a Gym or Trainer</div>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5, maxWidth: 340, marginBottom: 12 }}>
        Invite your gym or personal trainer to partner with RepUps. Earn <span style={{ color: C.lime, fontWeight: 800 }}>1 Month Free</span> for every partner that joins.
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, background: C.surface, border: `1px dashed ${C.lime}66`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.lime, letterSpacing: 1, fontFamily: "'Barlow Condensed',sans-serif" }}>{referralCode}</span>
          <button onClick={copyCode} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{copied ? "✓ Copied" : "Copy"}</button>
        </div>
      </div>
    </div>
  );
}

export default function HomeDashboard() {
  const navigate = useNavigate();

  // 🛡️ Role Guard: Automatically redirect trainers back to their own dashboard
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      const userRole = localStorage.getItem("userRole");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.role === "trainer" || userRole === "trainer") {
          navigate("/trainer-dashboard", { replace: true });
        }
      }
    } catch (err) {}
  }, [navigate]);

  let parsedUser = { name: "Athlete" };
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) parsedUser = JSON.parse(rawUser);
  } catch (err) {}

  const userName = parsedUser.name || "Athlete";
  const profileId = localStorage.getItem("profileId") || parsedUser._id || parsedUser.id;

  const [postureScore, setPostureScore] = useState(dashboardData.postureScore);
  const [realMetrics, setRealMetrics] = useState({ activeMinutes: 0, formAccuracy: 0, workoutsDone: 0 });

  const d = dashboardData;
  const planPct = (d.todayPlan.exercisesDone / d.todayPlan.exercisesTotal) * 100;

  useEffect(() => {
    const fetchPostureScore = async () => {
      if (!profileId) return;
      try {
        const res = await fetch(`/api/posture/${profileId}/latest`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.record && typeof data.record.overallScore === "number") {
          setPostureScore(data.record.overallScore);
        }
      } catch (err) {}
    };
    fetchPostureScore();
  }, [profileId]);

  useEffect(() => {
    const fetchLiveTelemetry = async () => {
      if (!profileId) return;
      try {
        const res = await fetch(`/api/sessions?userId=${profileId}`);
        if (!res.ok) return;

        const sessions = await res.json();
        const sessionList = Array.isArray(sessions) ? sessions : [];
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySets = sessionList.filter(s => s.date === todayStr);

        if (todaySets.length > 0) {
          const totalAccuracy = todaySets.reduce((sum, set) => sum + (Number(set.avgScore) || 0), 0);
          const avgAccuracy = Math.round(totalAccuracy / todaySets.length);
          let calculatedMins = todaySets.length * 3;

          setRealMetrics({ activeMinutes: calculatedMins, formAccuracy: avgAccuracy, workoutsDone: todaySets.length });
        } else {
          setRealMetrics({ activeMinutes: 0, formAccuracy: 0, workoutsDone: 0 });
        }
      } catch (err) {}
    };

    fetchLiveTelemetry();
  }, [profileId]);

  const handleViewAssessment = async () => {
    if (!profileId) {
      alert("No active user profile found.");
      return;
    }
    try {
      const res = await fetch(`/api/posture/${profileId}/latest`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.record) {
          const pdfUrl = data.record.pdfUrl || data.record.reportUrl || data.record.fileUrl;
          if (pdfUrl) {
            window.open(pdfUrl, '_blank');
            return;
          }

          const reportWindow = window.open('', '_blank');
          if (reportWindow) {
            reportWindow.document.write(`
              <html>
                <head>
                  <title>RepUps Posture Assessment Report</title>
                  <style>
                    body { font-family: 'Barlow', sans-serif; background: #0a0a0a; color: #eee; padding: 40px; }
                    .card { background: #161616; border: 1px solid #222; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; }
                    h1 { color: #3B82F6; font-family: 'Barlow Condensed', sans-serif; font-size: 32px; margin-bottom: 5px; }
                    .score { font-size: 48px; font-weight: 900; color: #3B82F6; margin: 15px 0; }
                    .meta { color: #888; font-size: 14px; margin-bottom: 20px; }
                    .section { margin-top: 20px; border-top: 1px solid #222; padding-top: 15px; }
                    button { background: #3B82F6; color: #000; border: none; padding: 10px 20px; font-weight: 800; border-radius: 8px; cursor: pointer; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <h1>RepUps Posture Analysis</h1>
                    <div class="meta">Athlete ID: ${profileId} | Date: ${new Date(data.record.createdAt || Date.now()).toLocaleDateString()}</div>
                    <div class="score">Score: ${data.record.overallScore}/100</div>
                    <div class="section">
                      <h3>Biomechanical Planes</h3>
                      <pre style="background: #111; padding: 15px; border-radius: 8px; overflow-x: auto; color: #C8F135;">${JSON.stringify(data.record.planes || {}, null, 2)}</pre>
                    </div>
                    <button onclick="window.print()">🖨️ Download / Print PDF Report</button>
                  </div>
                </body>
              </html>
            `);
            reportWindow.document.close();
            return;
          }
        }
      }
      alert("No saved posture assessment records found. Complete an assessment first!");
    } catch (err) {
      console.error("Failed to load posture report:", err);
      navigate('/posture-assessment');
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Barlow','Barlow Condensed',sans-serif", paddingBottom: "40px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet"/>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: 0.5 }}>
              Welcome back, {userName}
            </div>
            <div style={{ fontSize: 12, color: C.sub }}>🔥 {d.streak} day streak — keep it going</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.lime, color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            {userName.slice(0, 2).toUpperCase()}
          </div>
        </div>

        <MuscleGroupMetricWidget userId={profileId} />

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span>Today's Live Telemetry</span>
            <span style={{ color: C.lime }}>{realMetrics.workoutsDone} Sets Analyzed</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <Ring pct={(realMetrics.activeMinutes / d.activeMinutesGoal) * 100} color={C.lime} icon="⏱️" value={`${realMetrics.activeMinutes} min`} label="Active Minutes" />
            <Ring pct={realMetrics.formAccuracy} color={C.blue} icon="🎯" value={`${realMetrics.formAccuracy}%`} label="Avg Form Accuracy" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Today's Plan</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginBottom: 4 }}>{d.todayPlan.name}</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 12 }}>~{d.todayPlan.estMinutes} min · {d.todayPlan.exercisesTotal} exercises</div>
            <div style={{ background: C.border, borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: `${planPct}%`, height: "100%", background: C.lime, borderRadius: 99 }} />
            </div>
            <button onClick={() => navigate('/workout')} style={{ width: "100%", background: C.lime, color: "#000", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              start workout
            </button>
          </div>

          <div style={{ flex: "1 1 200px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Posture Score</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: C.blue, fontFamily: "'Barlow Condensed',sans-serif" }}>{postureScore}</div>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 12 }}>out of 100</div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={handleViewAssessment} style={{ width: "100%", background: "transparent", border: `1px solid ${C.blue}`, color: C.blue, borderRadius: 8, padding: "7px 0", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                📄 View Assessment (PDF)
              </button>
              <button onClick={() => navigate('/posture-assessment')} style={{ width: "100%", background: C.blue, color: "#000", border: "none", borderRadius: 8, padding: "7px 0", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>
                + New Assessment
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}><CalorieTracker /></div>

        <div style={{ background: `linear-gradient(135deg,${C.lime}18,${C.lime}05)`, border: `1px solid ${C.lime}33`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ fontSize: 22 }}>🤖</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.lime, marginBottom: 4 }}>Coach's Note</div>
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{d.coachTip}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {quickLinks.map(l => (
            <div key={l.id} onClick={() => navigate(l.route)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 8px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{l.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: l.color }}>{l.label}</div>
            </div>
          ))}
        </div>

        <StreakBadges />
        <ReferralSection />
      </div>
    </div>
  );
}