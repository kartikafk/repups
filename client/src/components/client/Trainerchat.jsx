import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { API_ORIGIN, apiUrl } from "../../config.js";

const C = {
  bg: "#0a0a0a", surface: "#111111", card: "#161616", border: "#222222",
  lime: "#C8F135", red: "#FF4444", blue: "#3B82F6", purple: "#B892FF", orange: "#FF9F43",
  muted: "#555555", text: "#EEEEEE", sub: "#888888",
};

export default function TrainerChat({ initialTrainerId }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(initialTrainerId || null);
  const [messages, setMessages] = useState([]);
  const [trainerSlots, setTrainerSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [trainerProfile, setTrainerProfile] = useState(null); // 🔑 Live trainer profile state
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [draft, setDraft] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const clientId = currentUser._id || currentUser.id;

  const loadTrainerSlots = async () => {
    if (!initialTrainerId) return;
    setLoadingSlots(true);
    setSlotsError("");
    try {
      const response = await fetch(apiUrl(`trainers/${initialTrainerId}/slots`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Could not load availability.");
      setTrainerSlots(data.slots || []);
    } catch (error) {
      setTrainerSlots([]);
      setSlotsError(error.message || "Could not load availability.");
    } finally {
      setLoadingSlots(false);
    }
  };

  // 1. Fetch exact Trainer Profile by ID
  useEffect(() => {
    if (!initialTrainerId) return;
    const fetchTrainerProfile = async () => {
      try {
        const res = await fetch(apiUrl(`trainers/${initialTrainerId}`));
        const data = await res.json();
        if (data.success) {
          setTrainerProfile(data.trainer);
        } else {
          console.warn("⚠️ Trainer profile fetch failed:", data.error);
        }
      } catch (err) {
        console.error("❌ Failed to fetch trainer profile:", err);
      }
    };
    fetchTrainerProfile();
  }, [initialTrainerId]);

  const displayName = trainerProfile?.name || "Trainer Chat";
  const displayInitials = trainerProfile?.name
    ? trainerProfile.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "TC";

  // 2. Initialize Socket.io connection & listen for incoming messages
  useEffect(() => {
    const socketOptions = { auth: { token } };
    socketRef.current = API_ORIGIN ? io(API_ORIGIN, socketOptions) : io(socketOptions);

    socketRef.current.on("message:new", (msg) => {
      // A client only ever has one open trainer thread here, so no
      // per-pair routing is needed — but guard against stray events
      // from a different trainer just in case.
      if (initialTrainerId && msg.trainerId && String(msg.trainerId) !== String(initialTrainerId)) {
        return;
      }
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, initialTrainerId]);

  // 3. Fetch conversations sidebar list on mount
  useEffect(() => {
    const fetchConversations = async () => {
      if (!initialTrainerId) return;
      try {
        const res = await fetch(apiUrl(`messages/conversations/${initialTrainerId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setConversations(data.conversations);
          if (!activeId && data.conversations.length > 0) {
            setActiveId(data.conversations[0].id);
          }
        }
      } catch (err) {
        console.error("❌ Failed to fetch conversations:", err);
      }
    };
    fetchConversations();
  }, [initialTrainerId, activeId, token]);

  // 4. Fetch active thread messages & trainer slots when activeId or initialTrainerId changes
  useEffect(() => {
    const activeTrainer = initialTrainerId;
    if (!activeTrainer || !clientId) return;

    const fetchThreadAndSlots = async () => {
      try {
        // Fetch thread
        const threadRes = await fetch(apiUrl(`messages/thread?trainerId=${activeTrainer}&clientId=${clientId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const threadData = await threadRes.json();
        if (threadData.success) {
          setMessages(threadData.messages);
        }

        // Fetch real booking slots.
        await loadTrainerSlots();

        // 🔑 FIX: join_thread (not join:pair) — must match the event name
        // the server actually listens for in sockets/index.js.
        socketRef.current?.emit("join_thread", { trainerId: activeTrainer, clientId }, (res) => {
          if (!res?.ok) {
            console.warn("⚠️ Failed to join chat room:", res?.error);
          }
        });
      } catch (err) {
        console.error("❌ Error loading thread data:", err);
      }
    };

    fetchThreadAndSlots();
  }, [initialTrainerId, clientId, token]);

  // Scroll to bottom when messages update
  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages.length]);

  // 5. Send Message Handler
  const handleSend = async () => {
    if (!draft.trim() || !initialTrainerId || !clientId) return;

    const textToSend = draft.trim();
    setDraft("");

    try {
      const res = await fetch(apiUrl("messages/send"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trainerId: initialTrainerId,
          clientId,
          text: textToSend,
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      console.error("❌ Send message error:", err);
    }
  };

  // 6. Confirm Booking Handler using real slot ID
  const handleConfirmBooking = async (slotId) => {
    try {
      const res = await fetch(apiUrl("bookings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trainerId: initialTrainerId,
          clientId,
          slotId,
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSlotPicker(false);
        setMessages(prev => [...prev, { from: "system", text: `📅 Video call booked successfully!`, time: "Just now" }]);
      }
    } catch (err) {
      console.error("❌ Booking error:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Barlow','Barlow Condensed',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", height: "100vh" }}>
        
        {/* Sidebar Conversations */}
        <div style={{ width: 280, borderRight: `1px solid ${C.border}`, flexShrink: 0, overflowY: "auto" }}>
          <div style={{ padding: "20px 16px 10px", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20 }}>
            Messages
          </div>
          {conversations.length === 0 ? (
            <div style={{ padding: 16, fontSize: 12, color: C.sub }}>No active conversations.</div>
          ) : (
            conversations.map(c => (
              <div key={c.id} onClick={() => setActiveId(c.id)} style={{
                display: "flex", gap: 10, padding: "12px 16px", cursor: "pointer",
                background: activeId === c.id ? C.card : "transparent",
                borderLeft: `3px solid ${activeId === c.id ? C.lime : "transparent"}`,
              }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${C.lime}, ${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 13 }}>
                    {displayInitials}
                  </div>
                  {c.online && <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: C.lime, border: `2px solid ${C.bg}` }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.preview}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.lime}, ${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 900, fontSize: 12 }}>
                {displayInitials}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{displayName}</div>
                <div style={{ fontSize: 10, color: C.lime }}>● Online</div>
              </div>
            </div>
            <button onClick={() => { setShowSlotPicker(true); loadTrainerSlots(); }} style={{ background: "transparent", border: `1px solid ${C.lime}`, color: C.lime, borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              🎥 Schedule call
            </button>
          </div>

          {/* Message Thread */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column" }}>
            {messages.map((m, idx) => {
              const isMe = m.from === "client" || m.from === "me";
              return (
                <div key={idx} style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  background: isMe ? C.lime + "1f" : C.card,
                  border: `1px solid ${isMe ? C.lime + "44" : C.border}`,
                  color: C.text, borderRadius: 14, padding: "9px 13px", maxWidth: "75%", marginBottom: 8, fontSize: 13, lineHeight: 1.5,
                }}>
                  {m.text}
                  <div style={{ fontSize: 9, color: C.sub, marginTop: 4, textAlign: isMe ? "right" : "left" }}>{m.time}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Slot Picker Overlay Modal */}
          {showSlotPicker && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, margin: "10px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10 }}>Pick a slot for your video call</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {loadingSlots ? (
                  <div style={{ fontSize: 12, color: C.sub }}>Loading availability…</div>
                ) : slotsError ? (
                  <div style={{ fontSize: 12, color: C.red }}>{slotsError}</div>
                ) : trainerSlots.length === 0 ? (
                  <div style={{ fontSize: 12, color: C.sub }}>No available slots found.</div>
                ) : (
                  trainerSlots.map(slot => (
                    <button key={slot._id} onClick={() => handleConfirmBooking(slot._id)} style={{
                      padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      background: C.card, border: `1px solid ${C.border}`, color: C.text,
                    }}>
                      {new Date(slot.slotTime).toLocaleString(undefined, {
                        weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                      })}
                    </button>
                  ))
                )}
              </div>
              <div style={{ fontSize: 10, color: C.sub, marginBottom: 12 }}>🔒 No contact number is exchanged — the call link only works inside RepUps.</div>
              <button onClick={() => setShowSlotPicker(false)} style={{ width: "100%", padding: "8px 0", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            </div>
          )}

          {/* Message Input Box */}
          <div style={{ display: "flex", gap: 8, padding: 14, borderTop: `1px solid ${C.border}` }}>
            <input
              value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Message — no personal contact info is shared here"
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none" }}
            />
            <button onClick={handleSend} style={{ background: C.lime, border: "none", color: "#000", borderRadius: 10, padding: "0 18px", fontWeight: 800, cursor: "pointer" }}>Send</button>
          </div>
        </div>
      </div>

      {/* Video Call Overlay */}
      {inCall && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Secure In-App Video Call Active</div>
          <button onClick={() => setInCall(false)} style={{ padding: "10px 24px", background: C.red, color: "#fff", borderRadius: 8, border: "none", fontWeight: 800, cursor: "pointer" }}>End Call</button>
        </div>
      )}
    </div>
  );
}

