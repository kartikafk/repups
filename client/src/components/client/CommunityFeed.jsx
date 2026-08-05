import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EXERCISES,EXERCISE_LIBRARY } from "../../hooks/exercises";// Import your full exercise library

const C = {
  bg: "#0a0a0a", surface: "#111111", card: "#161616", border: "#222222",
  lime: "#C8F135", red: "#FF4444", blue: "#3B82F6",
  muted: "#555555", text: "#EEEEEE", sub: "#888888",
};

const typeMeta = {
  PR:         { label:"Personal Record", color:C.lime,  icon:"🏆" },
  streak:     { label:"Streak",          color:"#FF9F43", icon:"🔥" },
  milestone:  { label:"Milestone",       color:C.blue,  icon:"🎯" },
  workout:    { label:"Workout",         color:C.sub,   icon:"💪" },
};

const Avatar = ({ initials, size=40, bg=C.lime }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color:"#000",
    fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*0.34, flexShrink:0 }}>{initials}</div>
);

function PostCard({ post, currentUserId, onToggleLike }) {
  const meta = typeMeta[post.type] || typeMeta.workout;
  const isLiked = post.likes?.includes(currentUserId);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18, marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <Avatar initials={post.avatar || "U"} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{post.name}</div>
          <div style={{ fontSize:11, color:C.sub }}>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <span style={{ fontSize:10, fontWeight:700, color:meta.color, background:meta.color+"20",
          padding:"3px 10px", borderRadius:99, textTransform:"uppercase", letterSpacing:1,
          display:"flex", alignItems:"center", gap:4 }}>{meta.icon} {meta.label}</span>
      </div>

      <div style={{ fontSize:13, color:C.text, lineHeight:1.6, marginBottom:12 }}>{post.text}</div>

      {post.imageUrl && (
        <div style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
          <img src={post.imageUrl} alt="Workout Post" style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
        </div>
      )}

      {post.exercise && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
          padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <span style={{ fontSize:12, color:C.sub }}>{post.exercise}</span>
          <span style={{ fontSize:14, fontWeight:900, color:meta.color, fontFamily:"'Barlow Condensed',sans-serif" }}>{post.stat}</span>
        </div>
      )}

      <div style={{ display:"flex", gap:16, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
        <button onClick={()=>onToggleLike(post._id)} style={{ background:"none", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", gap:6, color:isLiked?C.lime:C.sub, fontSize:12, fontWeight:700 }}>
          {isLiked ? "❤️" : "🤍"} {post.likes?.length || 0}
        </button>
        <button style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center",
          gap:6, color:C.sub, fontSize:12, fontWeight:700 }}>💬 {post.comments?.length || 0}</button>
      </div>
    </div>
  );
}

function Composer({ onPost }) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() && !imageFile) return;
    setLoading(true);
    await onPost(text, imageFile);
    setText("");
    setImageFile(null);
    setLoading(false);
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:16 }}>
      <div style={{ display:"flex", gap:10, marginBottom: 10 }}>
        <Avatar initials="PT" size={36} />
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={2}
          placeholder="Share a PR, milestone, or attach your workout photo globally..."
          style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
            padding:12, color:C.text, fontSize:13, resize:"none", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }} />
      </div>

      {imageFile && (
        <div style={{ fontSize: 11, color: C.lime, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          📷 Attached: {imageFile.name} <button onClick={() => setImageFile(null)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer" }}>Remove</button>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems: "center", borderTop:`1px solid ${C.border}`, paddingTop: 10 }}>
        <label style={{ cursor: "pointer", fontSize: 13, color: C.blue, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          📷 Add Photo
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ display: "none" }} />
        </label>

        <button onClick={handleSubmit} disabled={loading}
          style={{ background:(text.trim() || imageFile)?C.lime:C.muted, color:"#000", border:"none", borderRadius:8,
            padding:"8px 18px", fontWeight:800, fontSize:13, cursor:(text.trim() || imageFile)?"pointer":"default" }}>
          {loading ? "Posting..." : "Post Globally 🚀"}
        </button>
      </div>
    </div>
  );
}

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const rankColor = (r) => r===1?"#FFD700":r===2?"#C0C0C0":r===3?"#CD7F32":C.sub;

  useEffect(() => {
    fetch('/api/community/leaderboard')
      .then(res => res.json())
      .then(data => { if(data.success) setLeaderboard(data.leaderboard); })
      .catch(err => console.error("Error fetching leaderboard:", err));
  }, []);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18, marginBottom:16 }}>
      <div style={{ fontSize:11, color:C.sub, textTransform:"uppercase", letterSpacing:2, marginBottom:14 }}>
        Global Leaderboard 🏆
      </div>
      {leaderboard.map(u => (
        <div key={u.rank} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0",
          borderBottom:`1px solid ${C.border}` }}>
          <div style={{ width:22, textAlign:"center", fontWeight:900, color:rankColor(u.rank), fontSize:14 }}>{u.rank}</div>
          <Avatar initials={u.avatar} size={32} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{u.name}</div>
            <div style={{ fontSize:11, color:C.sub }}>{u.streak} day streak</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontWeight:900, fontSize:14, color:C.lime, fontFamily:"'Barlow Condensed',sans-serif" }}>{u.xp?.toLocaleString()} XP</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Challenges() {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    fetch('/api/community/challenges')
      .then(res => res.json())
      .then(data => { if(data.success) setChallenges(data.challenges); })
      .catch(err => console.error("Error fetching challenges:", err));
  }, []);

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18 }}>
      <div style={{ fontSize:11, color:C.sub, textTransform:"uppercase", letterSpacing:2, marginBottom:14 }}>
        Global Challenges ⚡
      </div>
      {challenges.map(ch => (
        <div key={ch._id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ fontSize:28, flexShrink:0 }}>{ch.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.text, marginBottom:2 }}>{ch.title}</div>
              <div style={{ fontSize:12, color:C.sub, marginBottom:8, lineHeight:1.5 }}>{ch.desc}</div>
              <div style={{ display:"flex", gap:12, fontSize:11, color:C.sub }}>
                <span>👥 {ch.participants?.length || 0} joined</span>
                <span>⏳ {ch.daysLeft}d left</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChallengeFriendTab({ currentUserId, currentUserName }) {
  const navigate = useNavigate();
  const [friendName, setFriendName] = useState("");
  const [exerciseKey, setExerciseKey] = useState(EXERCISE_LIBRARY[0]?.key || "backSquat");
  const [target, setTarget] = useState("100kg × 5 reps");
  const [successMsg, setSuccessMsg] = useState(false);
  const [battles, setBattles] = useState([]);

  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/community/friend-challenges/${currentUserId}`)
      .then(res => res.json())
      .then(data => { if (data.success) setBattles(data.challenges); })
      .catch(err => console.error("Error fetching 1v1 battles:", err));
  }, [currentUserId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!friendName.trim()) return;

    // Grab readable exercise name from library
    const selectedExObj = EXERCISE_LIBRARY.find(ex => ex.key === exerciseKey);
    const exerciseName = selectedExObj ? selectedExObj.name : exerciseKey;

    try {
      const res = await fetch('/api/community/friend-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengerId: currentUserId,
          challengerName: currentUserName,
          recipientUsername: friendName,
          exercise: exerciseName,
          exerciseKey: exerciseKey, // Passes structured key for tracker routing
          target
        })
      });
      const data = await res.json();
      if (data.success) {
        setBattles([data.challenge, ...battles]);
        setFriendName("");
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
      }
    } catch (err) {
      console.error("Error sending 1v1 challenge:", err);
    }
  };

  // NEW: Accept and launch camera engine for the challenge
  const handleAcceptChallenge = async (battleId, targetExerciseKey) => {
    try {
      const res = await fetch(`/api/community/friend-challenges/${battleId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setBattles(prev => prev.map(b => b._id === battleId ? { ...b, status: "Accepted" } : b));
        
        // Route to workout tracker camera view passing exercise state
        navigate('/workout', { state: { exercise: targetExerciseKey || 'backSquat' } });
      }
    } catch (err) {
      console.error("Error accepting challenge:", err);
    }
  };

  return (
    <div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18, marginBottom:16 }}>
        <div style={{ fontSize:11, color:C.lime, textTransform:"uppercase", letterSpacing:2, marginBottom:4, fontWeight:800 }}>
          ⚔️ Direct 1v1 Friend Battle Engine
        </div>
        <div style={{ fontSize:13, color:C.sub, marginBottom:16, lineHeight:1.5 }}>
          Challenge any user globally. They can accept your challenge instantly to launch the MediaPipe camera tracker and beat your target!
        </div>

        {successMsg && (
          <div style={{ background:C.lime+"15", border:`1px solid ${C.lime}`, color:C.lime, padding:"10px 14px", borderRadius:8, fontSize:12, fontWeight:700, marginBottom:14, textAlign:"center" }}>
            🚀 1v1 Challenge transmitted globally!
          </div>
        )}

        <form onSubmit={handleSend} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={{ fontSize:11, color:C.sub, display:"block", marginBottom:6, textTransform:"uppercase" }}>Friend Name or Email</label>
            <input type="text" placeholder="e.g. Rohan Das" value={friendName} onChange={e => setFriendName(e.target.value)}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px", color:C.text, fontSize:13, outline:"none", boxSizing:"border-box" }} required />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:C.sub, display:"block", marginBottom:6, textTransform:"uppercase" }}>Exercise (Library)</label>
              <select value={exerciseKey} onChange={e => setExerciseKey(e.target.value)}
                style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px", color:C.text, fontSize:13, outline:"none" }}>
                {EXERCISE_LIBRARY.map(ex => (
                  <option key={ex.key} value={ex.trackingKey || ex.key}>{ex.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.sub, display:"block", marginBottom:6, textTransform:"uppercase" }}>Target</label>
              <input type="text" placeholder="e.g. 90% Form / 8 Reps" value={target} onChange={e => setTarget(e.target.value)}
                style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px", color:C.text, fontSize:13, outline:"none", boxSizing:"border-box" }} required />
            </div>
          </div>

          <button type="submit" style={{ background:C.lime, color:"#000", border:"none", borderRadius:10, padding:"12px", fontWeight:900, fontSize:14, cursor:"pointer", textTransform:"uppercase" }}>
            Send Battle Call ⚔️
          </button>
        </form>
      </div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:18 }}>
        <div style={{ fontSize:11, color:C.sub, textTransform:"uppercase", letterSpacing:2, marginBottom:14 }}>Active Battles Log</div>
        {battles.length === 0 ? (
          <div style={{ fontSize: 13, color: C.sub, textAlign: "center", padding: "12px 0" }}>No active challenges found.</div>
        ) : (
          battles.map(b => {
            const isPending = b.status === "Pending" || !b.status;
            return (
              <div key={b._id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:C.text, marginBottom:2 }}>VS {b.recipientUsername} ({b.exercise})</div>
                  <div style={{ fontSize:12, color:C.sub }}>Target: <span style={{ color:C.lime }}>{b.target}</span></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color: isPending ? C.blue : C.lime, background: (isPending ? C.blue : C.lime)+"15", padding:"4px 10px", borderRadius:99 }}>
                    {b.status || "Pending"}
                  </span>
                  {isPending && (
                    <button 
                      onClick={() => handleAcceptChallenge(b._id, b.exerciseKey)}
                      style={{ background: C.lime, color: "#000", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                    >
                      Accept & Launch ⚡
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function CommunityFeed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("feed");

  let parsedUser = { name: "Athlete", id: null };
  try {
    const raw = localStorage.getItem("user");
    if (raw) parsedUser = JSON.parse(raw);
  } catch(e){}
  const currentUserId = parsedUser.id || localStorage.getItem("profileId");
  const currentUserName = parsedUser.name;

  useEffect(() => {
    fetch('/api/community/feed')
      .then(res => res.json())
      .then(data => { if(data.success) setPosts(data.posts); })
      .catch(err => console.error("Error fetching feed:", err));
  }, []);

  const handlePost = async (text, imageFile) => {
    const formData = new FormData();
    formData.append("authorId", currentUserId || "640000000000000000000000");
    formData.append("name", currentUserName);
    formData.append("text", text);
    formData.append("type", "workout");
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch('/api/community/feed', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setPosts([data.post, ...posts]);
      }
    } catch(err) {
      console.error("Error creating post:", err);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const res = await fetch(`/api/community/feed/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: data.liked ? [...(p.likes||[]), currentUserId] : (p.likes||[]).filter(id => id !== currentUserId) } : p));
      }
    } catch(err) {
      console.error("Error liking post:", err);
    }
  };

  const tabs = [
    { id:"feed", label:"Feed", icon:"📰" },
    { id:"leaderboard", label:"Leaderboard", icon:"🏆" },
    { id:"challenges", label:"Challenges", icon:"⚡" },
    { id:"challenge-friend", label:"Challenge a Friend", icon:"⚔️" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Barlow','Barlow Condensed',sans-serif", paddingBottom:"40px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet"/>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"28px 20px" }}>
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => navigate("/dashboard")} style={{ background:C.surface, border:`1px solid ${C.border}`, color:C.text, padding:"6px 12px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, letterSpacing:1 }}>
            GLOBAL COMMUNITY
          </div>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:6,
                padding:"6px 14px", borderRadius:8, border:`1px solid ${tab===t.id?C.lime:"transparent"}`,
                background:tab===t.id?C.lime+"15":"transparent", color:tab===t.id?C.lime:C.sub,
                fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "feed" && (
          <>
            <Composer onPost={handlePost} />
            {posts.map(p => <PostCard key={p._id} post={p} currentUserId={currentUserId} onToggleLike={toggleLike} />)}
          </>
        )}
        {tab === "leaderboard" && <Leaderboard />}
        {tab === "challenges" && <Challenges />}
        {tab === "challenge-friend" && <ChallengeFriendTab currentUserId={currentUserId} currentUserName={currentUserName} />}
      </div>
    </div>
  );
}