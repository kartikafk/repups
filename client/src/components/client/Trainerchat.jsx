import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#0a0a0a", surface: "#111111", card: "#161616", border: "#222222",
  lime: "#C8F135", red: "#FF4444", blue: "#3B82F6", purple: "#B892FF", orange: "#FF9F43",
  muted: "#555555", text: "#EEEEEE", sub: "#888888",
};

const SEED_CONVERSATIONS = [
  {
    id: "c1", trainerId: "t1", name: "Arjun Mehta", initials: "AM", online: true,
    goals: ["Muscle Gain", "Strength"],
    messages: [
      { id: 1, from: "trainer", text: "Hey! Saw you're focused on strength — what's your current squat max?", time: "9:02 AM" },
      { id: 2, from: "me", text: "Around 80kg, trying to break 100 by year end", time: "9:05 AM" },
      { id: 3, from: "trainer", text: "Very doable with the right progression. Want to hop on a quick call this week?", time: "9:06 AM" },
    ],
    booking: null,
  },
  {
    id: "c2", trainerId: "t2", name: "Sana Iyer", initials: "SI", online: false,
    goals: ["Posture Correction", "Mobility"],
    messages: [
      { id: 1, from: "me", text: "Hi Sana, I sit at a desk 9 hours a day and my lower back's been rough", time: "Yesterday" },
      { id: 2, from: "trainer", text: "Super common — let's assess your hip flexors first. I'll send a booking link.", time: "Yesterday" },
    ],
    booking: { slot: "Tomorrow 8:00 AM", status: "scheduled" },
  },
];

const TRAINER_SLOTS = {
  t1: ["Today 5:00 PM", "Today 6:30 PM", "Tomorrow 7:00 AM", "Tomorrow 6:00 PM"],
  t2: ["Tomorrow 8:00 AM", "Tomorrow 9:30 AM", "Wed 7:00 AM"],
};

function SlotPicker({ trainerId, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const slots = TRAINER_SLOTS[trainerId] || ["Tomorrow 6:00 PM"];
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, margin: "10px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10 }}>Pick a slot for your video call</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {slots.map(s => (
          <button key={s} onClick={() => setSelected(s)} style={{
            padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
            background: selected === s ? C.lime + "1f" : C.card,
            border: `1px solid ${selected === s ? C.lime : C.border}`,
            color: selected === s ? C.lime : C.text,
          }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: C.sub, marginBottom: 12 }}>🔒 No contact number is exchanged — the call link only works inside RepUps.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
        <button disabled={!selected} onClick={() => selected && onConfirm(selected)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: selected ? C.lime : C.muted, color: "#000", fontSize: 12, fontWeight: 800, cursor: selected ? "pointer" : "not-allowed" }}>
          Confirm booking
        </button>
      </div>
    </div>
  );
}

function BookingCard({ booking, onJoin }) {
  const isLive = booking.status === "live";
  return (
    <div style={{ alignSelf: "center", background: C.card, border: `1px solid ${C.lime}44`, borderRadius: 12, padding: "12px 16px", margin: "8px 0", maxWidth: 320, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Video call {isLive ? "live" : "scheduled"}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.lime, marginBottom: 10 }}>{booking.slot}</div>
      <button onClick={onJoin} style={{
        width: "100%", padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
        background: isLive ? C.red : C.lime, color: isLive ? "#fff" : "#000", fontWeight: 800, fontSize: 12,
      }}>
        {isLive ? "● Join now" : "Preview call room"}
      </button>
    </div>
  );
}

function VideoCallOverlay({ conversation, onLeave }) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 200, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, display: "inline-block" }} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{mm}:{ss}</span>
        </div>
        <div style={{ fontSize: 11, color: C.sub, display: "flex", alignItems: "center", gap: 6 }}>
          🔒 In-app call · no phone numbers shared
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{
          width: 140, height: 140, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.lime}, ${C.blue})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 42, fontWeight: 900, color: "#000",
          boxShadow: `0 0 0 8px ${C.lime}12`,
        }}>
          {conversation.initials}
        </div>
        <div style={{ position: "absolute", bottom: 24, color: "#fff", fontSize: 14, fontWeight: 700 }}>
          {conversation.name.split(" ")[0]} {cameraOff ? "· camera off on their end" : ""}
        </div>

        <div style={{
          position: "absolute", top: 20, right: 20, width: 90, height: 120, borderRadius: 12,
          background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: C.sub, flexDirection: "column", gap: 6,
        }}>
          {cameraOff ? "📷 Off" : "You"}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 16, padding: "22px 0 34px" }}>
        <button onClick={() => setMuted(m => !m)} style={{
          width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
          background: muted ? C.red : C.surface, color: "#fff", fontSize: 18,
        }}>
          {muted ? "🔇" : "🎙️"}
        </button>
        <button onClick={() => setCameraOff(c => !c)} style={{
          width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
          background: cameraOff ? C.red : C.surface, color: "#fff", fontSize: 18,
        }}>
          {cameraOff ? "📷" : "🎥"}
        </button>
        <button onClick={onLeave} style={{
          width: 52, height: 52, borderRadius: "50%", border: "none", cursor: "pointer",
          background: C.red, color: "#fff", fontSize: 20,
        }}>
          ☎
        </button>
      </div>
    </div>
  );
}

function ChatThread({ conversation, onSend, onRequestSlotPicker, onJoinCall }) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation.messages.length]);

  const send = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.lime}, ${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 12 }}>
            {conversation.initials}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{conversation.name}</div>
            <div style={{ fontSize: 10, color: conversation.online ? C.lime : C.sub }}>{conversation.online ? "● Online" : "Offline"}</div>
          </div>
        </div>
        <button onClick={onRequestSlotPicker} style={{ background: "transparent", border: `1px solid ${C.lime}`, color: C.lime, borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          🎥 Schedule call
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column" }}>
        {conversation.messages.map(m => (
          m.type === "booking" ? (
            <BookingCard key={m.id} booking={m.booking} onJoin={() => onJoinCall()} />
          ) : (
            <div key={m.id} style={{
              alignSelf: m.from === "me" ? "flex-end" : "flex-start",
              background: m.from === "me" ? C.lime + "1f" : C.card,
              border: `1px solid ${m.from === "me" ? C.lime + "44" : C.border}`,
              color: C.text, borderRadius: 14, padding: "9px 13px", maxWidth: "75%", marginBottom: 8, fontSize: 13, lineHeight: 1.5,
            }}>
              {m.text}
              <div style={{ fontSize: 9, color: C.sub, marginTop: 4, textAlign: m.from === "me" ? "right" : "left" }}>{m.time}</div>
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: 14, borderTop: `1px solid ${C.border}` }}>
        <input
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Message — no personal contact info is shared here"
          style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none" }}
        />
        <button onClick={send} style={{ background: C.lime, border: "none", color: "#000", borderRadius: 10, padding: "0 18px", fontWeight: 800, cursor: "pointer" }}>Send</button>
      </div>
    </div>
  );
}

export default function TrainerChat({ initialTrainerId }) {
  const [conversations, setConversations] = useState(SEED_CONVERSATIONS);
  const [activeId, setActiveId] = useState(initialTrainerId
    ? (SEED_CONVERSATIONS.find(c => c.trainerId === initialTrainerId)?.id || SEED_CONVERSATIONS[0].id)
    : SEED_CONVERSATIONS[0].id);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [inCall, setInCall] = useState(false);

  const active = conversations.find(c => c.id === activeId);

  const updateActive = (fn) => {
    setConversations(prev => prev.map(c => c.id === activeId ? fn(c) : c));
  };

  const handleSend = (text) => {
    updateActive(c => ({
      ...c,
      messages: [...c.messages, { id: c.messages.length + 1, from: "me", text, time: "Now" }],
    }));
  };

  const handleConfirmBooking = (slot) => {
    updateActive(c => ({
      ...c,
      booking: { slot, status: "scheduled" },
      messages: [...c.messages, { id: c.messages.length + 1, type: "booking", booking: { slot, status: "scheduled" } }],
    }));
    setShowSlotPicker(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Barlow','Barlow Condensed',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", height: "100vh" }}>
        <div style={{ width: 280, borderRight: `1px solid ${C.border}`, flexShrink: 0, overflowY: "auto" }}>
          <div style={{ padding: "20px 16px 10px", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20 }}>
            Messages
          </div>
          {conversations.map(c => {
            const last = c.messages[c.messages.length - 1];
            const preview = last?.type === "booking" ? `📅 Call ${last.booking.status}` : last?.text;
            return (
              <div key={c.id} onClick={() => setActiveId(c.id)} style={{
                display: "flex", gap: 10, padding: "12px 16px", cursor: "pointer",
                background: activeId === c.id ? C.card : "transparent",
                borderLeft: `3px solid ${activeId === c.id ? C.lime : "transparent"}`,
              }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${C.lime}, ${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 13 }}>
                    {c.initials}
                  </div>
                  {c.online && <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: C.lime, border: `2px solid ${C.bg}` }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{preview}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {active && (
            <ChatThread
              conversation={active}
              onSend={handleSend}
              onRequestSlotPicker={() => setShowSlotPicker(true)}
              onJoinCall={() => setInCall(true)}
            />
          )}
          {showSlotPicker && (
            <SlotPicker trainerId={active.trainerId} onCancel={() => setShowSlotPicker(false)} onConfirm={handleConfirmBooking} />
          )}
        </div>
      </div>

      {inCall && active && <VideoCallOverlay conversation={active} onLeave={() => setInCall(false)} />}
    </div>
  );
}