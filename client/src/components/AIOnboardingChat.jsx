import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles.css";

export default function AIChatbot() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  const userName = localStorage.getItem("userName") || "Athlete";
  const profileId = localStorage.getItem("profileId");

  const [messages, setMessages] = useState([
    { role: "ai", text: `Hello ${userName}! I'm your full-time RepUps AI Biomechanics & Form Coach. I'm actively analyzing your profile metrics, injury history, and latest posture assessment report. What can we optimize for your training today?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [postureData, setPostureData] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!profileId) return;
    fetch(`/api/posture/${profileId}/latest`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.record) {
          setPostureData(data.record);
        }
      })
      .catch(err => console.log("No posture scan found yet"));
  }, [profileId]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput("");

    const updatedMessages = [...messages, { role: "user", text: query }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/ai-coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, query, postureData })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setMessages([...updatedMessages, { role: "ai", text: data.reply }]);
      } else {
        setMessages([...updatedMessages, { role: "ai", text: "I'm having trouble syncing your real-time metrics right now. Make sure your core form is tight and check back in a second!" }]);
      }
    } catch (err) {
      setMessages([...updatedMessages, { role: "ai", text: "Network connection error with the AI server." }]);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { label: "Home", path: "/dashboard", icon: "🏠" },
    { label: "Posture", path: "/posture-assessment", icon: "📐" },
    { label: "Workout", path: "/workout", icon: "🏋️" },
    { label: "AI Coach", path: "/ai-coach", icon: "🤖" },
    { label: "Community", path: "/community", icon: "👥" }
  ];

  return (
    <div className="fullscreen-chatbot-layout">
      
      {/* Top Header */}
      <div className="chatbot-topbar">
        <div className="chatbot-header-brand">
          <div className="chatbot-status-dot" />
          <div>
            <span className="chatbot-title">RepUps AI Coach Engine</span>
            <span className="chatbot-subtitle">Real-time posture & biometric consultation</span>
          </div>
        </div>
        <button className="chatbot-posture-btn" onClick={() => navigate('/posture-assessment')}>
          View Posture Scan 📐
        </button>
      </div>

      {/* Message Conversation Stream */}
      <div className="chatbot-stream">
        {messages.map((m, idx) => (
          <div key={idx} className={`chatbot-msg ${m.role === 'ai' ? 'chatbot-msg-ai' : 'chatbot-msg-user'}`}>
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="chatbot-msg chatbot-msg-ai chatbot-loading-state">
            AI is computing kinematics & evaluating posture metrics...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="chatbot-bottombar">
        <input 
          className="chatbot-textbox"
          type="text" 
          placeholder="Ask about form adjustments, pain points, or mobility protocols..." 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
        />
        <button className="chatbot-send-btn" onClick={handleSendMessage}>Send →</button>
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

    </div>
  );
}