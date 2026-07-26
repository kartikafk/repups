import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles.css"; // Ensure this matches your global/stylesheet path

export default function HomeDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);

  const [metrics, setMetrics] = useState({ postureScore: 84, steps: 0, caloriesBurned: 0, formAccuracy: "96%" });
  const [showLogModal, setShowLogModal] = useState(false);
  const [inputSteps, setInputSteps] = useState("");
  const [inputCalories, setInputCalories] = useState("");

  // AI Coach Widget States for Home Screen Integration
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [chatLog, setChatLog] = useState([
    { role: "ai", text: "Hey athlete! I'm your real-time RepUps AI Coach. I've synced your posture score and telemetry. What form check or mobility issue can I help you troubleshoot right now?" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  const profileId = localStorage.getItem("profileId");

  // Center Background 3D Volumetric Solid Mannequin Mesh Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      angle += 0.005;

      const centerX = width * 0.5;
      const centerY = height * 0.38; 
      const scale = width < 768 ? 1.1 : 1.45;

      const levels = [
        { y: -110, r: 16 }, 
        { y: -90,  r: 12 }, 
        { y: -75,  r: 15 }, 
        { y: -55,  r: 30 }, 
        { y: -25,  r: 24 }, 
        { y: 0,    r: 20 }, 
        { y: 30,   r: 26 }, 
        { y: 65,   r: 16 }, 
        { y: 105,  r: 12 }, 
        { y: 145,  r: 10 }, 
        { y: 175,  r: 8 }   
      ];

      const projectedLevels = levels.map((lvl) => {
        const points = [];
        const steps = 10;
        for (let i = 0; i < steps; i++) {
          const theta = (i / steps) * Math.PI * 2 + angle;
          const x3d = Math.cos(theta) * lvl.r;
          const z3d = Math.sin(theta) * lvl.r;
          const y3d = lvl.y;

          const cosA = Math.cos(angle * 0.4);
          const sinA = Math.sin(angle * 0.4);
          const rx = x3d * cosA - z3d * sinA;
          const rz = x3d * sinA + z3d * cosA;

          const fov = 450;
          const depth = fov / (fov + rz + 200);
          points.push({
            x: centerX + rx * scale * depth,
            y: centerY + y3d * scale * depth,
            z: rz,
            alpha: (rz + lvl.r) / (lvl.r * 2)
          });
        }
        return points;
      });

      projectedLevels.forEach((ring) => {
        ctx.strokeStyle = "rgba(200, 255, 0, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ring.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
      });

      for (let i = 0; i < projectedLevels[0].length; i++) {
        ctx.strokeStyle = "rgba(138, 138, 171, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        projectedLevels.forEach((ring, rIdx) => {
          const p = ring[i];
          if (rIdx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }

      const shoulderLeft = projectedLevels[3]?.[2];
      if (shoulderLeft) {
        ctx.fillStyle = "#c8ff00";
        ctx.beginPath();
        ctx.arc(shoulderLeft.x, shoulderLeft.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(200, 255, 0, 0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(shoulderLeft.x, shoulderLeft.y, 11, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    if (profileId) {
      fetch(`http://localhost:5001/api/dashboard/${profileId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.dashboardMetrics) {
            setMetrics(data.dashboardMetrics);
          }
        })
        .catch(err => console.log("Using cached dashboard telemetry"));
    }
  }, [profileId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, aiLoading]);

  const handleLogActivity = async () => {
    if (!profileId) return;

    try {
      const res = await fetch('http://localhost:5001/api/dashboard/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          steps: inputSteps ? Number(inputSteps) : metrics.steps,
          caloriesBurned: inputCalories ? Number(inputCalories) : metrics.caloriesBurned
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.dashboardMetrics);
        setShowLogModal(false);
        setInputSteps("");
        setInputCalories("");
      }
    } catch (err) {
      alert("Failed to sync activity log with database.");
    }
  };

  const handleSendAiMessage = async () => {
    if (!aiQuery.trim() || aiLoading) return;
    const query = aiQuery.trim();
    setAiQuery("");

    const updatedLog = [...chatLog, { role: "user", text: query }];
    setChatLog(updatedLog);
    setAiLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, query })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChatLog([...updatedLog, { role: "ai", text: data.reply }]);
      } else {
        setChatLog([...updatedLog, { role: "ai", text: "I'm analyzing your current telemetry matrix. Keep your core braced and ensure your camera angle covers your full body." }]);
      }
    } catch (err) {
      setChatLog([...updatedLog, { role: "ai", text: "Connection error with AI Core. Check your server status." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const navItems = [
    { label: "Posture", path: "/posture-assessment", icon: "📐" },
    { label: "Workout", path: "/workout", icon: "🏋️" },
    { label: "AI Coach", path: "/ai-coach", icon: "🤖" },
    { label: "Community", path: "/community", icon: "👥" },
    { label: "Tracks", path: "/workout-tracks", icon: "📋" }
  ];

  return (
    <div className="dashboard-layout" style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      
      {/* Center Background 3D Volumetric Mannequin Mesh Canvas */}
      <canvas ref={canvasRef} className="bg-canvas" />

      {/* Dashboard Main Content Body docked cleanly above the bottom navigation bar */}
      <div className="dashboard-body" style={{ paddingBottom: "100px", boxSizing: "border-box" }}>
        
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <button className="quick-log-btn" onClick={() => setShowLogModal(true)}>
            + Log Activity Telemetry
          </button>
          
          {/* Quick Trigger Button for the Embedded AI Coach Drawer */}
          <button 
            onClick={() => setShowAiModal(true)} 
            style={{ background: "#16161f", border: "1px solid #c8ff0040", color: "#c8ff00", padding: "10px 16px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            🤖 Ask Live AI Coach
          </button>
        </div>

        {/* 2 x 2 Matrix Telemetry Grid */}
        <div className="metrics-matrix">
          <div className="metric-card">
            <span className="metric-label">Structural Posture Score</span>
            <span className="metric-value">{metrics.postureScore}/100</span>
            <span className="metric-sub">Sagittal & Coronal parity</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Daily Step Count</span>
            <span className="metric-value">{metrics.steps.toLocaleString()}</span>
            <span className="metric-sub">Live telemetry sync</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Energy Expenditure</span>
            <span className="metric-value">{metrics.caloriesBurned} kcal</span>
            <span className="metric-sub">Estimated kinetic output</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Form Accuracy Index</span>
            <span className="metric-value">{metrics.formAccuracy}</span>
            <span className="metric-sub">MediaPipe neural tracking</span>
          </div>
        </div>

      </div>

      {/* Fixed Responsive Bottom Navigation Bar */}
      <div className="bottom-nav-bar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={item.path} 
              className={`nav-btn ${isActive ? "nav-btn-active" : ""}`}
              onClick={() => {
                if (item.label === "AI Coach") {
                  // Opens the quick live widget drawer or lets them navigate to full page via double-click if preferred
                  setShowAiModal(true);
                } else {
                  navigate(item.path);
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Embedded Live AI Coach Chat Drawer / Modal */}
      {showAiModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px", boxSizing: "border-box" }} onClick={() => setShowAiModal(false)}>
          <div style={{ background: "#111116", border: "1px solid #222232", borderRadius: "16px", width: "100%", maxWidth: "550px", height: "500px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.8)" }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ padding: "16px 20px", background: "#16161f", borderBottom: "1px solid #222232", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c8ff00", boxShadow: "0 0 8px #c8ff00" }} />
                <span style={{ fontWeight: 800, fontSize: "15px", color: "#f0f0f5", fontFamily: "Syne" }}>RepUps Real-Time AI Coach</span>
              </div>
              <button onClick={() => setShowAiModal(false)} style={{ background: "transparent", border: "none", color: "#8a8aab", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            {/* Chat Stream */}
            <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", scrollbarWidth: "none" }}>
              <style>{`div::-webkit-scrollbar { display: none; }`}</style>
              {chatLog.map((msg, index) => (
                <div key={index} style={{ alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end', background: msg.role === 'ai' ? '#16161f' : '#c8ff00', color: msg.role === 'ai' ? '#f0f0f5' : '#000', padding: "10px 14px", borderRadius: "12px", fontSize: "13px", maxWidth: "85%", lineHeight: "1.4", fontWeight: msg.role === 'user' ? 600 : 400, border: `1px solid ${msg.role === 'ai' ? '#222232' : 'transparent'}` }}>
                  {msg.text}
                </div>
              ))}
              {aiLoading && <div style={{ alignSelf: 'flex-start', background: '#16161f', color: '#8a8aab', padding: "8px 12px", borderRadius: "10px", fontSize: "12px" }}>Analyzing your profile data & posture report...</div>}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{ padding: "14px 16px", background: "#16161f", borderTop: "1px solid #222232", display: "flex", gap: "8px" }}>
              <input 
                type="text" 
                placeholder="Ask about your posture, mobility, or workout plan..." 
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}
                style={{ flex: 1, background: "#111116", border: "1px solid #222232", borderRadius: "10px", padding: "10px 14px", color: "#f0f0f5", fontSize: "13px", outline: "none" }}
              />
              <button onClick={handleSendAiMessage} style={{ background: "#c8ff00", color: "#000", border: "none", padding: "0 18px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontFamily: "Syne" }}>
                Send
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Manual Activity Logging Modal */}
      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Log Telemetry Input</h3>
            <div className="modal-fields">
              <div>
                <label className="modal-label">TOTAL STEPS</label>
                <input className="modal-input" type="number" placeholder="e.g., 8500" value={inputSteps} onChange={e => setInputSteps(e.target.value)} />
              </div>
              <div>
                <label className="modal-label">ACTIVE CALORIES (KCAL)</label>
                <input className="modal-input" type="number" placeholder="e.g., 520" value={inputCalories} onChange={e => setInputCalories(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowLogModal(false)}>Cancel</button>
              <button className="action-btn" onClick={handleLogActivity}>Commit Sync ✓</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}