import { useEffect, useRef } from "react";
import { EXERCISES } from "../../hooks/exercises";

const scoreLabel = (score) => {
  if (score == null) return "Analyzing";
  if (score >= 85) return "Great";
  if (score >= 65) return "Good";
  return "Improve";
};

export default function CameraView({ tracker, exercise, facingMode, shouldStart, onStop, onEndSet }) {
  const localVideoRef = useRef(null);
  const {
    videoRef, canvasRef, cue = {}, hudStatus, repCount = 0, rom, tempo,
    phase, movementQuality, stability, start, stop,
  } = tracker;

  useEffect(() => {
    if (!shouldStart) return undefined;
    let cancelled = false;
    let started = false;
    const startCamera = async () => {
      try {
        let attempts = 0;
        while (!localVideoRef.current && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          attempts += 1;
        }
        if (cancelled || !localVideoRef.current) return;
        videoRef.current = localVideoRef.current;
        await start(facingMode, localVideoRef.current);
        started = true;
      } catch (error) {
        console.error("Unable to start workout camera", error);
      }
    };
    startCamera();
    return () => { cancelled = true; if (started) stop(); };
  }, [shouldStart, start, stop, facingMode, videoRef]);

  const exerciseName = EXERCISES[exercise]?.label || exercise || "Workout";
  const tempoText = tempo ? `${tempo.ecc.toFixed(1)}-${tempo.pause.toFixed(1)}-${tempo.con.toFixed(1)}` : "—";
  const liveScore = movementQuality == null ? null : Math.round(movementQuality);

  return (
    <main className="workout-live-page">
      <header className="workout-live-header">
        <button className="workout-live-icon" onClick={onStop} aria-label="Exit workout">←</button>
        <div><h1>{exerciseName}</h1><p>{hudStatus || "Preparing live form analysis"}</p></div>
        <span className="workout-live-status"><i /> LIVE</span>
      </header>
      <section className="workout-live-stats" aria-label="Live set stats">
        <div><small>SET</small><strong>1 / 1</strong></div>
        <div><small>REPS</small><strong>{repCount} <em>tracked</em></strong></div>
        <div><small>FORM</small><strong>{liveScore ?? "—"} <em>{scoreLabel(liveScore)}</em></strong></div>
      </section>
      <section className="workout-live-camera">
        <video ref={localVideoRef} playsInline autoPlay muted />
        <canvas ref={canvasRef} className="workout-live-overlay" />
        <div className="workout-live-camera-label"><i /> Camera analysis active</div>
        <div className="workout-live-rom">ROM <b>{rom != null ? `${rom}°` : "—"}</b></div>
      </section>
      <section className="workout-live-metrics">
        <div><small>FORM SCORE</small><strong className="workout-live-score">{liveScore ?? "—"}</strong><span>{scoreLabel(liveScore)}</span></div>
        <div><small>ROM</small><strong>{rom != null ? `${rom}°` : "—"}</strong><span>Range of motion</span></div>
        <div><small>TEMPO</small><strong>{tempoText}</strong><span>Controlled pace</span></div>
      </section>
      <section className="workout-live-cues">
        <h2>Live cues</h2>
        <p className={cue.kind === "bad" || cue.kind === "warn" ? "workout-live-cue-warning" : ""}><span>•</span> {cue.text || "Keep a controlled, comfortable range of motion."}</p>
        {phase && <small>Current phase: {phase}</small>}
        {stability != null && <small>Stability: {Math.round(stability)}%</small>}
      </section>
      <footer className="workout-live-controls">
        <button className="workout-live-control" onClick={onStop}><b>↶</b><span>Exit</span></button>
        <button className="workout-live-reps" onClick={onEndSet}><b>{repCount}</b><span>Finish set</span></button>
        <button className="workout-live-control workout-live-end" onClick={onEndSet}><b>■</b><span>End set</span></button>
      </footer>
    </main>
  );
}
