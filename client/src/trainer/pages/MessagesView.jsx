import { useState, useEffect } from "react";
import { C, useBreakpoint } from "../theme";
import { Avatar } from "../components";

// ─── VIEW: MESSAGES ────────────────────────────────________________───────────
export default function MessagesView() {
  const { isMobile } = useBreakpoint();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [input, setInput] = useState("");
  const [mobilePane, setMobilePane] = useState("list"); // "list" | "chat"

  // Get active trainer ID from localStorage
  const getTrainerId = () => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed._id || parsed.id;
      }
    } catch (e) {}
    return localStorage.getItem("trainerId") || "t1";
  };

  const trainerId = getTrainerId();

  // 📥 Fetch Conversations List on mount
  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch(`http://localhost:5001/api/messages/conversations/${trainerId}`);
        const data = await res.json();
        if (data.success && data.conversations.length > 0) {
          setConversations(data.conversations);
          setActiveChat(data.conversations[0].id); // Select first chat by default
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    }
    fetchConversations();
  }, [trainerId]);

  // 📥 Fetch Message Thread whenever activeChat changes
  useEffect(() => {
    if (!activeChat) return;
    async function fetchThread() {
      try {
        const res = await fetch(`http://localhost:5001/api/messages/thread?trainerId=${trainerId}&clientId=${activeChat}`);
        const data = await res.json();
        if (data.success) {
          setChatMessages(prev => ({
            ...prev,
            [activeChat]: data.messages
          }));
        }
      } catch (err) {
        console.error("Failed to load message thread:", err);
      }
    }
    fetchThread();
  }, [activeChat, trainerId]);

  const active = conversations.find(m => m.id === activeChat);

  // 📤 Send Message Handler
  async function send() {
    if (!input.trim() || !activeChat) return;

    const textPayload = input;
    setInput("");

    try {
      const res = await fetch(`http://localhost:5001/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId,
          clientId: activeChat,
          clientName: active?.name || "Client",
          clientAvatar: active?.avatar || "CL",
          sender: "trainer",
          text: textPayload
        })
      });

      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => ({
          ...prev,
          [activeChat]: [...(prev[activeChat] || []), data.message]
        }));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  return (
    <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "280px 1fr", gap: 0, height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Contact list */}
      <div style={{ display: isMobile && mobilePane !== "list" ? "none" : "flex", borderRight: isMobile ? "none" : `1px solid ${C.border}`, flexDirection: "column" }}>
        <div style={{ padding: "0 0 14px", borderBottom: `1px solid ${C.border}`, marginBottom: 10 }}>
          <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 10 }}>Messages</h3>
          <input placeholder="Search clients…" style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "8px 12px", outline: "none" }} />
        </div>
        {conversations.length === 0 ? (
          <div style={{ padding: 20, color: C.sub, fontSize: 13, textAlign: "center" }}>No active chats found.</div>
        ) : (
          conversations.map(m => (
            <div key={m.id} onClick={() => { setActiveChat(m.id); if (isMobile) setMobilePane("chat"); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", background: activeChat === m.id ? C.limeGlow : "transparent", borderRight: `2px solid ${activeChat === m.id ? C.lime : "transparent"}`, transition: "all 0.15s" }}>
              <div style={{ position: "relative" }}>
                <Avatar initials={m.avatar} size={36} color={activeChat === m.id ? C.lime : C.sub} />
                {m.unread > 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.surface}` }}>{m.unread}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: activeChat === m.id ? C.lime : C.text }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{m.preview}</div>
              </div>
              <div style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{m.time}</div>
            </div>
          ))
        )}
      </div>

      {/* Chat area */}
      <div style={{ display: isMobile && mobilePane !== "chat" ? "none" : "flex", flexDirection: "column", height: isMobile ? "calc(100vh - 160px)" : "auto" }}>
        {/* Chat header */}
        <div style={{ padding: "0 20px 14px", borderBottom: `1px solid ${C.border}`, marginBottom: 0, display: "flex", alignItems: "center", gap: 12 }}>
          {isMobile && (
            <button onClick={() => setMobilePane("list")} style={{ background: "none", border: "none", color: C.sub, fontSize: 16, cursor: "pointer", padding: 0 }}>←</button>
          )}
          <Avatar initials={active?.avatar || "?"} size={36} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{active?.name || "Select a client"}</div>
            <div style={{ fontSize: 11, color: C.lime }}>● Online</div>
          </div>
          {!isMobile && active && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button style={{ padding: "7px 14px", background: C.blueGlow, border: `1px solid ${C.blue}30`, borderRadius: 8, color: C.blue, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>📹 Video Call</button>
              <button style={{ padding: "7px 12px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>📋 View Profile</button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="trainer-hide-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {!activeChat ? (
            <div style={{ margin: "auto", color: C.sub, fontSize: 13 }}>Choose a conversation from the sidebar</div>
          ) : (
            (chatMessages[activeChat] || []).map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.from === "trainer" ? "flex-end" : "flex-start", gap: 10 }}>
                {msg.from === "client" && <Avatar initials={active?.avatar || "?"} size={30} color={C.sub} />}
                <div style={{ maxWidth: "68%" }}>
                  <div style={{ padding: "10px 14px", borderRadius: msg.from === "trainer" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.from === "trainer" ? C.limeGlow : C.card2, border: `1px solid ${msg.from === "trainer" ? `${C.lime}30` : C.border2}`, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4, textAlign: msg.from === "trainer" ? "right" : "left" }}>{msg.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        {activeChat && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Type a message…"
              style={{ flex: 1, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "11px 14px", outline: "none" }} />
            <button onClick={send} style={{ width: 44, height: 44, borderRadius: 10, background: input.trim() ? C.lime : C.border, border: "none", color: input.trim() ? "#00121A" : C.sub, cursor: input.trim() ? "pointer" : "not-allowed", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ↑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}