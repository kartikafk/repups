import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles.css";
import { authHeaders } from "../../api.js";

// ── UI Theme & Constants ────────────────────────────────────────────────────
const C = {
  bg: "#0a0a0a", surface: "#111111", card: "#161616", border: "#222222",
  lime: "#C8F135", red: "#FF4444", blue: "#3B82F6",
  muted: "#555555", text: "#EEEEEE", sub: "#888888",
};

const suggestedPrompts = [
  "Why does my lower back hurt during squats?",
  "Build me a mobility routine for tight hips",
  "How do I fix rounded shoulders?",
  "Is my current plan right for hypertrophy?",
];

// ── Helper Components ───────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%", background: C.lime,
            opacity: 0.6, animation: `rp-bounce 1s ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes rp-bounce {0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-4px);opacity:1}}`}</style>
    </div>
  );
}

function AttachmentChip({ file, isUser }) {
  const isImage = file.type?.startsWith("image/");
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: isUser ? "#00000015" : C.surface,
        border: `1px solid ${isUser ? "#00000022" : C.border}`,
        borderRadius: 8, padding: "6px 8px", marginBottom: 6, maxWidth: 220,
      }}
    >
      {isImage && file.previewUrl ? (
        <img src={file.previewUrl} alt={file.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: isUser ? "#00000020" : C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📄</div>
      )}
      <span style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
    </div>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.lime, color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 8, flexShrink: 0 }}>🤖</div>
      )}
      <div
        style={{
          maxWidth: "75%", background: isUser ? C.lime : C.card,
          border: isUser ? "none" : `1px solid ${C.border}`,
          color: isUser ? "#000" : C.text,
          borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
          padding: "10px 14px", fontSize: 13, lineHeight: 1.6,
        }}
      >
        {msg.attachments?.length > 0 && (
          <div style={{ marginBottom: msg.text ? 8 : 0 }}>
            {msg.attachments.map((f, i) => <AttachmentChip key={i} file={f} isUser={isUser} />)}
          </div>
        )}
        {msg.text}
      </div>
    </div>
  );
}

function PrescriptionCard({ data }) {
  if (!data) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.lime}44`, borderRadius: 14, padding: 18, marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: C.lime, textTransform: "uppercase", letterSpacing: 2, marginBottom: 14, fontWeight: 800 }}>AI-Generated Prescription</div>

      {data.injuryRisks?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.red, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>⚠ Injury Risks</div>
          {data.injuryRisks.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: C.sub, background: C.red + "10", border: `1px solid ${C.red}33`, borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>{r}</div>
          ))}
        </div>
      )}

      {data.mobilityRoutine?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Mobility Routine</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.mobilityRoutine.map((m, i) => (
              <span key={i} style={{ fontSize: 12, color: C.text, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 99, padding: "6px 12px" }}>{m}</span>
            ))}
          </div>
        </div>
      )}

      {data.workoutCues?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.lime, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Form Cues</div>
          {data.workoutCues.map((c, i) => <div key={i} style={{ fontSize: 12, color: C.text, padding: "4px 0" }}>• {c}</div>)}
        </div>
      )}

      {data.personalizedPlan?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Personalized Plan</div>
          {data.personalizedPlan.map((day, i) => (
            <div key={i} style={{ background: C.surface, borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{day.day || `Day ${i + 1}`}</span>
                <span style={{ fontSize: 11, color: C.lime, fontWeight: 700 }}>{day.focus}</span>
              </div>
              {(day.exercises || []).map((ex, j) => <div key={j} style={{ fontSize: 12, color: C.sub, padding: "3px 0" }}>— {ex}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AIOnboardingChat({ coachInsight = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  let parsedUser = { name: "Athlete" };
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) parsedUser = JSON.parse(rawUser);
  } catch (err) {}
  
  const userName = parsedUser.name;
  const profileId = parsedUser.id || localStorage.getItem("profileId");

  const [messages, setMessages] = useState([
    { role: "ai", text: `Hello ${userName}! I'm your full-time RepUps AI Biomechanics & Form Coach. I'm actively analyzing your profile metrics and posture. Ask me about form, pain points, mobility, or tap "Generate Prescription" for a full plan.` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [postureData, setPostureData] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  useEffect(() => {
    if (coachInsight) setMessages((current) => current.some((message) => message.text === coachInsight) ? current : [...current, { role: "ai", text: coachInsight }]);
  }, [coachInsight]);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const navItems = [
    { label: "Posture", path: "/posture-assessment", icon: "📐" },
    { label: "Workout", path: "/workout", icon: "🏋️" },
    { label: "AI Coach", path: "/ai-coach", icon: "🤖" },
    { label: "Community", path: "/community", icon: "👥" },
    { label: "Tracks", path: "/dashboard", icon: "📋" }
  ];

  // Fetch Posture Data on load
  useEffect(() => {
    if (!profileId) return;
    fetch(`/api/posture/${profileId}/latest`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.record) {
          setPostureData(data.record);
        }
      })
      .catch(err => console.log("No posture scan found yet"));
  }, [profileId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, prescription, pendingFiles]);

  // File Handlers
  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map(f => ({
      file: f, name: f.name, type: f.type,
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));
    setPendingFiles(prev => [...prev, ...mapped]);
    e.target.value = "";
  };

  const removePendingFile = (idx) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Send Message Logic
  const sendMessage = async (text) => {
    if (!text.trim() && pendingFiles.length === 0) return;
    
    const attachments = pendingFiles.map(({ file, ...rest }) => rest);
    const userMsg = { role: "user", text, attachments };
    
    setMessages(prev => [...prev, userMsg]);
    const filesToSend = pendingFiles.map(f => f.file);
    
    setInput("");
    setPendingFiles([]);
    setLoading(true);

    try {
      let res;
      if (filesToSend.length > 0) {
        // FormData for attachments
        const form = new FormData();
        form.append("profileId", profileId || "");
        form.append("query", text);
        if (postureData) form.append("postureData", JSON.stringify(postureData));
        filesToSend.forEach(f => form.append("attachments", f));
        
        res = await fetch("/api/ai-coach/chat", { method: "POST", headers: authHeaders(), body: form });
      } else {
        // Standard JSON
        res = await fetch("/api/ai-coach/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ profileId, query: text, postureData }),
        });
      }
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessages(prev => [...prev, { role: "ai", text: data.reply || data.response }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: "I'm having trouble syncing your metrics right now. Make sure your core form is tight and check back!" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Network connection error with the AI server." }]);
    } finally {
      setLoading(false);
    }
  };

  // Generate Prescription
  const generatePrescription = async () => {
    setPrescriptionLoading(true);
    try {
      const res = await fetch("/api/ai-coach/generate-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ profileId, postureData }),
      });
      const data = await res.json();
      setPrescription(data);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Couldn't generate a prescription right now — please try again shortly." }]);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  return (
    <>
      {/* Mapped directly to your CSS classes.
        This forces the layout to stop at the bottom nav bar,
        and makes the middle stream scrollable. 
      */}
      <div className="fullscreen-chatbot-layout">
        
        {/* Top Header */}
        <div className="chatbot-topbar">
          <div className="chatbot-header-brand">
            <div className="chatbot-status-dot" />
            <div>
              <span className="chatbot-title">Welcome back, {userName}</span>
              <span className="chatbot-subtitle">RepUps AI Coach Engine</span>
            </div>
          </div>
          <button 
            className="chatbot-posture-btn" 
            onClick={generatePrescription} 
            disabled={prescriptionLoading}
            style={{ opacity: prescriptionLoading ? 0.6 : 1 }}
          >
            {prescriptionLoading ? "Generating..." : "⚡ Generate Plan"}
          </button>
        </div>

        {/* Scrollable Conversation Stream */}
        <div className="chatbot-stream" ref={scrollRef}>
          <PrescriptionCard data={prescription} />
          
          {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}
          
          {loading && (
            <div style={{ display: "flex" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.lime, color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 8, flexShrink: 0 }}>🤖</div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px 14px 14px 2px" }}>
                <TypingDots />
              </div>
            </div>
          )}

          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  style={{
                    background: C.card, border: `1px solid ${C.border}`, color: C.sub, borderRadius: 99,
                    padding: "8px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* File Attachments Preview */}
          {pendingFiles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {pendingFiles.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", maxWidth: 180 }}>
                  {f.type.startsWith("image/") ? (
                    <img src={f.previewUrl} alt={f.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📄</div>
                  )}
                  <span style={{ fontSize: 11, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <button onClick={() => removePendingFile(i)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="chatbot-bottombar">
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFilePick} style={{ display: "none" }} />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach reports or photos"
            style={{
              background: C.card, border: `1px solid ${C.border}`, color: C.sub, borderRadius: 12,
              width: 44, height: 44, flexShrink: 0, cursor: "pointer", fontSize: 16, display: "flex",
              alignItems: "center", justifyContent: "center"
            }}
          >
            📎
          </button>
          
          <input
            className="chatbot-textbox"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") sendMessage(input); }}
            placeholder="Ask about form, pain, or plan..."
          />
          
          <button
            className="chatbot-send-btn"
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && pendingFiles.length === 0) || loading}
          >
            Send
          </button>
        </div>

      </div>

      {/* Global Bottom Navigation Bar */}
      <div className="bottom-nav-bar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`nav-btn ${isActive ? "nav-btn-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

