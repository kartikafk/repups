import { useEffect, useState } from 'react';
import { saveSession } from '../api';

export default function ReportView({report,onAgain,onDone,onPreview}) {
  const [saveState, setSaveState] = useState('saving'); // saving | saved | error

  useEffect(() => {
    let cancelled = false;
    saveSession(report)
      .then(() => {
        if (!cancelled) setSaveState('saved');
      })
      .catch(() => {
        if (!cancelled) setSaveState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [report]);

  const {
  avgScore,
  repCount,
  avgTempo,
  avgRom,
  consistency,
  reps,
  topIssues,

  jointScores,
  balance,
  fatigue,
  movementQuality,
  stability,
  symmetry

} = report;
  const scoreColor = avgScore >= 85 ? 'var(--go)' : avgScore >= 65 ? 'var(--warn)' : 'var(--bad)';
console.log("REPORT:", report);
console.log("Replay URL:", report.avgTempo?.replay);
  return (
    <div className="report">
      <div className="brand">SET REPORT</div>
      <div className="score-hero">
        <div className="score-num" style={{ color: scoreColor }}>
          {repCount ? avgScore : '—'}
        </div>
        <div className="score-label">Form Score</div>
      </div>
<button
  className="preview-btn"
  onClick={() => onPreview(report.avgTempo?.replay)}
  disabled={!report.avgTempo?.replay}
>
  ▶ Watch Preview of Last Set
</button>
      <div className="metrics-grid">
        <div className="metric">
          <div className="l">Total reps</div>
          <div className="v">{repCount}</div>
        </div>
        <div className="metric">
          <div className="l">Avg tempo</div>
          <div className="v">
            {repCount ? `${avgTempo.ecc.toFixed(1)}·${avgTempo.pause.toFixed(1)}·${avgTempo.con.toFixed(1)}s` : '—'}
          </div>
        </div>
        <div className="metric">
          <div className="l">Avg ROM</div>
          <div className="v">{repCount ? `${avgRom}°` : '—'}</div>
        </div>
        <div className="metric">
          <div className="l">Consistency</div>
          <div className="v">{repCount ? `${consistency}%` : '—'}</div>
        </div>
      </div>
      <div className="section-title">
  Joint & Balance metrics
</div>

<div className="metrics-grid">

  <div className="metric">
    <div className="l">
      Joint Score
    </div>

    <div className="v">
      {jointScores
        ? `${jointScores.overall.toFixed(0)}`
        : "—"}
    </div>
  </div>

  <div className="metric">
    <div className="l">
      Left Balance
    </div>

    <div className="v">
      {balance
        ? `${balance.left.toFixed(0)}%`
        : "—"}
    </div>
  </div>

  <div className="metric">
    <div className="l">
      Right Balance
    </div>

    <div className="v">
      {balance
        ? `${balance.right.toFixed(0)}%`
        : "—"}
    </div>
  </div>

  <div className="metric">
    <div className="l">
      Fatigue
    </div>

    <div className="v">
      {fatigue != null ? `${fatigue.toFixed(0)}%` : "—"}
    </div>
  </div>

</div>
<div className="section-title">
  Movement Analysis
</div>

<div className="metrics-grid">

  <div className="metric">
    <div className="l">
      Movement Quality
    </div>

    <div className="v">
      {movementQuality != null ? movementQuality.toFixed(0) : "—"}
    </div>
  </div>

  <div className="metric">
    <div className="l">
      Stability
    </div>

    <div className="v">
      {stability != null ? stability.toFixed(1) : "—"}
    </div>
  </div>

  <div className="metric">
    <div className="l">
      Symmetry
    </div>

    <div className="v">
      {symmetry != null ? symmetry.toFixed(1) : "—"}
    </div>
  </div>

</div>

      <div className="section-title">Per-rep breakdown</div>
      <div className="rep-row" style={{ borderBottom: '1px solid var(--ink-dim)', opacity: 0.6 }}>
        <div className="n">#</div>
        <div>ECC</div>
        <div>PAUSE</div>
        <div>CON</div>
        <div className="score">SCR</div>
      </div>
      {reps.map((r) => {
        const color = r.score >= 85 ? 'var(--go)' : r.score >= 65 ? 'var(--warn)' : 'var(--bad)';
        return (
          <div className="rep-row" key={r.n}>
            <div className="n">{r.n}</div>
            <div>{(r.ecc / 1000).toFixed(1)}s</div>
            <div>{(r.pause / 1000).toFixed(1)}s</div>
            <div>{(r.con / 1000).toFixed(1)}s</div>
            <div className="score" style={{ color }}>
              {r.score}
            </div>
          </div>
        );
      })}

      <div className="section-title">Coaching notes</div>
      {topIssues.length === 0 ? (
        <div className="issue-card" style={{ borderLeftColor: 'var(--go)' }}>
          <div className="t">No recurring issues</div>
          <div className="d">Form held up consistently across the set. Keep this tempo and depth next set.</div>
        </div>
      ) : (
        topIssues.map((issue) => (
          <div className="issue-card" key={issue.key}>
            <div className="t">
              {issue.label} — {issue.count}/{repCount} reps
            </div>
          </div>
        ))
      )}

      <div className="save-status">
        {saveState === 'saving' && 'Saving report…'}
        {saveState === 'saved' && 'Saved to your history'}
        {saveState === 'error' && "Couldn't reach the server — report shown here only"}
      </div>

      <div className="report-actions">
        <button className="btn-ghost" onClick={onAgain}>
          New set
        </button>
        <button className="btn-solid" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}
