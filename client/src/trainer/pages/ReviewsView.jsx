import { C, useBreakpoint } from "../theme";
import { REVIEWS } from "../mockData";
import { Card, Avatar, Badge, Stars, ProgBar } from "../components";

// ─── VIEW: REVIEWS ────────────────────────────────────────────────────────────
export default function ReviewsView() {
  const { isMobile } = useBreakpoint();
  const avg = (REVIEWS.reduce((s,r)=>s+r.overall,0)/REVIEWS.length).toFixed(1);
  const cats = ["knowledge","communication","professionalism","value"];

  return (
    <div>
      <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text, marginBottom:22 }}>Reviews</h2>

      {/* Summary */}
      <Card style={{ padding:24, marginBottom:18, display:"flex", flexDirection: isMobile ? "column" : "row", gap:32, alignItems: isMobile ? "flex-start" : "center" }}>
        <div style={{ textAlign:"center", minWidth:100 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:48, fontWeight:800, color:C.gold, lineHeight:1 }}>{avg}</div>
          <Stars rating={+avg} size={16} />
          <div style={{ fontSize:12, color:C.sub, marginTop:6 }}>{REVIEWS.length} verified reviews</div>
        </div>
        <div style={{ flex:1 }}>
          {cats.map(cat => {
            const avg2 = (REVIEWS.reduce((s,r)=>s+r[cat],0)/REVIEWS.length);
            return (
              <div key={cat} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:C.sub, textTransform:"capitalize" }}>{cat}</span>
                  <span style={{ fontSize:12, color:C.gold, fontFamily:"monospace" }}>{avg2.toFixed(1)}</span>
                </div>
                <ProgBar value={avg2/5*100} color={C.gold} />
              </div>
            );
          })}
        </div>
      </Card>

      {REVIEWS.map(r => (
        <Card key={r.id} style={{ padding:20, marginBottom:12 }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <Avatar initials={r.avatar} size={40} color={C.gold} />
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{r.client}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                    <Stars rating={r.overall} />
                    <Badge color={C.lime}>Verified Session</Badge>
                  </div>
                </div>
                <div style={{ fontSize:11, color:C.muted }}>{r.date}</div>
              </div>
              <p style={{ fontSize:13, color:C.sub, lineHeight:1.65, fontStyle:"italic" }}>"{r.text}"</p>
              <div style={{ display:"flex", gap:12, marginTop:10 }}>
                {cats.map(cat=>(
                  <div key={cat} style={{ fontSize:11, color:C.muted }}>
                    <span style={{ textTransform:"capitalize" }}>{cat}</span>: <span style={{ color:C.gold }}>{r[cat]}/5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
