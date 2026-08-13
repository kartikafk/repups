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
        // Reduced logging to avoid exposing runtime internals in console

        let attempts = 0;
        while (!localVideoRef.current && attempts < 30) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          attempts += 1;
        }

        const videoNode = localVideoRef.current;

        if (cancelled) return;
        if (!videoNode) {
          throw new Error('Camera preview element was not ready. Please refresh the page and try again.');
        }

        videoRef.current = videoNode;
        await start(facingMode, videoNode);
        if (!cancelled) started = true;
      } catch (error) {
        if (!cancelled) {
          console.error('[CameraView] start failed');
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
