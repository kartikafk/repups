import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Bot, BrainCircuit, Dumbbell, FileText, Home, Paperclip, ScanLine, Send, SlidersHorizontal, User, X } from "lucide-react";
import { authHeaders } from "../../api.js";

const C = { bg: "#030405", surface: "#090B0D", card: "#0D1012", border: "#242A2F", lime: "#C8FF3D", blue: "#1687FF", text: "#FFFFFF", muted: "#90989E", red: "#FF5A67" };
const suggestedPrompts = ["Why does my lower back hurt during squats?", "Build me a mobility routine for tight hips", "How do I fix rounded shoulders?", "Is my current plan right for hypertrophy?"];
const iconButton = { width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, color: C.text, cursor: "pointer" };

function TypingDots() {
  return <div style={{ display: "flex", gap: 5, padding: "12px 14px" }}>{[0, 1, 2].map((dot) => <i key={dot} style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue, animation: `rpBounce 1s ${dot * 0.14}s infinite` }} />)}<style>{"@keyframes rpBounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-4px);opacity:1}}"}</style></div>;
}

function FileBadge({ file, removable, onRemove, user }) {
  const isImage = file.type?.startsWith("image/");
  return <div style={{ display: "flex", alignItems: "center", gap: 7, maxWidth: 230, padding: "6px 8px", borderRadius: 9, background: user ? "#00000022" : C.surface, border: `1px solid ${user ? "#ffffff2a" : C.border}` }}>
    {isImage && file.previewUrl ? <img src={file.previewUrl} alt={file.name} style={{ width: 26, height: 26, objectFit: "cover", borderRadius: 6 }} /> : <FileText size={17} color={user ? C.text : C.blue} />}
    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{file.name}</span>
    {removable && <button type="button" aria-label={`Remove ${file.name}`} onClick={onRemove} style={{ marginLeft: "auto", border: 0, padding: 0, background: "transparent", color: C.muted, cursor: "pointer", display: "grid" }}><X size={15} /></button>}
  </div>;
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 8 }}>
    {!isUser && <div style={{ width: 30, height: 30, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", background: "#102438", color: C.blue, border: "1px solid #1b6098" }}><BrainCircuit size={16} /></div>}
    <div style={{ maxWidth: "80%", padding: "11px 13px", borderRadius: isUser ? "15px 15px 3px 15px" : "15px 15px 15px 3px", background: isUser ? "#126CFF" : C.card, border: isUser ? "none" : `1px solid ${C.border}`, color: C.text, fontSize: 13, lineHeight: 1.55 }}>
      {msg.attachments?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: msg.text ? 8 : 0 }}>{msg.attachments.map((file, index) => <FileBadge key={`${file.name}-${index}`} file={file} user={isUser} />)}</div>}
      {msg.text}
    </div>
  </div>;
}

function PrescriptionCard({ data }) {
  if (!data) return null;
  const hasContent = data.injuryRisks?.length || data.mobilityRoutine?.length || data.workoutCues?.length || data.personalizedPlan?.length;
  if (!hasContent) return null;
  return <section style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 16, padding: 14 }}>
    <h2 style={{ margin: "0 0 11px", fontSize: 15, color: C.blue }}>Daily Mobility Prescription</h2>
    {data.injuryRisks?.length > 0 && <div style={{ marginBottom: 10 }}>{data.injuryRisks.map((risk, index) => <p key={index} style={{ margin: "5px 0", color: C.red, fontSize: 12 }}>• {risk}</p>)}</div>}
    {data.mobilityRoutine?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>{data.mobilityRoutine.map((item, index) => <span key={index} style={{ border: "1px solid #1c66a0", borderRadius: 99, padding: "6px 9px", color: C.text, fontSize: 11 }}>{item}</span>)}</div>}
    {data.workoutCues?.length > 0 && <div>{data.workoutCues.map((cue, index) => <p key={index} style={{ margin: "4px 0", color: C.lime, fontSize: 12 }}>✓ {cue}</p>)}</div>}
    {data.personalizedPlan?.map((day, index) => <div key={index} style={{ marginTop: 8, padding: 10, borderRadius: 10, background: C.surface }}><b style={{ fontSize: 12 }}>{day.day || `Day ${index + 1}`}</b><span style={{ color: C.lime, fontSize: 11, marginLeft: 7 }}>{day.focus}</span>{day.exercises?.map((exercise, exerciseIndex) => <p key={exerciseIndex} style={{ color: C.muted, fontSize: 11, margin: "4px 0 0" }}>• {exercise}</p>)}</div>)}
  </section>;
}

export default function AIOnboardingChat({ coachInsight = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  let parsedUser = { name: "Athlete" };
  try { const rawUser = localStorage.getItem("user"); if (rawUser) parsedUser = JSON.parse(rawUser); } catch {}
  const userName = parsedUser.name;
  const profileId = parsedUser.id || localStorage.getItem("profileId");
  const [messages, setMessages] = useState([{ role: "ai", text: `Hello ${userName}! I’m your RepUps AI biomechanics and form coach. Ask me about form, pain points, mobility, or your plan.` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [postureData, setPostureData] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { if (coachInsight) setMessages((current) => current.some((message) => message.text === coachInsight) ? current : [...current, { role: "ai", text: coachInsight }]); }, [coachInsight]);
  useEffect(() => { if (!profileId) return; fetch(`/api/posture/${profileId}/latest`, { headers: authHeaders() }).then((response) => response.json()).then((data) => { if (data.success && data.record) setPostureData(data.record); }).catch(() => {}); }, [profileId]);
  useEffect(() => { if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight; }, [messages, loading, prescription]);

  const handleFilePick = (event) => { const files = Array.from(event.target.files || []).map((file) => ({ file, name: file.name, type: file.type, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null })); setPendingFiles((current) => [...current, ...files]); event.target.value = ""; };
  const removePendingFile = (index) => setPendingFiles((current) => { const file = current[index]; if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl); return current.filter((_, itemIndex) => itemIndex !== index); });
  const sendMessage = async (text) => {
    if (!text.trim() && pendingFiles.length === 0) return;
    const filesToSend = pendingFiles.map((item) => item.file);
    const attachments = pendingFiles.map(({ file, ...attachment }) => attachment);
    setMessages((current) => [...current, { role: "user", text, attachments }]); setInput(""); setPendingFiles([]); setLoading(true);
    try {
      let response;
      if (filesToSend.length) { const form = new FormData(); form.append("profileId", profileId || ""); form.append("query", text); if (postureData) form.append("postureData", JSON.stringify(postureData)); filesToSend.forEach((file) => form.append("attachments", file)); response = await fetch("/api/ai-coach/chat", { method: "POST", headers: authHeaders(), body: form }); }
      else response = await fetch("/api/ai-coach/chat", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ profileId, query: text, postureData }) });
      const data = await response.json();
      setMessages((current) => [...current, { role: "ai", text: response.ok && data.success ? data.reply || data.response : "I’m having trouble syncing your metrics right now. Please try again shortly." }]);
    } catch { setMessages((current) => [...current, { role: "ai", text: "Network connection error with the AI server." }]); } finally { setLoading(false); }
  };
  const generatePrescription = async () => {
    setPrescriptionLoading(true);
    try { const response = await fetch("/api/ai-coach/generate-prescription", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ profileId, postureData }) }); setPrescription(await response.json()); }
    catch { setMessages((current) => [...current, { role: "ai", text: "Couldn’t generate a prescription right now — please try again shortly." }]); }
    finally { setPrescriptionLoading(false); }
  };
  const navItems = [{ label: "Home", path: "/dashboard", icon: Home }, { label: "Workout", path: "/workout", icon: Dumbbell }, { label: "Assess", path: "/posture-assessment", icon: ScanLine }, { label: "Coach", path: "/ai-coach", icon: Bot }, { label: "Profile", path: "/client/profile", icon: User }];

  return <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "var(--sans, Inter, sans-serif)" }}>
    <main style={{ maxWidth: 430, minHeight: "100dvh", margin: "0 auto", padding: "12px 14px calc(151px + env(safe-area-inset-bottom, 0px))" }}>
      <header style={{ display: "grid", gridTemplateColumns: "38px 1fr 38px", alignItems: "center", marginBottom: 13 }}><button type="button" aria-label="Go back" onClick={() => navigate(-1)} style={iconButton}><ArrowLeft size={19} /></button><h1 style={{ margin: 0, textAlign: "center", fontSize: 17, fontWeight: 800 }}>AI Coach</h1><button type="button" aria-label="Generate daily mobility prescription" onClick={generatePrescription} disabled={prescriptionLoading} style={{ ...iconButton, color: C.blue, opacity: prescriptionLoading ? .55 : 1 }}><SlidersHorizontal size={18} /></button></header>
      <section style={{ display: "flex", gap: 9, padding: 11, border: `1px solid ${C.border}`, borderRadius: 13, background: C.surface, marginBottom: 13 }}><BrainCircuit size={19} color={C.blue} /><p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, color: C.muted }}><b style={{ color: C.text }}>General Fitness guidance only.</b><br />Not a substitute for professional advice.</p></section>
      <div ref={streamRef} style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "calc(100dvh - 257px)", overflowY: "auto", paddingRight: 2, scrollbarWidth: "none" }}>
        <PrescriptionCard data={prescription} />
        <section><h2 style={{ margin: "0 0 8px", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: .8 }}>Conversation</h2><div style={{ display: "flex", flexDirection: "column", gap: 11 }}>{messages.map((message, index) => <ChatBubble key={index} msg={message} />)}{loading && <div style={{ display: "flex", gap: 8 }}><div style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: "50%", background: "#102438", color: C.blue }}><BrainCircuit size={16} /></div><div style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: "14px 14px 14px 3px" }}><TypingDots /></div></div>}</div></section>
        {messages.length <= 1 && <section><h2 style={{ margin: "0 0 8px", fontSize: 13, color: C.muted }}>Suggested Resources</h2><div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{suggestedPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => sendMessage(prompt)} style={{ border: "1px solid #1d5c96", background: "#071422", color: C.blue, borderRadius: 99, padding: "7px 10px", cursor: "pointer", fontSize: 11 }}>{prompt}</button>)}</div></section>}
      </div>
    </main>
    <section style={{ position: "fixed", zIndex: 30, bottom: "calc(67px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", width: "min(100%, 430px)", padding: "8px 12px", borderTop: `1px solid ${C.border}`, background: "rgba(3,4,5,.97)", backdropFilter: "blur(12px)" }}>
      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={handleFilePick} style={{ display: "none" }} />
      {pendingFiles.length > 0 && <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>{pendingFiles.map((file, index) => <FileBadge key={`${file.name}-${index}`} file={file} removable onRemove={() => removePendingFile(index)} />)}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); sendMessage(input); } }} placeholder="Ask your coach anything..." style={{ flex: 1, minWidth: 0, height: 44, padding: "0 13px", border: `1px solid ${C.border}`, borderRadius: 13, background: C.surface, color: C.text, outline: "none", fontSize: 13 }} /><button type="button" aria-label="Attach image or document" title="Attach image or document" onClick={() => fileInputRef.current?.click()} style={{ ...iconButton, flexShrink: 0, color: C.muted }}><Paperclip size={18} /></button><button type="button" aria-label="Send message" onClick={() => sendMessage(input)} disabled={loading || (!input.trim() && !pendingFiles.length)} style={{ width: 42, height: 42, border: 0, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, background: C.blue, color: C.text, cursor: "pointer", opacity: loading || (!input.trim() && !pendingFiles.length) ? .45 : 1 }}><Send size={18} /></button></div>
    </section>
    <nav aria-label="Client navigation" style={{ position: "fixed", zIndex: 31, bottom: 0, left: "50%", transform: "translateX(-50%)", display: "flex", width: "min(100%, 430px)", height: "calc(67px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)", borderTop: `1px solid ${C.border}`, background: "#050607" }}>{navItems.map(({ label, path, icon: Icon }) => { const active = location.pathname === path; return <button key={path} type="button" onClick={() => navigate(path)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, border: 0, background: "transparent", color: active ? C.lime : C.muted, cursor: "pointer", fontSize: 10 }}><Icon size={19} strokeWidth={active ? 2.5 : 1.8} /><span>{label}</span></button>; })}</nav>
  </div>;
}
