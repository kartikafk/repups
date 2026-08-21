import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

const ASSETS = {
  workout: "/dashboard/workout-man-sticker.png",
  posture: "/dashboard/posture-sticker-transparent.png",
  ai: "/dashboard/ai-sticker-transparent.png",
};

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function ScoreRing({ score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  return <div className="home-score-ring" style={{ "--score": `${safeScore * 3.6}deg` }}><div>{safeScore}</div></div>;
}

export default function HomeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [posture, setPosture] = useState(null);
  const [plans, setPlans] = useState([]);
  const [trainer, setTrainer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const headers = authHeaders();
    async function load() {
      try {
        const response = await fetch(apiUrl("me"), { headers });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load dashboard.");
        if (!mounted) return;
        setUser(data.user);
        const id = data.user?._id || data.user?.id;
        const results = await Promise.allSettled([
          fetch(apiUrl("sessions?limit=100"), { headers }).then((r) => r.ok ? r.json() : []),
          fetch(apiUrl("workout-plans/me"), { headers }).then((r) => r.ok ? r.json() : { plans: [] }),
          id ? fetch(apiUrl(`posture/${id}/latest`), { headers }).then((r) => r.ok ? r.json() : { record: null }) : Promise.resolve({ record: null }),
          fetch(apiUrl("client/trainer-requests"), { headers }).then((r) => r.ok ? r.json() : { requests: [] }),
        ]);
        if (!mounted) return;
        setSessions(results[0].status === "fulfilled" && Array.isArray(results[0].value) ? results[0].value : []);
        setPlans(results[1].status === "fulfilled" ? results[1].value.plans || [] : []);
        setPosture(results[2].status === "fulfilled" ? results[2].value.record || null : null);
        const requests = results[3].status === "fulfilled" ? results[3].value.requests || [] : [];
        setTrainer(requests.find((request) => request.status === "accepted")?.trainer || null);
      } catch (loadError) {
        if (mounted) setError(loadError.message);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const formScores = sessions.map((item) => Number(item.avgScore)).filter(Number.isFinite);
    const workoutDays = new Set(sessions.map((item) => item.date).filter(Boolean));
    const volume = sessions.reduce((sum, item) => sum + (Number(item.weight) || 0) * (Number(item.repCount) || 0), 0);
    return {
      posture: Math.round(Number(posture?.overallScore) || 0),
      sessions: sessions.length,
      workoutDays: workoutDays.size,
      averageForm: formScores.length ? Math.round(formScores.reduce((sum, score) => sum + score, 0) / formScores.length) : 0,
      volume: Math.round(volume),
    };
  }, [posture, sessions]);

  if (error) return <main className="client-home-state">{error}</main>;
  if (!user) return <main className="client-home-state">Loading your performance hub…</main>;

  const firstName = user.name?.split(" ")[0] || "Athlete";
  const plan = plans[0];
  const navItems = [
    ["⌂", "Home", "/dashboard"], ["♧", "Community", "/community"], ["⌖", "Events & Gyms", "/client/events-gyms"], ["✦", "Coach", "/ai-coach"], ["⌕", "Find Trainer", "/client/trainers"],
  ];

  return (
    <main className="client-home-page">
      <header className="client-home-header">
        <div className="client-home-brand">Rep<span>Ups</span></div>
        <div className="client-home-header-actions">
          <button className="client-home-icon-btn" onClick={() => navigate("/client/notifications")} aria-label="Notifications">♢<i /></button>
          <button className="client-home-avatar" onClick={() => navigate("/client/profile")} aria-label="Open profile">{user.photoUrl ? <img src={user.photoUrl} alt="" /> : initials(user.name)}</button>
        </div>
      </header>

      <section className="client-home-welcome"><h1>Hey {firstName} <span>✦</span></h1><p>Let’s crush your goals today.</p></section>

      <section className="client-home-top-stats">
        <article className="client-home-card client-home-score-card"><div><p>POSTURE SCORE</p><h2>{stats.posture}<small>/100</small></h2><strong>{stats.posture >= 70 ? "Good" : stats.posture ? "Keep improving" : "No scan yet"}</strong><button onClick={() => navigate("/client/assessments")}>View assessment →</button></div><ScoreRing score={stats.posture} /></article>
        <article className="client-home-card client-home-streak-card"><div><p>WEEKLY STREAK <span>🔥</span></p><h2>{stats.workoutDays}</h2><small>Active days</small><div className="client-home-week">{["M","T","W","T","F","S","S"].map((day, index) => <span key={`${day}-${index}`} className={index < Math.min(stats.workoutDays, 7) ? "on" : ""}>{day}<i /></span>)}</div></div></article>
      </section>

      <section className="client-home-card client-home-workout-card">
        <div className="client-home-workout-copy"><p>TODAY’S WORKOUT</p><h2>{plan?.name || "Upper Body Strength"}</h2><span>{plan ? "Your trainer’s assigned program" : "Chest, Shoulders, Triceps"}</span><button onClick={() => navigate(plan ? "/client/workout-plan" : "/session")}>▶ {plan ? "View Plan" : "Start Workout"} ›</button></div>
        <img src={ASSETS.workout} alt="Athlete preparing for workout" />
      </section>

      <button className="client-home-card client-home-session-card" onClick={() => navigate(trainer ? "/client/my-trainer" : "/client/trainers")}>
        <span className="client-home-calendar">▣</span><span><small>YOUR COACH</small><b>{trainer?.name || "Find a trainer"}</b><em>{trainer ? "View your coaching relationship" : "Get personalized support"}</em></span><strong>›</strong>
      </button>

      <section className="client-home-card client-home-ai-card"><div><p>AI COACH INSIGHT</p><h2>Your progress, explained.</h2><span>{stats.averageForm ? `Your average form score is ${stats.averageForm}%. Keep building consistent reps.` : "Ask your AI coach about training, recovery, or posture."}</span><button onClick={() => navigate("/ai-coach-insight")}>View insight ›</button></div><img src={ASSETS.ai} alt="AI coaching network" /></section>

      <section className="client-home-quick"><h2>Quick Actions</h2><div><button onClick={() => navigate("/session")}><i className="quick-action-icon quick-action-workout" aria-hidden="true" /><span>Start Workout</span></button><button onClick={() => navigate("/posture-assessment")}><i className="quick-action-icon quick-action-scan" aria-hidden="true" /><span>Posture Scan</span></button><button onClick={() => navigate("/client/workout-plan")}><i className="quick-action-icon quick-action-plan" aria-hidden="true" /><span>View Plan</span></button></div></section>

      <section className="client-home-card client-home-extra-stats"><div><span>🏆</span><b>{stats.sessions}</b><small>Sets Logged</small></div><div><span>◷</span><b>{stats.averageForm || "—"}</b><small>Form Score</small></div><div><span>⚖</span><b>{stats.volume.toLocaleString()}</b><small>Volume kg</small></div></section>

      <section className="client-home-card client-home-progress"><div><span>Program Completion</span><b>{plan ? "Active" : "Start today"}</b></div><i><em style={{ width: plan ? "68%" : "0%" }} /></i></section>

    </main>
  );
}
