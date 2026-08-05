import { useState } from "react";
import { C, useBreakpoint } from "../theme";
import { CLIENTS } from "../mockData";
import { Card, Avatar, Badge, StatusBadge, ProgBar } from "../components";

// ─── VIEW: CLIENTS ────────────────────────────────────────────────────────────
export default function ClientsView({ onOpenClient }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const { isMobile, isTablet } = useBreakpoint();

  const filtered = filter === "all" ? CLIENTS : CLIENTS.filter(c => c.status === filter);
  const client = selected ? CLIENTS.find(c => c.id === selected) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: client && !isMobile && !isTablet ? "1fr 340px" : "1fr", gap: 18 }}>
      <div>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0, justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color: C.text }}>My Clients</h2>
            <p style={{ fontSize: 13, color: C.sub, marginTop: 3 }}>{CLIENTS.length} total · {CLIENTS.filter(c=>c.status==="active").length} active</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["all","active","inactive"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${filter===f ? C.lime : C.border}`, background: filter===f ? C.limeGlow : "transparent", color: filter===f ? C.lime : C.sub, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: filter===f ? 600 : 400 }}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(c => (
            <Card key={c.id} style={{ padding: "14px 18px", cursor: "pointer", border: `1px solid ${selected===c.id ? `${C.lime}44` : C.border}`, transition: "all 0.18s" }} onClick={() => setSelected(selected===c.id ? null : c.id)}>
              <div style={{ display: "flex", flexWrap: isMobile ? "wrap" : "nowrap", alignItems: "center", gap: 14 }}>
                <Avatar initials={c.avatar} size={44} />
                <div style={{ flex: 1, minWidth: isMobile ? "60%" : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Barlow Condensed',sans-serif" }}>{c.name}</span>
                    <StatusBadge status={c.status} />
                    {c.issues.length > 0 && <Badge color={C.gold}>⚠ {c.issues.length} flag{c.issues.length>1?"s":""}</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub }}>{c.goal} · {c.level}</div>
                </div>
                <div style={{ display: "flex", gap: isMobile ? 12 : 16, alignItems: "center", flexWrap: isMobile ? "wrap" : "nowrap", width: isMobile ? "100%" : "auto", marginTop: isMobile ? 10 : 0, justifyContent: isMobile ? "space-between" : "flex-start" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, fontWeight: 700, color: C.lime }}>{c.progress}%</div>
                    <div style={{ fontSize: 10, color: C.sub }}>Progress</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: C.gold }}>🔥{c.streak}</div>
                    <div style={{ fontSize: 10, color: C.sub }}>Streak</div>
                  </div>
                  <div style={{ textAlign: isMobile ? "left" : "right", minWidth: isMobile ? "auto" : 100 }}>
                    <div style={{ fontSize: 12, color: C.lime, fontWeight: 500 }}>{c.nextSession}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Active {c.lastActive}</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <ProgBar value={c.progress} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Client detail panel */}
      {client && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <Avatar initials={client.avatar} size={52} />
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>{client.name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              <Badge color={C.lime}>{client.goal}</Badge>
              <Badge color={C.blue}>{client.level}</Badge>
              <StatusBadge status={client.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[["Streak","🔥 "+client.streak+" days",C.gold],["Last Active",client.lastActive,C.sub],["Next Session",client.nextSession,C.lime],["Progress",client.progress+"%",C.lime]].map(([l,v,col])=>(
                <div key={l} style={{ background: C.card2, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.sub, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: col }}>{v}</div>
                </div>
              ))}
            </div>
            {client.issues.length > 0 && (
              <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 6 }}>⚠ Movement Flags</div>
                {client.issues.map((issue, i) => <div key={i} style={{ fontSize: 12, color: C.sub, marginBottom: 2 }}>• {issue}</div>)}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="trainer-btn-primary" style={{ flex: 1, padding: "9px", fontSize: 12 }}>Message</button>
              <button className="trainer-btn-ghost" style={{ flex: 1, padding: "9px", fontSize: 12 }}>View Plan</button>
            </div>
            <button onClick={() => onOpenClient && onOpenClient(client.id)} className="trainer-btn-soft" style={{ width: "100%", marginTop: 8, padding: "9px", fontSize: 12 }}>View Full Profile →</button>
          </Card>

          {/* Trainer Notes */}
          <Card style={{ padding: 18 }}>
            <div className="trainer-section-label">Private Trainer Notes</div>
            <textarea placeholder="Add private notes about this client…" style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontFamily: "inherit", fontSize: 12, padding: "10px 12px", resize: "vertical", minHeight: 80, outline: "none" }} />
            <button className="trainer-btn-soft" style={{ marginTop: 8, padding: "8px 16px", fontSize: 12 }}>Save Note</button>
          </Card>
        </div>
      )}
    </div>
  );
}
