import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

const assets = {
  key: "/ai-insight/key-insight.png",
  bottom: "/ai-insight/bottom-info-posture.png",
  thoracic: "/ai-insight/thoracic-extension.png",
  scapular: "/ai-insight/scapular-control.png",
  shoulder: "/ai-insight/shoulder-elevation.png",
  core: "/ai-insight/core-control.png",
};

function severityClass(status = "") {
  const value = String(status).toLowerCase();
  if (value === "severe" || value === "extreme") return "needs-work";
  if (value === "moderate") return "moderate";
  return "strong";
}

function imageForFinding(name = "") {
  const value = name.toLowerCase();
  if (value.includes("scap") || value.includes("shoulder")) return assets.scapular;
  if (value.includes("core") || value.includes("pelvis") || value.includes("hip")) return assets.core;
  if (value.includes("elevation") || value.includes("head")) return assets.shoulder;
  return assets.thoracic;
}

export default function AICoachInsightPage() {
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const headers = authHeaders();
        const meResponse = await fetch(apiUrl("me"), { headers });
        const me = await meResponse.json();
        if (!meResponse.ok) throw new Error(me.error || "Unable to load your profile.");
        const userId = me.user?._id || me.user?.id;
        const response = await fetch(apiUrl(`posture/${userId}/latest`), { headers });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load your posture report.");
        if (mounted) setRecord(data.record || null);
      } catch (loadError) {
        if (mounted) setError(loadError.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const findings = useMemo(() => {
    const allowed = new Set(["mild", "moderate", "severe", "extreme"]);
    return Object.values(record?.planes || {})
      .flatMap((plane) => Array.isArray(plane?.joints) ? plane.joints : [])
      .filter((joint) => allowed.has(String(joint.status || "").toLowerCase()))
      .map((joint, index) => ({
        id: `${joint.name || "finding"}-${index}`,
        name: joint.name || "Posture finding",
        reading: joint.label || "",
        status: joint.status,
        image: imageForFinding(joint.name),
      }));
  }, [record]);

  const reportSummary = record?.findings?.find(Boolean) || "No mild, moderate, or severe alignment findings were recorded in your latest assessment.";

  if (loading) return <main className="ai-insight-state">Loading posture insight…</main>;
  if (error) return <main className="ai-insight-state">{error}</main>;
  if (!record) return <main className="ai-insight-state"><div><p>No posture assessment is saved yet.</p><button onClick={() => navigate("/posture-assessment")}>Start posture assessment</button></div></main>;

  return (
    <main className="ai-insight-page">
      <header className="ai-insight-header"><button onClick={() => navigate(-1)} aria-label="Go back">←</button><h1>AI Coach Insight</h1><span /></header>
      <section className="ai-insight-card ai-insight-key"><div><h2>Posture Report</h2><p>{reportSummary}</p></div><img src={assets.key} alt="Posture analysis" /></section>
      <section className="ai-insight-card ai-insight-focus">
        <h2>Detected Findings</h2>
        {findings.length ? findings.map((finding) => <div className="ai-insight-focus-row" key={finding.id}><img src={finding.image} alt="" /><span><b>{finding.name}</b>{finding.reading && <small>{finding.reading}</small>}</span><b className={severityClass(finding.status)}>{finding.status}</b><i className={severityClass(finding.status)} /></div>) : <p className="ai-insight-empty">No mild, moderate, severe, or extreme findings were detected in this assessment.</p>}
      </section>
      <section className="ai-insight-bottom"><div><p>These findings are taken directly from your latest saved posture assessment. AI recommendations are not available yet.</p><button onClick={() => navigate("/ai-coach")}>Refer our AI coach ›</button></div><img src={assets.bottom} alt="Posture and shoulder analysis" /></section>
    </main>
  );
}
