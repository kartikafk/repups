import { useEffect, useMemo, useState } from "react";
import { fetchSessions, saveSession } from "../../api";

const scoreMeta = (score) => score == null ? ["—", "Analyzing"] : score >= 85 ? [score, "Great"] : score >= 65 ? [score, "Good"] : [score, "Needs work"];
const asNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

function ScoreGraph({ sessions }) {
  const points = sessions.map((session, index) => ({ x: index, y: asNumber(session.avgScore), label: session.date })).filter((point) => point.y != null);
  if (points.length < 2) return <p className="workout-report-empty">Complete at least two saved sets of this exercise to see your form trend.</p>;
  const width = 620, height = 180, padX = 20, padY = 24;
  const min = Math.max(0, Math.min(...points.map((p) => p.y)) - 10);
  const max = Math.min(100, Math.max(...points.map((p) => p.y)) + 10);
  const range = Math.max(1, max - min);
  const xy = points.map((point, index) => ({ ...point, px: padX + (index * (width - (padX * 2))) / Math.max(1, points.length - 1), py: height - padY - ((point.y - min) / range) * (height - padY * 2) }));
  return <div className="workout-report-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Form score over time">
    {[0, 1, 2, 3].map((line) => <line key={line} x1={padX} x2={width - padX} y1={padY + line * ((height - padY * 2) / 3)} y2={padY + line * ((height - padY * 2) / 3)} />)}
    <polyline points={xy.map((point) => `${point.px},${point.py}`).join(" ")} />
    {xy.map((point) => <g key={`${point.label}-${point.x}`}><circle cx={point.px} cy={point.py} r="5" /><text x={point.px} y={height - 4} textAnchor="middle">{point.label?.slice(5) || ""}</text></g>)}
  </svg></div>;
}

export default function ReportView({ report, onAgain, onDone, onPreview, isHistorical = false }) {
  const [saveState, setSaveState] = useState(isHistorical ? "saved" : "saving");
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState(false);
  const avgScore = asNumber(report?.avgScore);
  const [displayScore, scoreText] = scoreMeta(avgScore);

  useEffect(() => {
    if (isHistorical) return;
    let cancelled = false;
    saveSession(report).then(() => !cancelled && setSaveState("saved")).catch(() => !cancelled && setSaveState("error"));
    return () => { cancelled = true; };
  }, [report, isHistorical]);

  useEffect(() => {
    if (!report?.exercise) return undefined;
    let cancelled = false;
    fetchSessions({ exercise: report.exercise, limit: 12 })
      .then((records) => !cancelled && setHistory(Array.isArray(records) ? records : []))
      .catch(() => !cancelled && setHistoryError(true));
    return () => { cancelled = true; };
  }, [report?.exercise, saveState]);

  const reps = Array.isArray(report?.reps) ? report.reps : [];
  const setRows = useMemo(() => reps.map((rep, index) => ({ index: rep.n || index + 1, weight: report?.weight, reps: 1, rpe: "—", form: asNumber(rep.score) })), [reps, report?.weight]);
  const estimated1RM = report?.weight && report?.repCount ? Math.round(Number(report.weight) * (1 + Number(report.repCount) / 30)) : null;
  const tempo = report?.avgTempo;

  return <main className="workout-report-page">
    <header className="workout-report-header"><button onClick={onAgain} aria-label="Back">←</button><div><h1>Workout complete</h1><p>{report?.exercise || "Workout set"}</p></div><button onClick={onDone} aria-label="Close">×</button></header>
    <section className="workout-report-celebration"><span>🏆</span><h2>Great work!</h2><p>Your set has been analyzed and saved.</p></section>
    <section className="workout-report-totals"><div><small>TOTAL VOLUME</small><strong>{report?.weight && report?.repCount ? `${Math.round(Number(report.weight) * Number(report.repCount))} kg` : "—"}</strong></div><div><small>REPS TRACKED</small><strong>{report?.repCount ?? "—"}</strong></div></section>
    <section className="workout-report-card workout-report-summary"><div><h2>{report?.exercise || "Workout"}</h2><p>Completed set</p></div><div className="workout-report-summary-values"><span><small>TOP SET</small><b>{report?.weight ? `${report.weight} kg × ${report?.repCount ?? 0}` : "—"}</b></span><span><small>EST. 1RM</small><b>{estimated1RM ? `${estimated1RM} kg` : "—"}</b></span><span><small>FORM SCORE</small><b className={avgScore != null && avgScore < 65 ? "score-low" : ""}>{displayScore}</b><em>{scoreText}</em></span></div></section>
    <section className="workout-report-card"><div className="workout-report-section-head"><h2>Performance over time</h2><span>Form score</span></div>{historyError ? <p className="workout-report-empty">Your saved trend could not be loaded.</p> : <ScoreGraph sessions={history} />}</section>
    <section className="workout-report-card"><h2>Set summary</h2>{setRows.length ? <div className="workout-report-table"><div className="workout-report-table-head"><span>REP</span><span>ROM</span><span>TEMPO</span><span>FORM</span></div>{reps.map((rep, index) => <div key={rep.n || index}><span>{rep.n || index + 1}</span><span>{rep.rom != null ? `${Math.round(rep.rom)}°` : "—"}</span><span>{rep.ecc ? `${(rep.ecc / 1000).toFixed(1)}s` : "—"}</span><span>{rep.score ?? "—"}</span></div>)}</div> : <p className="workout-report-empty">No per-rep telemetry was captured for this set.</p>}</section>
    <section className="workout-report-card workout-report-details"><div><small>AVG ROM</small><strong>{report?.avgRom != null ? `${report.avgRom}°` : "—"}</strong></div><div><small>TEMPO</small><strong>{tempo ? `${tempo.ecc.toFixed(1)}-${tempo.pause.toFixed(1)}-${tempo.con.toFixed(1)}` : "—"}</strong></div><div><small>CONSISTENCY</small><strong>{report?.consistency != null ? `${report.consistency}%` : "—"}</strong></div></section>
    {report?.avgTempo?.replay && <button className="workout-report-outline" onClick={() => onPreview?.(report.avgTempo.replay)}>Watch set replay</button>}
    <p className="workout-report-save">{saveState === "saving" ? "Saving workout…" : saveState === "saved" ? (isHistorical ? "Loaded from workout history" : "Saved to workout history") : "Unable to save this workout. Check your connection."}</p>
    <footer className="workout-report-actions"><button className="workout-report-outline" onClick={onAgain}>Add to favorites</button><button className="workout-report-primary" onClick={onDone}>Keep training</button></footer>
  </main>;
}
