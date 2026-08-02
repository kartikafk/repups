import { useEffect, useState } from 'react';
import { saveSession } from '../api';

export default function ReportView({ report, onAgain, onDone, onPreview, isHistorical = false }) {
  const [saveState, setSaveState] = useState(isHistorical ? 'saved' : 'saving');

  useEffect(() => {
    if (isHistorical) return;

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
  }, [report, isHistorical]);

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
  } = report || {};

  const safeReps = reps || [];
  const safeTopIssues = topIssues || [];
  const hasDetailedData = safeReps.length > 0;

  // Fail-safe score mapping
  const displayScore = avgScore !== undefined && avgScore !== null ? avgScore : '—';
  const scoreColor = displayScore !== '—' && displayScore >= 85 ? 'var(--go)' : displayScore !== '—' && displayScore >= 65 ? 'var(--warn)' : 'var(--bad)';

  return (
    <div className="report">
      <div className="brand">SET REPORT</div>
      <div className="score-hero">
        <div className="score-num" style={{ color: scoreColor }}>
          {displayScore}
        </div>
        <div className="score-label">Form Score</div>
      </div>

      <button
        className="preview-btn"
        onClick={() => onPreview?.(avgTempo?.replay)}
        disabled={!avgTempo?.replay}
      >
        ▶ Watch Preview of Last Set
      </button>

      <div className="metrics-grid">
        <div className="metric">
          <div className="l">Total reps</div>
          <div className="v">{repCount ?? '—'}</div>
        </div>
        <div className="metric">
          <div className="l">Avg tempo</div>
          <div className="v">
            {repCount && avgTempo && avgTempo.ecc !== undefined
              ? `${avgTempo.ecc.toFixed(1)}·${avgTempo.pause.toFixed(1)}·${avgTempo.con.toFixed(1)}s`
              : '—'}
          </div>
        </div>
        <div className="metric">
          <div className="l">Avg ROM</div>
          <div className="v">{repCount && avgRom != null ? `${avgRom}°` : '—'}</div>
        </div>
        <div className="metric">
          <div className="l">Consistency</div>
          <div className="v">{repCount && consistency != null ? `${consistency}%` : '—'}</div>
        </div>
      </div>

      <div className="section-title">Joint & Balance metrics</div>

      <div className="metrics-grid">
        <div className="metric">
          <div className="l">Joint Score</div>
          <div className="v">{jointScores?.overall !== undefined ? `${jointScores.overall.toFixed(0)}` : '—'}</div>
        </div>

        <div className="metric">
          <div className="l">Left Balance</div>
          <div className="v">{balance?.left !== undefined ? `${balance.left.toFixed(0)}%` : '—'}</div>
        </div>

        <div className="metric">
          <div className="l">Right Balance</div>
          <div className="v">{balance?.right !== undefined ? `${balance.right.toFixed(0)}%` : '—'}</div>
        </div>

        <div className="metric">
          <div className="l">Fatigue</div>
          <div className="v">{fatigue != null ? `${fatigue.toFixed(0)}%` : '—'}</div>
        </div>
      </div>

      <div className="section-title">Movement Analysis</div>

      <div className="metrics-grid">
        <div className="metric">
          <div className="l">Movement Quality</div>
          <div className="v">{movementQuality != null ? movementQuality.toFixed(0) : '—'}</div>
        </div>

        <div className="metric">
          <div className="l">Stability</div>
          <div className="v">{stability != null ? stability.toFixed(1) : '—'}</div>
        </div>

        <div className="metric">
          <div className="l">Symmetry</div>
          <div className="v">{symmetry != null ? symmetry.toFixed(1) : '—'}</div>
        </div>
      </div>

      <div className="section-title">Per-rep breakdown</div>
      {hasDetailedData ? (
        <>
          <div className="rep-row" style={{ borderBottom: '1px solid var(--ink-dim)', opacity: 0.6 }}>
            <div className="n">#</div>
            <div>ECC</div>
            <div>PAUSE</div>
            <div>CON</div>
            <div className="score">SCR</div>
          </div>
          {safeReps.map((r, idx) => {
            const scoreVal = r.score ?? 0;
            const color = scoreVal >= 85 ? 'var(--go)' : scoreVal >= 65 ? 'var(--warn)' : 'var(--bad)';
            return (
              <div className="rep-row" key={r.n || idx}>
                <div className="n">{r.n || idx + 1}</div>
                <div>{r.ecc ? (r.ecc / 1000).toFixed(1) : '—'}s</div>
                <div>{r.pause ? (r.pause / 1000).toFixed(1) : '—'}s</div>
                <div>{r.con ? (r.con / 1000).toFixed(1) : '—'}s</div>
                <div className="score" style={{ color }}>
                  {scoreVal}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div className="issue-card">
          <div className="d">Detailed per-rep telemetry available for live sets.</div>
        </div>
      )}

      <div className="section-title">Coaching notes</div>
      {!hasDetailedData ? (
        <div className="issue-card">
          <div className="d">Coaching notes aren't available for this record.</div>
        </div>
      ) : safeTopIssues.length === 0 ? (
        <div className="issue-card" style={{ borderLeftColor: 'var(--go)' }}>
          <div className="t">No recurring issues</div>
          <div className="d">Form held up consistently across the set. Keep this tempo and depth next set.</div>
        </div>
      ) : (
        safeTopIssues.map((issue) => (
          <div className="issue-card" key={issue.key}>
            <div className="t">
              {issue.label} — {issue.count}/{repCount} reps
            </div>
          </div>
        ))
      )}

      <div className="save-status">
        {saveState === 'saving' && 'Saving report…'}
        {saveState === 'saved' && (isHistorical ? 'Loaded from your history' : 'Saved to your history')}
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