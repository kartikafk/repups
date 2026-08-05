import { useState } from "react";
import { C, useBreakpoint } from "../theme";
import { APPOINTMENTS } from "../mockData";
import { Card, Avatar, StatusBadge } from "../components";

// ─── VIEW: APPOINTMENTS ───────────────────────────────────────────────────────
export default function AppointmentsView() {
  const [tab, setTab] = useState("upcoming");
  const { isMobile } = useBreakpoint();

  const statusOrder = { confirmed:0, pending:1, requested:2, completed:3, cancelled:4 };
  const sorted = [...APPOINTMENTS].sort((a,b) => (statusOrder[a.status]||99) - (statusOrder[b.status]||99));

  return (
    <div>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0, justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color: C.text }}>Appointments</h2>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 3 }}>Manage your bookings and schedule</p>
        </div>
        <button className="trainer-btn-primary" style={{ alignSelf: isMobile ? "flex-start" : "auto" }}>
          + Block Time
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto" }}>
        {["upcoming","pending","all"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${tab===t ? C.lime : C.border}`, background: tab===t ? C.limeGlow : "transparent", color: tab===t ? C.lime : C.sub, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: tab===t ? 600 : 400, flexShrink: 0 }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
            {t==="pending" && <span style={{ marginLeft:6, background:C.gold, color:"#00121A", borderRadius:"50%", width:16,height:16,fontSize:9,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center" }}>1</span>}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map(a => (
          <Card key={a.id} style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", flexWrap: isMobile ? "wrap" : "nowrap", alignItems: "center", gap: 14 }}>
              <Avatar initials={a.avatar} size={44} />
              <div style={{ flex: 1, minWidth: isMobile ? "60%" : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Barlow Condensed',sans-serif" }}>{a.client}</span>
                  <StatusBadge status={a.status} />
                </div>
                <div style={{ fontSize: 12, color: C.sub }}>{a.type} · {a.duration}</div>
              </div>
              <div style={{ textAlign: isMobile ? "left" : "right", marginRight: isMobile ? 0 : 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.lime, fontFamily: "'Barlow Condensed',sans-serif" }}>{a.date}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{a.time}</div>
              </div>
              <div style={{ textAlign: isMobile ? "left" : "right", marginRight: isMobile ? 0 : 16 }}>
                <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: C.gold }}>₹{a.price.toLocaleString()}</div>
              </div>
              <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
                {a.status === "requested" && <>
                  <button style={{ padding: "7px 14px", background: C.lime, border: "none", borderRadius: 8, color: "#00121A", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Accept</button>
                  <button style={{ padding: "7px 12px", background: "transparent", border: `1px solid ${C.red}44`, borderRadius: 8, color: C.red, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>Decline</button>
                </>}
                {a.status === "confirmed" && <button style={{ padding: "7px 14px", background: C.blueGlow, border: `1px solid ${C.blue}44`, borderRadius: 8, color: C.blue, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>Join Call</button>}
                {a.status === "pending" && <button style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.sub, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>Confirm</button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
