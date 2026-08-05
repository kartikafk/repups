import { C, useBreakpoint } from "../theme";
import { PLANS, CLIENTS } from "../mockData";
import { Card, StatusBadge } from "../components";

// ─── VIEW: WORKOUT PLANS ──────────────────────────────────────────────────────
export default function PlansView({ onNav }) {
  const { isMobile } = useBreakpoint();
  return (
    <div>
      <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0, justifyContent:"space-between", alignItems: isMobile ? "stretch" : "center", marginBottom:22 }}>
        <div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text }}>Workout Plans</h2>
          <p style={{ fontSize:13, color:C.sub, marginTop:3 }}>Build and assign personalized programs</p>
        </div>
        <button onClick={()=>onNav && onNav("planBuilder")} className="trainer-btn-primary" style={{ alignSelf: isMobile ? "flex-start" : "auto" }}>
          + New Plan
        </button>
      </div>

      {/* Plans list */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {PLANS.map(p => (
          <Card key={p.id} style={{ padding:"16px 20px" }}>
            <div style={{ display:"flex", flexWrap: isMobile ? "wrap" : "nowrap", alignItems:"center", gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:C.limeGlow, border:`1px solid ${C.lime}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📋</div>
              <div style={{ flex:1, minWidth: isMobile ? "60%" : 0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ fontSize:15, fontWeight:700, color:C.text, fontFamily:"'Barlow Condensed',sans-serif" }}>{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ fontSize:12, color:C.sub }}>Assigned to {p.client} · {p.days} days/wk · {p.weeks} weeks</div>
              </div>
              {!isMobile && (
                <div style={{ textAlign:"right", marginRight:16 }}>
                  <div style={{ fontSize:11, color:C.muted }}>Last updated</div>
                  <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>{p.lastUpdated}</div>
                </div>
              )}
              <div style={{ display:"flex", gap:8, width: isMobile ? "100%" : "auto" }}>
                <button onClick={()=>onNav && onNav("planBuilder")} style={{ padding:"7px 14px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, color:C.sub, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}>Edit</button>
                <button onClick={()=>onNav && onNav("planBuilder")} style={{ padding:"7px 14px", background:C.limeGlow, border:`1px solid ${C.lime}30`, borderRadius:8, color:C.lime, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}>View</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
