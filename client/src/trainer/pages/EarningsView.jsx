import { C, useBreakpoint } from "../theme";
import { EARNINGS_DATA } from "../mockData";
import { Card, SectionLabel, ProgBar } from "../components";

// ─── VIEW: EARNINGS ───────────────────────────────────────────────────────────
export default function EarningsView() {
  const { isMobile } = useBreakpoint();
  const maxVal = Math.max(...EARNINGS_DATA.map(d=>d.amount));

  return (
    <div>
      <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text, marginBottom:22 }}>Earnings</h2>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:14, marginBottom:22 }}>
        {[
          { label:"This Month",   value:"₹84,000", sub:"Jul 2026",     color:C.lime },
          { label:"Pending",      value:"₹12,000", sub:"Awaiting payment", color:C.gold },
          { label:"Total (YTD)",  value:"₹4,33,000",sub:"Jan–Jul 2026", color:C.blue },
        ].map((s,i)=>(
          <Card key={i} style={{ padding:22 }}>
            <div style={{ fontSize:11, color:C.sub, marginBottom:8, fontWeight:600, letterSpacing:"0.5px" }}>{s.label}</div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card style={{ padding:24, marginBottom:18 }}>
        <SectionLabel>Monthly Revenue</SectionLabel>
        <div style={{ display:"flex", alignItems:"flex-end", gap:12, height:160 }}>
          {EARNINGS_DATA.map((d,i)=>{
            const isLatest = i===EARNINGS_DATA.length-1;
            const barH = (d.amount/maxVal)*130;
            return (
              <div key={d.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ fontSize:11, color:isLatest?C.lime:C.sub, fontFamily:"monospace" }}>₹{(d.amount/1000).toFixed(0)}k</div>
                <div style={{ width:"100%", height:barH, borderRadius:"6px 6px 0 0", background:isLatest?C.lime:`${C.lime}30`, border:isLatest?`none`:`1px solid ${C.lime}20`, transition:"height 0.6s ease" }} />
                <div style={{ fontSize:11, color:isLatest?C.lime:C.sub }}>{d.month}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Breakdown */}
      <Card style={{ padding:20 }}>
        <SectionLabel>Revenue by Service — July</SectionLabel>
        {[
          { service:"Personal Training",    sessions:8, amount:20000, color:C.lime },
          { service:"Video Consultation",   sessions:6, amount:9000,  color:C.blue },
          { service:"Workout Programming",  sessions:5, amount:5000,  color:C.purple },
          { service:"Home Personal Training",sessions:4,amount:12000, color:C.gold },
        ].map((row,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:i<3?`1px solid ${C.border}`:"none" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:row.color, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:C.text, marginBottom:4 }}>{row.service}</div>
              <ProgBar value={row.amount/maxVal*100} color={row.color} />
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"monospace", fontSize:14, fontWeight:700, color:row.color }}>₹{row.amount.toLocaleString()}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{row.sessions} sessions</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
