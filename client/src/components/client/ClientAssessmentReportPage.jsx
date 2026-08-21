import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

const titleCase = (value) => value ? `${value[0].toUpperCase()}${value.slice(1)}` : "";
const severity = (text = "") => /severe|high/i.test(text) ? "bad" : /moderate|mild|elevated/i.test(text) ? "warn" : "good";
const scoreTone = (score) => Number(score) >= 85 ? "good" : Number(score) >= 70 ? "warn" : "bad";

export default function ClientAssessmentReportPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(apiUrl(`posture/report/${assessmentId}`), { headers: authHeaders() })
      .then(async (response) => {
        const raw = await response.text();
        let data;
        try { data = raw ? JSON.parse(raw) : {}; }
        catch { throw new Error("Assessment API returned an HTML page. Restart the Vite development server and try again."); }
        if (!response.ok) throw new Error(data.error || "Unable to load report.");
        return data.assessment;
      })
      .then((data) => active && setReport(data))
      .catch((loadError) => active && setError(loadError.message));
    return () => { active = false; };
  }, [assessmentId]);
  const views = useMemo(() => report ? ["front", "side", "back"].map((view) => ({ view, ...(report.planes?.[view] || {}), image: report.images?.[view] })) : [], [report]);
  if (error) return <main className="client-assessment-report-page"><p className="client-assessment-state error">{error}</p></main>;
  if (!report) return <main className="client-assessment-report-page"><p className="client-assessment-state">Loading your posture report…</p></main>;
  const tone = scoreTone(report.overallScore);
  const findings = Array.isArray(report.findings) ? report.findings : [];
  return <main className="client-assessment-report-page">
    <header className="client-assessments-topbar"><button onClick={() => navigate("/client/assessments")} aria-label="Back">←</button><div><h1>Assessment report</h1><p>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt || report.createdAt))}</p></div><button onClick={() => window.print()} aria-label="Print report">↗</button></header>
    <section className="client-report-score-card"><div><p>OVERALL POSTURE SCORE</p><h2>{report.overallScore}<small>/100</small></h2><strong className={tone}>{tone === "good" ? "Good" : tone === "warn" ? "Needs attention" : "Needs work"}</strong></div><div className={`client-assessment-ring large ${tone}`} style={{ "--score": `${Math.max(0, Math.min(100, Number(report.overallScore) || 0)) * 3.6}deg` }}><div>↔</div></div></section>
    <section className="client-report-section"><h2>Posture overview</h2><div className="client-report-views">{views.map(({ view, score, image }) => <div key={view}>{image ? <img src={image} alt={`${titleCase(view)} posture`} /> : <div className="client-report-view-placeholder">{titleCase(view)}</div>}<span>{titleCase(view)}</span><b className={scoreTone(score)}>{score ?? "—"}</b></div>)}</div></section>
    <section className="client-report-section"><h2>Joint alignment</h2>{views.flatMap(({ view, joints = [] }) => joints.map((joint, index) => <div className="client-report-joint" key={`${view}-${index}`}><span>{titleCase(view)} · {joint.joint || joint.name || "Joint"}</span><b>{joint.reading || joint.value || joint.status || "Recorded"}</b></div>)) || <p>No joint readings were recorded.</p>}</section>
    <section className="client-report-section"><h2>Detected issues</h2>{findings.length ? findings.map((finding, index) => <div className="client-report-finding" key={`${finding}-${index}`}><span>› {finding}</span><b className={severity(finding)}>{severity(finding) === "bad" ? "High" : severity(finding) === "warn" ? "Moderate" : "Aligned"}</b></div>) : <p>No issues were recorded for this assessment.</p>}</section>
    <section className="client-report-section"><h2>Focus areas</h2><ul>{report.recommendations?.focusOn?.length ? report.recommendations.focusOn.map((item) => <li key={item}>{item}</li>) : <li>No focus areas recorded.</li>}</ul></section>
    <button className="client-report-primary" onClick={() => navigate("/posture-assessment")}>Retake posture assessment</button>
  </main>;
}
