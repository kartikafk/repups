import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

function level(score) {
  const value = Number(score) || 0;
  if (value >= 85) return { label: "Good", risk: "Low risk", tone: "good" };
  if (value >= 70) return { label: "Fair", risk: "Needs attention", tone: "warn" };
  return { label: "Needs work", risk: "High risk", tone: "bad" };
}

function dateLabel(value) {
  if (!value) return "Assessment date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ClientAssessmentHistoryPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(apiUrl("posture/history"), { headers: authHeaders() })
      .then(async (response) => {
        const raw = await response.text();
        let data;
        try { data = raw ? JSON.parse(raw) : {}; }
        catch { throw new Error("Assessment API returned an HTML page. Restart the Vite development server and try again."); }
        if (!response.ok) throw new Error(data.error || "Unable to load assessments.");
        return data.assessments || [];
      })
      .then((data) => active && setAssessments(data))
      .catch((loadError) => active && setError(loadError.message));
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => (assessments || []).filter((assessment) => {
    const score = Number(assessment.overallScore) || 0;
    return filter === "all" || (filter === "high" ? score < 70 : score < 85);
  }), [assessments, filter]);

  return <main className="client-assessments-page">
    <header className="client-assessments-topbar"><button onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">←</button><div><h1>Assessments</h1><p>Your posture assessment history</p></div><button onClick={() => navigate("/posture-assessment")} aria-label="Start posture assessment">＋</button></header>
    <div className="client-assessment-filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button><button className={filter === "high" ? "active risk" : ""} onClick={() => setFilter("high")}>High risk</button><button className={filter === "attention" ? "active" : ""} onClick={() => setFilter("attention")}>Needs attention</button></div>
    {error && <p className="client-assessment-state error">{error}</p>}
    {!assessments && !error && <p className="client-assessment-state">Loading your assessments…</p>}
    {assessments && !visible.length && <section className="client-assessment-empty"><h2>No assessments found</h2><p>Complete a posture scan to see your history here.</p><button onClick={() => navigate("/posture-assessment")}>Start posture assessment</button></section>}
    <section className="client-assessment-list">{visible.map((assessment) => {
      const status = level(assessment.overallScore);
      return <article className="client-assessment-card" key={assessment._id}>
        <div className={`client-assessment-ring ${status.tone}`} style={{ "--score": `${Math.max(0, Math.min(100, Number(assessment.overallScore) || 0)) * 3.6}deg` }}><div><b>{assessment.overallScore}</b><small>/100</small></div></div>
        <div className="client-assessment-copy"><time>{dateLabel(assessment.generatedAt || assessment.createdAt)}</time><strong className={status.tone}>{status.risk}</strong><h2>Full body posture assessment</h2><p>{status.label} alignment score</p><button onClick={() => navigate(`/client/assessments/${assessment._id}`)}>View report <span>›</span></button></div>
      </article>;
    })}</section>
  </main>;
}
