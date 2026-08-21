import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, ChevronRight, MoreVertical, Plus, Send, X } from "lucide-react";
import { io } from "socket.io-client";
import { API_ORIGIN, apiUrl } from "../../config.js";

const C = { bg: "#030405", panel: "#0c0f12", panel2: "#11161c", line: "#27303a", lime: "#c8ff3d", blue: "#1976ff", text: "#f5f7fb", muted: "#94a0b0", bad: "#ff5c70" };
const card = { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16 };
const iconButton = { width: 37, height: 37, display: "grid", placeItems: "center", borderRadius: 11, border: `1px solid ${C.line}`, background: C.panel2, color: C.text, cursor: "pointer" };
const outlineButton = { minHeight: 34, padding: "7px 10px", borderRadius: 9, border: "1px solid #126dce", background: "transparent", color: "#4da5ff", cursor: "pointer", fontSize: 11, fontWeight: 700 };

function initials(name = "") { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "TC"; }

export default function TrainerChat({ initialTrainerId }) {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(initialTrainerId || null);
  const [messages, setMessages] = useState([]);
  const [trainerSlots, setTrainerSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [trainerProfile, setTrainerProfile] = useState(null);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [draft, setDraft] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const clientId = currentUser._id || currentUser.id;
  const trainerId = initialTrainerId || activeId;

  const loadTrainerSlots = async () => {
    if (!trainerId) return;
    setLoadingSlots(true); setSlotsError("");
    try {
      const response = await fetch(apiUrl(`trainers/${trainerId}/slots`), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load availability.");
      setTrainerSlots(data.slots || []);
    } catch (error) { setTrainerSlots([]); setSlotsError(error.message || "Could not load availability."); }
    finally { setLoadingSlots(false); }
  };

  useEffect(() => {
    if (!trainerId) return;
    (async () => {
      try {
        const response = await fetch(apiUrl(`trainers/${trainerId}`)); const data = await response.json();
        if (data.success) setTrainerProfile(data.trainer);
      } catch (error) { console.error("Failed to fetch trainer profile:", error); }
    })();
  }, [trainerId]);

  useEffect(() => {
    const options = { auth: { token } };
    socketRef.current = API_ORIGIN ? io(API_ORIGIN, options) : io(options);
    socketRef.current.on("message:new", (message) => {
      if (!trainerId || !message.trainerId || String(message.trainerId) === String(trainerId)) setMessages((previous) => [...previous, message]);
    });
    return () => socketRef.current?.disconnect();
  }, [token, trainerId]);

  useEffect(() => {
    if (!trainerId || !clientId) return;
    (async () => {
      try {
        const response = await fetch(apiUrl(`messages/thread?trainerId=${trainerId}&clientId=${clientId}`), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = await response.json();
        if (data.success) setMessages(data.messages || []);
        socketRef.current?.emit("join_thread", { trainerId, clientId });
      } catch (error) { console.error("Error loading messages:", error); }
    })();
  }, [trainerId, clientId, token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const handleSend = async () => {
    if (!draft.trim() || !trainerId || !clientId) return;
    const text = draft.trim(); setDraft("");
    try {
      const response = await fetch(apiUrl("messages/send"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ trainerId, clientId, text }) });
      const data = await response.json(); if (data.success) setMessages((previous) => [...previous, data.message]);
    } catch (error) { console.error("Send message error:", error); }
  };

  const handleConfirmBooking = async (slotId) => {
    try {
      const response = await fetch(apiUrl("bookings"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ trainerId, clientId, slotId }) });
      const data = await response.json();
      if (data.success) { setShowSlotPicker(false); setMessages((previous) => [...previous, { from: "system", text: "Video call booked successfully.", time: "Just now" }]); }
    } catch (error) { console.error("Booking error:", error); }
  };

  const openBooking = () => { setShowSlotPicker(true); loadTrainerSlots(); };
  const displayName = trainerProfile?.name || "Your trainer";
  const avatar = trainerProfile?.photoUrl ? { backgroundImage: `url(${trainerProfile.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {};
  const nav = [["Home", "/client-dashboard", "⌂"], ["Workout", "/client/workout-plan", "♧"], ["Assess", "/posture-assessment", "⌗"], ["Coach", "/client/my-trainer", "◌"], ["Profile", "/client/profile", "♙"]];

  return <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "var(--sans, Inter, sans-serif)", paddingBottom: 154 }}>
    <main style={{ width: "min(100%, 430px)", minHeight: "100dvh", margin: "0 auto", padding: "14px 14px 26px" }}>
      <header style={{ minHeight: 60, display: "grid", gridTemplateColumns: "40px 1fr 82px", alignItems: "center", gap: 8 }}>
        <button onClick={() => navigate(-1)} aria-label="Back" style={iconButton}><ArrowLeft size={21} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}><div style={{ ...avatar, width: 38, height: 38, borderRadius: "50%", border: `1px solid rgba(200,255,61,.75)`, backgroundColor: "#182313", display: "grid", placeItems: "center", color: C.lime, fontWeight: 800, flexShrink: 0 }}>{!trainerProfile?.photoUrl && initials(displayName)}</div><div style={{ minWidth: 0 }}><strong style={{ fontSize: 14, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</strong><span style={{ color: C.lime, fontSize: 11 }}>● Online</span></div></div>
        <div style={{ display: "flex", justifyContent: "end", gap: 6 }}><button onClick={openBooking} aria-label="Book session" style={iconButton}><CalendarDays size={18} /></button><button onClick={openBooking} aria-label="More options" style={iconButton}><MoreVertical size={19} /></button></div>
      </header>
      <section style={{ ...card, padding: 16, marginTop: 8 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}><div><div style={{ fontSize: 12, color: C.muted }}>Your Trainer <span style={{ color: C.lime, fontWeight: 700 }}>Connected</span></div><div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>Secure messages and sessions stay in RepUps.</div></div><button onClick={() => navigate("/client/workout-plan")} style={{ ...outlineButton, whiteSpace: "nowrap" }}>View Assigned Plan</button></div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 15, paddingTop: 14, borderTop: `1px solid ${C.line}` }}><span style={{ fontSize: 12, color: C.muted }}><CalendarDays size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Book your next session</span><button onClick={openBooking} style={outlineButton}>View details</button></div></section>
      <section aria-label="Conversation" style={{ display: "flex", flexDirection: "column", gap: 10, padding: "22px 3px 12px" }}>{messages.length === 0 && <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "26px 12px" }}>No messages yet. Start the conversation with your trainer.</p>}{messages.map((message, index) => { const mine = message.from === "client" || message.from === "me" || String(message.senderId) === String(clientId); const system = message.from === "system"; return <div key={message._id || index} style={{ alignSelf: system ? "center" : mine ? "flex-end" : "flex-start", maxWidth: system ? "95%" : "82%", padding: "11px 13px", borderRadius: system ? 10 : mine ? "15px 15px 4px 15px" : "15px 15px 15px 4px", background: system ? "rgba(200,255,61,.08)" : mine ? C.blue : C.panel2, border: `1px solid ${system ? "rgba(200,255,61,.26)" : mine ? "#287fff" : C.line}`, fontSize: 13, lineHeight: 1.45 }}><div>{message.text}</div><small style={{ display: "block", color: mine ? "rgba(255,255,255,.75)" : C.muted, fontSize: 10, textAlign: mine ? "right" : "left", marginTop: 5 }}>{message.time || (message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "")}</small></div>; })}<div ref={bottomRef} /></section>
    </main>
    {showSlotPicker && <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.76)", display: "flex", alignItems: "end", justifyContent: "center" }} onClick={() => setShowSlotPicker(false)}><section onClick={(event) => event.stopPropagation()} style={{ width: "min(100%,430px)", maxHeight: "75dvh", overflowY: "auto", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "22px 22px 0 0", padding: 20 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}><h2 style={{ fontSize: 17 }}>Book a session</h2><button onClick={() => setShowSlotPicker(false)} style={iconButton}><X size={18} /></button></div>{loadingSlots ? <p style={{ color: C.muted }}>Loading availability…</p> : slotsError ? <p style={{ color: C.bad }}>{slotsError}</p> : trainerSlots.length === 0 ? <p style={{ color: C.muted }}>No available slots found.</p> : <div style={{ display: "grid", gap: 9 }}>{trainerSlots.map((slot) => <button key={slot._id} onClick={() => handleConfirmBooking(slot._id)} style={{ ...card, color: C.text, background: C.panel2, textAlign: "left", padding: 14, cursor: "pointer" }}>{new Date(slot.slotTime).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}<ChevronRight size={17} style={{ float: "right", color: C.lime }} /></button>)}</div>}<p style={{ marginTop: 15, color: C.muted, fontSize: 11 }}>Your booking details remain private and available only inside RepUps.</p></section></div>}
    <div style={{ position: "fixed", zIndex: 100, bottom: 67, left: "50%", transform: "translateX(-50%)", width: "min(100%,430px)", padding: "8px 14px", background: "linear-gradient(0deg,#030405 80%,rgba(3,4,5,0))" }}><div style={{ display: "flex", gap: 8, alignItems: "center", padding: 8, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 18 }}><button onClick={openBooking} aria-label="Book session" style={iconButton}><Plus size={21} /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleSend()} placeholder="Type a message…" style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, color: C.text, fontSize: 14 }} /><button onClick={handleSend} aria-label="Send message" style={{ ...iconButton, background: C.blue, color: "white", borderColor: C.blue }}><Send size={18} /></button></div></div>
    <nav style={{ position: "fixed", zIndex: 100, bottom: 0, left: "50%", transform: "translateX(-50%)", display: "flex", width: "min(100%,430px)", height: 68, background: "rgba(3,4,5,.98)", borderTop: `1px solid ${C.line}` }}>{nav.map(([label, path, glyph]) => <button key={label} onClick={() => navigate(path)} style={{ flex: 1, border: 0, background: "transparent", color: label === "Coach" ? C.lime : C.muted, fontSize: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}><b style={{ fontSize: 19 }}>{glyph}</b>{label}</button>)}</nav>
    {inCall && <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000", display: "grid", placeItems: "center" }}><div style={{ textAlign: "center" }}><b>Secure in-app video call active</b><br /><button onClick={() => setInCall(false)} style={{ ...outlineButton, marginTop: 16, color: C.bad, borderColor: C.bad }}>End call</button></div></div>}
  </div>;
}
