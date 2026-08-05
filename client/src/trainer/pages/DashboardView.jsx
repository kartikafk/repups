import { C, useBreakpoint } from "../theme"; // Correct if theme.js is in src/trainer/theme.js
import { APPOINTMENTS, MESSAGES, CLIENTS, ASSESSMENTS } from "../mockData"; // Correct if mockData.js is in src/trainer/mockData.js
import { Card, SectionLabel, Ring, Avatar, ProgBar, TrainerStreakBadges } from "../components"; // Correct if components.jsx is in src/trainer/components.jsx

// ─── VIEW: DASHBOARD ─────────────────────────────────────────────────────────
export default function DashboardView({ onNav, trainer }) {
  const { isMobile, isTablet } = useBreakpoint();

  // Extract live metrics from database trainer record with safe fallbacks
  const coachName = trainer?.name ? trainer.name.split(" ")[0] : "Coach";
  const trainerRating = trainer?.rating ? `${trainer.rating} ★` : "4.9 ★";
  const monthlyEarnings = trainer?.pricing?.personalTraining ? `₹${trainer.pricing.personalTraining * 12}` : "₹84,000";

  const statCards = [
    { label: "Active Clients",    value: CLIENTS.length,    icon: "👥", color: C.lime,   sub: "+2 this month" },
    { label: "This Month",        value: monthlyEarnings,   icon: "₹",  color: C.gold,   sub: "+12% vs last month" },
    { label: "Sessions Today",    value: 2,                 icon: "📅", color: C.blue,   sub: "Next at 5:00 PM" },
    { label: "Avg Rating",        value: trainerRating,     icon: "⭐", color: C.gold,   sub: `${trainer?.reviewsCount || 127} reviews` },
  ];

  const upcoming = APPOINTMENTS.filter(a => a.date === "Today" || a.date === "Tomorrow").slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Welcome */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 0, justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start" }}>
        <div>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 4 }}>Good evening,</p>
          <h1 style={{ fontSize: isMobile ? 21 : 26, fontWeight: 800, fontFamily: "'Barlow Condensed',sans-serif", color: C.text, letterSpacing: "-0.5px" }}>
            Coach {coachName} <span style={{ color: C.lime }}>↗</span>
          </h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
            You have <span style={{ color: C.lime, fontWeight: 600 }}>2 sessions</span> today and <span style={{ color: C.gold, fontWeight: 600 }}>1 pending request</span>
            {trainer?.gym && <span> · <strong style={{ color: C.text }}>{trainer.gym}</strong></span>}
          </p>
        </div>
        <button onClick={() => onNav("appointments")} className="trainer-btn-primary" style={{ alignSelf: isMobile ? "flex-start" : "auto" }}>
          + New Booking
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        {statCards.map((s, i) => (
          <Card key={i} style={{ padding: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -12, right: -12, width: 70, height: 70, borderRadius: "50%", background: s.color, opacity: 0.07, filter: "blur(20px)" }} />
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.color }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Today's Snapshot */}
      <Card style={{ padding: 20 }}>
        <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2, marginBottom: 14, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          <span>Today's Snapshot</span>
          <span style={{ color: C.lime }}>2 sessions booked</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
          <Ring pct={67} color={C.lime} icon="✅" value="2 / 3" label="Sessions Done" />
          <Ring pct={92} color={C.blue} icon="⭐" value={trainer?.rating || "4.9"} label="Avg Rating" />
          <Ring pct={78} color={C.gold} icon="💬" value="< 1 hr" label="Response Time" />
        </div>
      </Card>

      {/* Streak & Badges */}
      <TrainerStreakBadges />

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr", gap: 18 }}>
        {/* Upcoming sessions */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <SectionLabel>Upcoming Sessions</SectionLabel>
            <button onClick={() => onNav("appointments")} style={{ fontSize: 11, color: C.lime, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>View all →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: C.card2, borderRadius: 10, border: `1px solid ${C.border2}` }}>
                <Avatar initials={a.avatar} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.client}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{a.type} · {a.duration}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: C.lime, fontWeight: 600 }}>{a.date}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent messages */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <SectionLabel>Recent Messages</SectionLabel>
            <button onClick={() => onNav("messages")} style={{ fontSize: 11, color: C.lime, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>View all →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MESSAGES.slice(0, 3).map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.card2, borderRadius: 10, border: `1px solid ${m.unread ? `${C.lime}30` : C.border2}`, cursor: "pointer" }} onClick={() => onNav("messages")}>
                <div style={{ position: "relative" }}>
                  <Avatar initials={m.avatar} size={34} />
                  {m.unread > 0 && <div style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: C.red, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.card2}` }}>{m.unread}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{m.preview}</div>
                </div>
                <div style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{m.time}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Client progress snapshot */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <SectionLabel>Client Progress</SectionLabel>
            <button onClick={() => onNav("clients")} style={{ fontSize: 11, color: C.lime, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>All clients →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {CLIENTS.slice(0, 4).map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar initials={c.avatar} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: C.lime, fontFamily: "monospace" }}>{c.progress}%</span>
                  </div>
                  <ProgBar value={c.progress} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent assessments */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <SectionLabel>Latest Assessments</SectionLabel>
            <button onClick={() => onNav("assessments")} style={{ fontSize: 11, color: C.lime, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>View all →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ASSESSMENTS.slice(0, 3).map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.card2, borderRadius: 10, border: `1px solid ${C.border2}` }}>
                <Avatar initials={a.avatar} size={32} color={a.score >= 80 ? C.lime : a.score >= 65 ? C.gold : C.red} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{a.client}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{a.type}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: a.score >= 80 ? C.lime : a.score >= 65 ? C.gold : C.red }}>{a.score}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{a.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}