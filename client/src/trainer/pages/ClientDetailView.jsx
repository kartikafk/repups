import { C, useBreakpoint } from "../theme";
import { CLIENTS, PLANS, ASSESSMENTS } from "../mockData";
import { Card, Avatar, Badge, StatusBadge, SectionLabel } from "../components";

// ─── VIEW: CLIENT DETAIL (dedicated page) ─────────────────────────────────────
export default function ClientDetailView({ clientId, onBack }) {
  const { isMobile, isTablet } = useBreakpoint();
  const client = CLIENTS.find(c => c.id === clientId) || CLIENTS[0];
  const plan = PLANS.find(p => p.client === client.name);
  const assessment = ASSESSMENTS.find(a => a.client === client.name);
  const history = [
    { date:"Jul 29", type:"Personal Training", note:"Hit new 5RM on squat" },
    { date:"Jul 24", type:"Personal Training", note:"Focused on tempo work" },
    { date:"Jul 17", type:"Video Consultation", note:"Reviewed nutrition log" },
  ];

  return (
    <div>
      <button onClick={onBack} style={{ background:"none", border:"none", color:C.sub, cursor:"pointer", fontSize:12, marginBottom:16, padding:0 }}>← Back to Clients</button>

      <div style={{ display:"grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 340px", gap:18 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card style={{ padding:22 }}>
            <div style={{ display:"flex", flexWrap: isMobile ? "wrap" : "nowrap", gap:16, alignItems:"center", marginBottom:16 }}>
              <Avatar initials={client.avatar} size={60} />
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text }}>{client.name}</div>
                <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                  <Badge color={C.lime}>{client.goal}</Badge>
                  <Badge color={C.blue}>{client.level}</Badge>
                  <StatusBadge status={client.status} />
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="trainer-btn-primary" style={{ padding: "9px 16px", fontSize: 12 }}>Message</button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap:10 }}>
              {[["Progress",client.progress+"%",C.lime],["Streak","🔥 "+client.streak,C.gold],["Last Active",client.lastActive,C.sub],["Next Session",client.nextSession,C.lime]].map(([l,v,col])=>(
                <div key={l} style={{ background:C.card2, borderRadius:10, padding:"10px 12px" }}>
                  <div style={{ fontSize:10, color:C.sub, marginBottom:3 }}>{l}</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:col }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding:20 }}>
            <SectionLabel>Progress Over Time</SectionLabel>
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:100 }}>
              {[42,51,58,63,70,client.progress].map((v,i)=>(
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:"100%", height:`${v}%`, borderRadius:"5px 5px 0 0", background:i===5?C.lime:`${C.lime}35` }} />
                  <div style={{ fontSize:9, color:C.muted }}>W{i+1}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding:20 }}>
            <SectionLabel>Session History</SectionLabel>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {history.map((h,i)=>(
                <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"10px 12px", background:C.card2, borderRadius:9, border:`1px solid ${C.border2}` }}>
                  <div style={{ fontSize:11, color:C.lime, fontWeight:700, width:48, flexShrink:0 }}>{h.date}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:C.text, fontWeight:600 }}>{h.type}</div>
                    <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{h.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {client.issues.length > 0 && (
            <Card style={{ padding:18 }}>
              <SectionLabel>Movement Flags</SectionLabel>
              {client.issues.map((issue,i)=>(
                <div key={i} style={{ fontSize:12, color:C.sub, marginBottom:4 }}>⚠ {issue}</div>
              ))}
            </Card>
          )}

          {plan && (
            <Card style={{ padding:18 }}>
              <SectionLabel>Assigned Plan</SectionLabel>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>{plan.name}</div>
              <div style={{ fontSize:11, color:C.sub }}>{plan.days} days/wk · {plan.weeks} weeks</div>
            </Card>
          )}

          {assessment && (
            <Card style={{ padding:18 }}>
              <SectionLabel>Latest Assessment</SectionLabel>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:12, color:C.text }}>{assessment.type}</div>
                <div style={{ fontFamily:"monospace", fontSize:18, fontWeight:700, color:C.lime }}>{assessment.score}</div>
              </div>
            </Card>
          )}

          <Card style={{ padding:18 }}>
            <SectionLabel>Private Trainer Notes</SectionLabel>
            <textarea placeholder="Add private notes about this client…" style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:9, color:C.text, fontFamily:"inherit", fontSize:12, padding:"10px 12px", resize:"vertical", minHeight:80, outline:"none" }} />
            <button className="trainer-btn-soft" style={{ marginTop:8, padding:"8px 16px", fontSize:12 }}>Save Note</button>
          </Card>
        </div>
      </div>
    </div>
  );
}
