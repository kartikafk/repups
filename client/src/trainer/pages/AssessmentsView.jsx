import { C, useBreakpoint } from "../theme";
import { ASSESSMENTS } from "../mockData";
import { Card, Avatar, ProgBar } from "../components";

// ─── VIEW: ASSESSMENTS ────────────────────────────────────────────────────────
export default function AssessmentsView() {
  const { isMobile } = useBreakpoint();
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text }}>Client Assessments</h2>
          <p style={{ fontSize:13, color:C.sub, marginTop:3 }}>Shared biomechanics reports from your clients</p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:14 }}>
        {ASSESSMENTS.map(a => {
          const scoreColor = a.score>=80 ? C.lime : a.score>=65 ? C.gold : C.red;
          return (
            <Card key={a.id} style={{ padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <Avatar initials={a.avatar} size={40} color={scoreColor} />
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text, fontFamily:"'Barlow Condensed',sans-serif" }}>{a.client}</div>
                    <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>{a.type}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"monospace", fontSize:28, fontWeight:700, color:scoreColor, lineHeight:1 }}>{a.score}</div>
                  <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>/100 score</div>
                </div>
              </div>

              <ProgBar value={a.score} color={scoreColor} height={5} />

              {a.issues.length > 0 && (
                <div style={{ marginTop:12, padding:"10px 12px", background:`${C.gold}0d`, border:`1px solid ${C.gold}22`, borderRadius:9 }}>
                  <div style={{ fontSize:10, color:C.gold, fontWeight:700, marginBottom:6 }}>DETECTED ISSUES</div>
                  {a.issues.map((issue,i)=>(
                    <div key={i} style={{ fontSize:12, color:C.sub, display:"flex", gap:6, marginBottom:3 }}>
                      <span style={{ color:C.gold }}>⚠</span> {issue}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:11, color:C.muted }}>{a.date} · {a.shared ? "Client shared" : "Not shared"}</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ padding:"6px 12px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:7, color:C.sub, fontFamily:"inherit", fontSize:11, cursor:"pointer" }}>View Report</button>
                  <button style={{ padding:"6px 12px", background:C.limeGlow, border:`1px solid ${C.lime}30`, borderRadius:7, color:C.lime, fontFamily:"inherit", fontSize:11, cursor:"pointer" }}>Add Recommendations</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
