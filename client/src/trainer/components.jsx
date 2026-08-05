import { C } from "./theme";
import { TRAINER, NAV_ITEMS, NOTIFICATIONS, TRAINER_PROGRESS, TRAINER_BADGE_DEFS } from "./mockData";

// ─── Shared micro-components ──────────────────────────────────────────────────
export function Avatar({ initials, size = 38, color = C.lime }) {
  return (
    <div className="trainer-avatar" style={{ "--accent": color, width: size, height: size, fontSize: size * 0.3 }}>
      {initials}
    </div>
  );
}

export function Badge({ children, color = C.lime }) {
  return (
    <span className="trainer-badge" style={{ "--accent": color }}>
      {children}
    </span>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div className="trainer-card" style={style}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div className="trainer-section-label">
      {children}
    </div>
  );
}

export function Ring({ pct, color, size = 70, stroke = 7, icon, value, label }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 8px" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "'Barlow Condensed',sans-serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: C.sub }}>{label}</div>
    </div>
  );
}

export function ProgBar({ value, color = C.lime, height = 4 }) {
  return (
    <div className="trainer-progbar" style={{ "--accent": color, height }}>
      <div className="trainer-progbar-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Stars({ rating, size = 12 }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? C.gold : C.border, fontSize: size }}>★</span>
      ))}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    confirmed: [C.lime,  "Confirmed"],
    pending:   [C.gold,  "Pending"],
    requested: [C.blue,  "Requested"],
    cancelled: [C.red,   "Cancelled"],
    completed: [C.teal,  "Completed"],
    active:    [C.lime,  "Active"],
    draft:     [C.sub,   "Draft"],
    inactive:  [C.red,   "Inactive"],
  };
  const [color, label] = map[status] || [C.sub, status];
  return <Badge color={color}>{label}</Badge>;
}

// ─── Streak & Badges (ported from the ClientDashboard homepage) ──────────────
export function TrainerStreakBadges() {
  const progressFor = (b) => {
    if (b.type === "streak")   return TRAINER_PROGRESS.loginStreak;
    if (b.type === "sessions") return TRAINER_PROGRESS.sessionsDelivered;
    if (b.type === "clients")  return TRAINER_PROGRESS.clientsCoached;
    return 0;
  };
  const nextBadge = TRAINER_BADGE_DEFS
    .filter(b => progressFor(b) < b.threshold)
    .sort((a, b) => (a.threshold - progressFor(a)) - (b.threshold - progressFor(b)))[0];

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Badges & Streak</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: C.gold, fontFamily: "'Barlow Condensed',sans-serif" }}>🔥 {TRAINER_PROGRESS.loginStreak}</span>
            <span style={{ fontSize: 12, color: C.sub }}>day streak</span>
          </div>
        </div>
        {nextBadge && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.sub }}>Next badge</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.lime }}>{nextBadge.icon} {nextBadge.label}</div>
            <div style={{ fontSize: 11, color: C.sub }}>{Math.max(nextBadge.threshold - progressFor(nextBadge), 0)} more to go</div>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
        {TRAINER_BADGE_DEFS.map(b => {
          const unlocked = progressFor(b) >= b.threshold;
          return (
            <div key={b.id} style={{ background: unlocked ? `${C.lime}12` : C.card2, border: `1px solid ${unlocked ? `${C.lime}55` : C.border}`, borderRadius: 12, padding: "14px 8px", textAlign: "center", opacity: unlocked ? 1 : 0.55 }}>
              <div style={{ fontSize: 24, marginBottom: 6, filter: unlocked ? "none" : "grayscale(1)" }}>{b.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: unlocked ? C.lime : C.sub, lineHeight: 1.3 }}>{b.label}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function Sidebar({ active, onChange, open, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div className={`trainer-sidebar-backdrop${open ? " open" : ""}`} onClick={onClose} />

      {/* Drawer */}
      <div className={`trainer-sidebar${open ? " open" : ""}`}>
        {/* Logo */}
        <div className="trainer-sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div className="trainer-topbar-logo" style={{ "--accent": C.lime }}>💪</div>
            <div>
              <div className="trainer-topbar-title">Rep<span style={{ color: C.lime }}>Ups</span></div>
              <div style={{ fontSize: 10, color: C.sub }}>Trainer Portal</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="trainer-sidebar-close">✕</button>
        </div>

        {/* Trainer mini card */}
        <div className="trainer-sidebar-profile">
          <Avatar initials={TRAINER.avatar} size={36} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{TRAINER.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.lime }} />
              <span style={{ fontSize: 10, color: C.sub }}>Online</span>
              <Badge color={C.lime}>✓ Verified</Badge>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="trainer-sidebar-nav">
          {NAV_ITEMS.map(item => {
            const isActive = active === item.id;
            return (
              <button key={item.id} onClick={() => { onChange(item.id); onClose(); }}
                className={`trainer-nav-item${isActive ? " active" : ""}`}>
                <span className="trainer-nav-icon">{item.icon}</span>
                {item.label}
                {item.id === "messages" && (
                  <span className="trainer-nav-badge" style={{ background: C.red, color: "#fff" }}>3</span>
                )}
                {item.id === "appointments" && (
                  <span className="trainer-nav-badge" style={{ background: C.gold, color: "#00121A" }}>2</span>
                )}
                {item.id === "notifications" && NOTIFICATIONS.filter(n=>n.unread).length > 0 && (
                  <span className="trainer-nav-badge" style={{ background: C.lime, color: "#00121A" }}>{NOTIFICATIONS.filter(n=>n.unread).length}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="trainer-sidebar-footer">
          <button onClick={() => { onChange("settings"); onClose(); }} className="trainer-nav-item">
            ⚙️ Settings
          </button>
        </div>
      </div>
    </>
  );
}
