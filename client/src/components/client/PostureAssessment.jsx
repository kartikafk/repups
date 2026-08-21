import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles.css";
import { usePostureCapture} from "../../hooks/usePostureCapture";
import { 
  analyzeFrontalPosture, 
  analyzeProfilePosture, 
  analyzeBackPosture, 
  analyzeTransversePlane, 
  buildPostureReport, 
  buildCalibration 
} from "../../utils/postureEngine";
import { generatePosturePDF } from "../../utils/pdfGenerator";
import repUpLogo from "../../assets/repup-logo.jpeg";

const STEP_CONFIG = {
  1: {
    key: "front",
    title: "Front View",
    prompt: "🎯 Center Shoulders Within Target Box",
    instructions:
      "Position yourself so your entire upper body fits inside the dashed green HUD box. Face the camera directly, keep your posture natural, and click capture."
  },
  2: {
    key: "side",
    title: "Side View",
    prompt: "🎯 Turn Sideways for Profile Scan",
    instructions:
      "Turn 90 degrees sideways so your ear, shoulder, and hip line up with the red vertical plumb line."
  },
  3: {
    key: "back",
    title: "Back View",
    prompt: "🎯 Face Away From the Camera",
    instructions:
      "Turn around so your back faces the camera. Keep your feet shoulder-width apart and arms relaxed at your sides."
  }
};

// Severity -> color mapping, matched to the app's existing HUD palette.
const SEVERITY_COLORS = {
  Aligned: "#3ddc84",
  Mild: "#e8d13c",
  Moderate: "#ff9a3c",
  Severe: "#ff3c5a"
};

const CAPTURE_UI = {
  1: { label: "Front", frame: "/posture-capture/frame-front.png", rightPanel: "/posture-capture/right-panel-front.png", tip: "/posture-capture/tip-front.png" },
  2: { label: "Side", frame: "/posture-capture/frame-side.png", rightPanel: "/posture-capture/right-panel-side.png", tip: "/posture-capture/tip-side.png" },
  3: { label: "Back", frame: "/posture-capture/frame-back.png", rightPanel: "/posture-capture/right-panel-back.png", tip: "/posture-capture/tip-back.png" }
};

// MediaPipe landmark proportions are dimensionless, so they remain useful
// across camera distance and are stored only as optional baseline metadata.
function deriveBodyProportions(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 29) return null;
  const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0), (a?.z || 0) - (b?.z || 0));
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z || 0) + (b.z || 0)) / 2 });
  const shoulders = midpoint(landmarks[11], landmarks[12]); const hips = midpoint(landmarks[23], landmarks[24]); const ankles = midpoint(landmarks[27], landmarks[28]);
  const torso = distance(shoulders, hips); const legs = distance(hips, ankles); const shoulderWidth = distance(landmarks[11], landmarks[12]); const hipWidth = distance(landmarks[23], landmarks[24]);
  const arms = (distance(landmarks[11], landmarks[15]) + distance(landmarks[12], landmarks[16])) / 2;
  return torso && legs && hipWidth ? { torsoToLegRatio: torso / legs, shoulderToHipRatio: shoulderWidth / hipWidth, limbLengthRatio: arms / legs } : null;
}

// Tracks actual viewport size so layout decisions (stacked vs side-by-side,
// how big the camera box should be) respond to the real screen — not a
// fixed assumption baked in at build time.
function useViewportSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768
  }));

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return size;
}

function SeverityBadge({ status }) {
  const color = SEVERITY_COLORS[status] || "#999";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "10px",
        fontSize: "clamp(10px, 2.2vw, 11px)",
        fontWeight: 700,
        color: "#111",
        background: color,
        whiteSpace: "nowrap"
      }}
    >
      {status}
    </span>
  );
}

function JointTable({ title, joints }) {
  if (!joints || joints.length === 0) return null;
  return (
    <div style={{ marginBottom: "20px" }}>
      <h4 style={{ margin: "0 0 8px", color: "#111", fontSize: "clamp(14px, 3vw, 16px)" }}>{title}</h4>
      {/* Horizontal scroll wrapper so the table degrades gracefully on
          narrow phone screens instead of squashing or overflowing the page. */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: "360px", borderCollapse: "collapse", fontSize: "clamp(12px, 2.6vw, 13px)" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "6px 8px" }}>Joint</th>
              <th style={{ padding: "6px 8px" }}>Reading</th>
              <th style={{ padding: "6px 8px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {joints.map((j, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{j.name}</td>
                <td style={{ padding: "6px 8px" }}>{j.label}</td>
                <td style={{ padding: "6px 8px" }}>
                  <SeverityBadge status={j.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PostureAssessment() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const reportRef = useRef(null);

  const { captureAndAnalyze, dispose } = usePostureCapture();
  const { width: viewportWidth } = useViewportSize();
  const isMobile = viewportWidth < 768;

  const [step, setStep] = useState(1); // 1: Front, 2: Side, 3: Back, 4: Report
  const [scanning, setScanning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [captures, setCaptures] = useState({}); // { front: {landmarks, imageDataUrl}, side: {...}, back: {...} }
  const [report, setReport] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [pdfStatus, setPdfStatus] = useState("idle"); // idle | generating | done | error
  const [heightInches, setHeightInches] = useState(""); // optional, for real-world unit calibration
  const [showTips, setShowTips] = useState(false);

  let profileId = localStorage.getItem("profileId");
  try {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    profileId = savedUser?._id || savedUser?.id || profileId;
  } catch {}

  // 1. Initialize Camera Stream
  // Resolution is requested as an "ideal" range rather than a hard 640x480
  // lock, so the browser picks the sharpest feed the device can actually
  // supply — a phone camera won't get stuck rendering at webcam quality,
  // and a low-end device won't fail trying to force a resolution it can't hit.
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1080 },
            height: { ideal: 1440 },
            aspectRatio: { ideal: 3 / 4 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };
    if (step < 4) startCamera();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, step]);

  // Release the MediaPipe still-image model when leaving the page
  useEffect(() => {
    return () => dispose();
  }, [dispose]);

  // 2. Real-Time HUD Overlay & Alignment Box Rendering Loop
  // All HUD geometry below is expressed as a FRACTION of the canvas's
  // current width/height (which itself tracks the video's actual streamed
  // resolution every frame), so the target box, crosshair, and guideline
  // stay proportionally correct whether the feed is a 640x480 webcam or a
  // 1440x1920 phone camera — nothing here is a fixed pixel offset anymore.
  useEffect(() => {
    let animationFrameId;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const renderHUD = () => {
      if (!video || !canvas || step >= 4) return;
      const ctx = canvas.getContext("2d");

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width * 0.5;
        const cy = canvas.height * 0.45;
        const shortSide = Math.min(canvas.width, canvas.height);

        // Target bounding box: ~34% of width, ~58% of height, centered.
        const boxW = canvas.width * 0.34;
        const boxH = canvas.height * 0.58;
        const lineWidth = Math.max(2, canvas.width / 320);

        ctx.strokeStyle = "rgba(200, 255, 0, 0.4)";
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([canvas.width * 0.01, canvas.width * 0.01]);
        ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
        ctx.setLineDash([]);

        // Center crosshair, scaled to the shorter canvas dimension.
        const crossHalf = shortSide * 0.03;
        ctx.strokeStyle = "rgba(0, 217, 255, 0.6)";
        ctx.lineWidth = Math.max(1.5, lineWidth * 0.7);
        ctx.beginPath();
        ctx.moveTo(cx - crossHalf, cy); ctx.lineTo(cx + crossHalf, cy);
        ctx.moveTo(cx, cy - crossHalf); ctx.lineTo(cx, cy + crossHalf);
        ctx.stroke();

        // Dynamic live guideline per phase, also fraction-based.
        ctx.lineWidth = lineWidth * 1.4;
        if (step === 1) {
          const halfW = canvas.width * 0.11;
          const yOff = canvas.height * 0.1;
          ctx.strokeStyle = "#c8ff00";
          ctx.beginPath();
          ctx.moveTo(cx - halfW, cy - yOff);
          ctx.lineTo(cx + halfW, cy - yOff);
          ctx.stroke();
        } else if (step === 2) {
          const halfH = canvas.height * 0.25;
          const drift = canvas.width * 0.016;
          ctx.strokeStyle = "#ff3c5a";
          ctx.beginPath();
          ctx.moveTo(cx, cy - halfH);
          ctx.lineTo(cx + drift, cy + halfH);
          ctx.stroke();
        } else if (step === 3) {
          const halfW = canvas.width * 0.11;
          const yOff = canvas.height * 0.1;
          ctx.strokeStyle = "#7a5cff";
          ctx.beginPath();
          ctx.moveTo(cx - halfW, cy - yOff);
          ctx.lineTo(cx + halfW, cy - yOff);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(renderHUD);
    };

    renderHUD();
    return () => cancelAnimationFrame(animationFrameId);
  }, [step]);

  // 3. Trigger 3-Second Countdown & Capture Picture
  const triggerCaptureSequence = () => {
    if (countdown !== null || scanning) return;
    setCountdown(3);

    let currentCount = 3;
    const timer = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
      } else {
        clearInterval(timer);
        setCountdown(null);
        executeAnalysisScan();
      }
    }, 1000);
  };

  // 4. Capture the current view, run pose detection, and advance
  const executeAnalysisScan = async () => {
    setScanning(true);
    const viewKey = STEP_CONFIG[step].key;

    try {
      const result = await captureAndAnalyze(videoRef.current);

      const updatedCaptures = {
        ...captures,
        [viewKey]: {
          landmarks: result?.landmarks || null,
          imageDataUrl: result?.imageDataUrl || null
        }
      };
      setCaptures(updatedCaptures);

      if (step < 3) {
        setStep(step + 1);
      } else {
        // All three views captured — build the full report.
        // Calibration is derived from the front-view capture (best
        // full-body, front-facing landmarks) and reused across all planes.
        const parsedHeight = parseFloat(heightInches);
        const calibration =
          parsedHeight > 0
            ? buildCalibration(updatedCaptures.front?.landmarks, parsedHeight)
            : null;

        const front = analyzeFrontalPosture(updatedCaptures.front?.landmarks, calibration);
        const side = analyzeProfilePosture(updatedCaptures.side?.landmarks, calibration);
        const back = analyzeBackPosture(updatedCaptures.back?.landmarks, calibration);
        const transverse = analyzeTransversePlane(updatedCaptures.front?.landmarks);

        const fullReport = buildPostureReport({ front, side, back, transverse });
        fullReport.bodyProportions = deriveBodyProportions(updatedCaptures.front?.landmarks);
        setReport(fullReport);
        setStep(4);

        await savePostureReport(fullReport, updatedCaptures, parsedHeight > 0 ? parsedHeight : null);
      }
    } catch (err) {
      console.error("Posture capture failed:", err);
    } finally {
      setScanning(false);
    }
  };

  // 5. Persist the report to the backend (Node/Express + MongoDB)
  const savePostureReport = async (fullReport, allCaptures, calibratedHeightInches) => {
    setSaveStatus("saving");
    try {
      const payload = {
        profileId: profileId || "guest_user",
        overallScore: fullReport.overallScore,
        generatedAt: fullReport.generatedAt,
        planes: fullReport.planes,
        findings: fullReport.findings,
        recommendations: fullReport.recommendations,
        bodyProportions: fullReport.bodyProportions,
        heightInches: calibratedHeightInches,
        images: {
          front: allCaptures.front?.imageDataUrl || null,
          side: allCaptures.side?.imageDataUrl || null,
          back: allCaptures.back?.imageDataUrl || null
        }
      };

      const res = await fetch("/api/posture/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}) },
        body: JSON.stringify(payload)
      });

      setSaveStatus(res.ok ? "saved" : "error");
    } catch (err) {
      console.error("Backend sync failed:", err);
      setSaveStatus("error");
    }
  };

  const handleDownloadPdf = async () => {
    setPdfStatus("generating");
    const success = await generatePosturePDF(reportRef, profileId || "Athlete");
    setPdfStatus(success ? "done" : "error");
  };

  const handleRestart = () => {
    setStep(1);
    setCaptures({});
    setReport(null);
    setSaveStatus("idle");
    setPdfStatus("idle");
  };

  const exitAssessment = () => {
    // Reset local capture state before unmounting. The camera stream and
    // pose detector are released by this component's cleanup effects.
    handleRestart();
    navigate("/dashboard");
  };

  const handleRetakeCurrentView = () => {
    const key = STEP_CONFIG[step]?.key;
    if (!key) return;
    setCaptures((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    setShowTips(false);
  };

  const currentConfig = STEP_CONFIG[step] || STEP_CONFIG[1];
  const currentCaptureUi = CAPTURE_UI[step] || CAPTURE_UI[1];

  return (
    <div
      className="dashboard-layout posture-page-layout"
      style={{ maxWidth: "1200px", margin: "0 auto", padding: "clamp(10px, 3vw, 24px)", boxSizing: "border-box" }}
    >

      {/* Header */}
      <div
        className="posture-header"
        style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", justifyContent: "space-between" }}
      >
        <h2 className="posture-title" style={{ fontSize: "clamp(16px, 4vw, 22px)", margin: 0 }}>
          📐 {step < 4 ? currentConfig.title : "Assessment Complete"}
        </h2>
        <button className="cancel-btn" onClick={() => navigate('/dashboard')}>← Back to Hub</button>
      </div>

      {step < 4 && (
        <div
          className="posture-grid"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(280px, 480px) 1fr",
            gap: "clamp(12px, 2.5vw, 24px)",
            marginTop: "clamp(10px, 2vw, 20px)",
            alignItems: "start"
          }}
        >

          {/* Camera Feed with AR HUD Interface.
              aspectRatio keeps a stable portrait frame at ANY viewport
              width instead of a fixed px box, and maxHeight keeps it from
              overflowing the viewport vertically on short/landscape screens. */}
          <div
            className="camera-feed-box"
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3 / 4",
              maxHeight: "78vh",
              margin: "0 auto",
              overflow: "hidden",
              borderRadius: "16px",
              background: "#000"
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
            <canvas
              ref={canvasRef}
              className="camera-canvas"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            />

            <img className="posture-left-guide" src="/posture-capture/left-panel.png" alt="Lighting and stance guidance" />
            <img className="posture-right-guide" src={currentCaptureUi.rightPanel} alt={`${currentCaptureUi.label} alignment guidance`} />

            {/* Top HUD Status Pill */}
            <div style={{ position: "absolute", top: "clamp(8px,2vw,16px)", left: "50%", transform: "translateX(-50%)", background: "rgba(8, 8, 12, 0.85)", border: "1px solid #c8ff00", padding: "6px clamp(10px,3vw,16px)", borderRadius: "20px", fontSize: "clamp(10px, 2.6vw, 12px)", color: "#c8ff00", fontWeight: 700, backdropFilter: "blur(6px)", whiteSpace: "nowrap", maxWidth: "90%", textOverflow: "ellipsis", overflow: "hidden" }}>
              {currentConfig.prompt}
            </div>

            {/* Step indicator */}
            <div style={{ position: "absolute", top: "clamp(8px,2vw,16px)", right: "clamp(8px,2vw,16px)", background: "rgba(8, 8, 12, 0.85)", border: "1px solid #222232", padding: "4px 10px", borderRadius: "12px", fontSize: "clamp(10px,2.2vw,11px)", color: "#f0f0f5" }}>
              View {step}/3
            </div>

            {/* Camera Flip Button */}
            <button onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")} className="posture-flip-camera" type="button">
              📷 Flip Camera
            </button>

            {/* Visual Countdown Overlay HUD */}
            {countdown !== null && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(40px, 14vw, 72px)", fontFamily: "Syne", fontWeight: 800, color: "#c8ff00", zIndex: 10 }}>
                {countdown}
              </div>
            )}

            {/* Processing Snapshot Spinner */}
            {scanning && (
              <div className="scanning-overlay">
                <div className="spinner" />
                <span>Analyzing Frame Geometry...</span>
              </div>
            )}

            {showTips && <img className="posture-tip-card" src={currentCaptureUi.tip} alt={currentConfig.instructions} />}

            <div className="posture-capture-controls">
              <button onClick={handleRetakeCurrentView} className="posture-image-control" type="button" aria-label="Retake current view"><img src="/posture-capture/retake-btn.png" alt="" /><span>Retake</span></button>
              <button onClick={triggerCaptureSequence} disabled={countdown !== null || scanning} className="posture-image-control posture-capture-button" type="button" aria-label="Capture posture view"><img src="/posture-capture/capture-btn.png" alt="" /><span>{countdown !== null ? countdown : "Capture"}</span></button>
              <button onClick={() => setShowTips((visible) => !visible)} className="posture-image-control" type="button" aria-label="Show capture tips"><img src="/posture-capture/tips-btn.png" alt="" /><span>Tips</span></button>
            </div>
          </div>

          {/* Control & Telemetry Panel */}
          <div className="results-panel" style={{ width: "100%", boxSizing: "border-box" }}>
            <div>
              <h3 className="panel-heading" style={{ fontSize: "clamp(14px, 3vw, 16px)" }}>Live HUD Capture (View {step}/3)</h3>
              <p className="panel-desc" style={{ fontSize: "clamp(12px, 2.8vw, 14px)" }}>{currentConfig.instructions}</p>
            </div>

            {step === 1 && (
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "clamp(11px,2.4vw,12px)", color: "#c8ff00", marginBottom: "4px" }}>
                  Height in inches (optional — enables real-world inch/degree readings instead of % of frame)
                </label>
                <input
                  type="number"
                  min="24"
                  max="96"
                  placeholder="e.g. 68"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  style={{ background: "#16161f", border: "1px solid #222232", color: "#f0f0f5", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", width: "100%", maxWidth: "200px", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div className="panel-actions posture-snap-action" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <button className="action-btn" onClick={triggerCaptureSequence} disabled={countdown !== null || scanning} style={{ flex: isMobile ? "1 1 100%" : "0 1 auto" }}>
                {countdown !== null ? `Capturing in ${countdown}...` : `Snap & Analyze ${currentConfig.key.charAt(0).toUpperCase() + currentConfig.key.slice(1)} View ⚡`}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* STEP 4: FULL 3-PLANE REPORT                          */}
      {/* --------------------------------------------------- */}
      {step === 4 && report && (
        <div
          className="posture-grid"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
            gap: "clamp(12px, 2.5vw, 24px)",
            marginTop: "clamp(10px, 2vw, 20px)",
            alignItems: "start"
          }}
        >
          <div className="results-panel" ref={reportRef} style={{ background: "#ffffff", color: "#111", padding: "clamp(14px, 3vw, 24px)", boxSizing: "border-box", width: "100%" }}>

            {/* Report header/masthead — lives inside reportRef so it's part
                of what html2canvas captures, meaning it prints at the top
                of the downloaded PDF automatically. */}
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 2.5vw, 14px)", marginBottom: "16px", paddingBottom: "14px", borderBottom: "2px solid #111" }}>
              <img
                src={repUpLogo}
                alt="RepUp"
                style={{ width: "clamp(44px, 9vw, 60px)", height: "clamp(44px, 9vw, 60px)", borderRadius: "50%", flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "clamp(17px, 4vw, 22px)", fontWeight: 800, letterSpacing: "0.5px", color: "#111", lineHeight: 1.1 }}>
                  REP<span style={{ color: "#7cc700" }}>UP</span>
                </div>
                <div style={{ fontSize: "clamp(11px, 2.6vw, 13px)", color: "#555", fontWeight: 600 }}>
                  Your Personal AI Coach
                </div>
              </div>
            </div>

            <h3 className="panel-heading" style={{ color: "#111", fontSize: "clamp(15px, 3.4vw, 18px)" }}>Full Biomechanical Posture Report</h3>

            <div className="metric-card" style={{ padding: "12px", marginBottom: "16px" }}>
              <span className="metric-label">Composite Alignment Score</span>
              <span className="metric-value">{report.overallScore}/100</span>
            </div>

            {/* Captured views — fluid image width instead of a fixed 160px,
                so three photos still fit nicely on a narrow phone screen. */}
            <div style={{ display: "flex", gap: "clamp(8px,2vw,12px)", marginBottom: "20px", flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
              {["front", "side", "back"].map((viewKey) => (
                captures[viewKey]?.imageDataUrl && (
                  <div key={viewKey} style={{ textAlign: "center", width: "clamp(90px, 28vw, 160px)" }}>
                    <img
                      src={captures[viewKey].imageDataUrl}
                      alt={`${viewKey} view`}
                      style={{ width: "100%", height: "auto", borderRadius: "8px", border: "1px solid #ddd", display: "block" }}
                    />
                    <div style={{ fontSize: "clamp(10px,2.4vw,12px)", marginTop: "4px", textTransform: "capitalize" }}>{viewKey} View</div>
                  </div>
                )
              ))}
            </div>

            {/* Plane scores (quick summary) */}
            <div className="results-details" style={{ marginBottom: "20px", fontSize: "clamp(12px, 2.8vw, 14px)" }}>
              <div><b>🟢 Coronal (Front):</b> Score {report.planes.front.score}/100</div>
              <div><b>🟢 Sagittal (Side):</b> Score {report.planes.side.score}/100</div>
              <div><b>🟢 Coronal (Back):</b> Score {report.planes.back.score}/100</div>
              <div><b>🟢 Transverse (Rotational):</b> Score {report.planes.transverse.score}/100</div>
            </div>

            {/* Joint-by-joint tables, head to toe, per view */}
            <JointTable title="Frontal View — Joint Alignment" joints={report.planes.front.joints} />
            <JointTable title="Side View — Plumb Line Alignment" joints={report.planes.side.joints} />
            <JointTable title="Back View — Joint Alignment" joints={report.planes.back.joints} />
            <JointTable title="Rotational Screening" joints={report.planes.transverse.joints} />

            {/* Findings */}
            <div style={{ marginBottom: "16px", fontSize: "clamp(12px, 2.8vw, 14px)" }}>
              <h4 style={{ margin: "0 0 8px" }}>Findings</h4>
              <ul style={{ paddingLeft: "20px" }}>
                {report.findings.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>

            {/* Recommendations */}
            <div style={{ display: "flex", gap: "clamp(12px,3vw,24px)", flexWrap: "wrap", fontSize: "clamp(12px, 2.8vw, 14px)" }}>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <h4 style={{ margin: "0 0 8px" }}>Avoid</h4>
                <ul style={{ paddingLeft: "20px" }}>
                  {report.recommendations.avoid.length
                    ? report.recommendations.avoid.map((a, i) => <li key={i}>{a}</li>)
                    : <li>Nothing flagged to avoid.</li>}
                </ul>
              </div>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <h4 style={{ margin: "0 0 8px" }}>Focus On</h4>
                <ul style={{ paddingLeft: "20px" }}>
                  {report.recommendations.focusOn.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            </div>

          </div>

          <div className="results-panel" style={{ width: "100%", boxSizing: "border-box" }}>
            <div>
              <h3 className="panel-heading" style={{ fontSize: "clamp(14px, 3vw, 16px)" }}>Report Actions</h3>
              <p className="panel-desc" style={{ fontSize: "clamp(12px, 2.8vw, 14px)" }}>
                {saveStatus === "saving" && "Saving your report to your profile..."}
                {saveStatus === "saved" && "✅ Report saved to your profile."}
                {saveStatus === "error" && "⚠️ Couldn't save to the server, but your report is still visible below."}
              </p>
            </div>

            <div className="panel-actions" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className="action-btn" onClick={handleDownloadPdf} disabled={pdfStatus === "generating"}>
                {pdfStatus === "generating" ? "Generating PDF..." : "⬇ Download PDF Report"}
              </button>
              <button className="action-btn" onClick={handleRestart}>
                Run New Assessment 🔄
              </button>
              <button
                className="cancel-btn"
                onClick={() => navigate('/ai-coach', { state: { postureReport: report } })}
              >
                Consult AI Trainer on Results →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
