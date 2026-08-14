import { useEffect, useRef } from 'react';
import { EXERCISES } from '../../hooks/exercises';

export default function CameraView({ tracker, exercise, facingMode, shouldStart, onStop, onEndSet }) {
 const {
videoRef,
canvasRef,

cue,
hudStatus,

repCount,
rom,
tempo,
phase,

jointScores,
balance,
fatigue,
movementQuality,
stability,
symmetry,

start,
stop
} = tracker;

  const localVideoRef = useRef(null);
  const shouldStartRef = useRef(shouldStart);

  useEffect(() => {
    shouldStartRef.current = shouldStart;
  }, [shouldStart]);

  useEffect(() => {
    if (!shouldStart) return undefined;
    let cancelled = false;
    let started = false;

    const startCamera = async () => {
      try {
        console.log('[CameraView] starting camera flow', { shouldStart, facingMode });

        let attempts = 0;
        while (!localVideoRef.current && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          attempts += 1;
        }

        const videoNode = localVideoRef.current;
        console.log('[CameraView] video ref state', { hasVideo: !!videoNode, nodeType: videoNode?.nodeName });

        if (cancelled) return;
        if (!videoNode) {
          throw new Error('Camera preview element was not ready. Please refresh the page and try again.');
        }

        videoRef.current = videoNode;
        console.log('Assigning videoRef', videoNode);
        await start(facingMode, videoNode);
        if (!cancelled) started = true;
      } catch (error) {
        if (!cancelled) {
          console.error('[CameraView] start failed:', error);
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (started) {
        stop();
      }
    };
  }, [shouldStart, start, stop, facingMode]);

  // Ending a set only stops the tracker and hands control back to
  // WorkoutFlow via onEndSet. WorkoutFlow.handleEndSet builds the report
  // (via tracker.buildReport()) and ReportView saves it exactly once.
  // CameraView does NOT talk to the backend directly -- a duplicate save
  // here (with its own, less-reliable userId resolution and a hardcoded
  // fallback score) was producing a second, failing POST for every set.
  const handleEndSetClick = () => {
    if (onEndSet) {
      onEndSet();
    }
  };

  if (!tracker) {
    return null;
  }

  const cueColor = cue.kind === 'warn' ? 'var(--warn)' : cue.kind === 'bad' ? 'var(--bad)' : 'var(--go)';
  
  return (
    <div className="cam-wrap">
      <video
        ref={localVideoRef}
        playsInline
        autoPlay
        muted
      />
      <div className="camera-active-badge">Camera active</div>
      <canvas ref={canvasRef} className="overlay" />

      <div className="topbar">
        <div>
          <div className="ex-name">{EXERCISES[exercise]?.label || exercise}</div>
          <div className="status">{hudStatus}</div>
        </div>
        <div className="icon-btn" onClick={onStop}>
          ✕
        </div>
      </div>

      <button className="end-set-btn" onClick={handleEndSetClick}>
        END SET → REPORT
      </button>

      <div className="hud-bottom">
        <div className="cue-bar">
          <div className="cue-dot" style={{ background: cueColor, boxShadow: `0 0 12px ${cueColor}` }} />
          <div className="cue-text">{cue.text}</div>
        </div>
        <div className="stat-row">
          <div className="stat-box rep-box">
            <div className="stat-label">Reps</div>
            <div className="stat-value">{repCount}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Rom</div>
            <div className="stat-value" style={{ fontSize: 22 }}>
              {rom !== null ? `${rom}°` : '—'}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Tempo</div>
            <div className="stat-value" style={{ fontSize: 22 }}>
              {tempo ? `${tempo.ecc.toFixed(1)}·${tempo.pause.toFixed(1)}·${tempo.con.toFixed(1)}` : '—'}
            </div>
          </div>
        </div>
        <div className="tempo-phases">
          <div className={`phase-chip ${phase === 'descending' ? 'on' : ''}`}>ECCENTRIC</div>
          <div className={`phase-chip ${phase === 'paused' ? 'on' : ''}`}>PAUSE</div>
          <div className={`phase-chip ${phase === 'ascending' ? 'on' : ''}`}>CONCENTRIC</div>
        </div>
        <div className="live-biomechanics">
        </div>
      </div>
    </div>
  );
}
