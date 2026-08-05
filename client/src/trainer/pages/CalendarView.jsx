import { useState } from "react";
import { C, useBreakpoint } from "../theme";
import { Card, SectionLabel } from "../components";

// ─── VIEW: CALENDAR ───────────────────────────────────────────────────────────
export default function CalendarView() {
  const [selectedDay, setSelectedDay] = useState(5);
  const { isMobile, isTablet } = useBreakpoint();
  const monthLabel = "August 2026";
  const firstWeekdayOffset = 5; // Aug 1, 2026 is a Saturday
  const daysInMonth = 31;
  const busyDays = { 3:["Arjun Mehta 5:00 PM","Siddharth Roy 7:00 PM"], 4:["Priya Sharma 7:00 AM"], 6:["Rohan Das 6:00 PM"], 7:["Neha Kapoor 8:00 AM"], 12:["Arjun Mehta 5:00 PM"], 18:["Priya Sharma 7:00 AM"], 21:["Rohan Das 6:00 PM"] };
  const cells = [...Array(firstWeekdayOffset).fill(null), ...Array.from({length:daysInMonth}, (_,i)=>i+1)];

  return (
    <div style={{ display:"grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 320px", gap:18 }}>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text }}>Calendar</h2>
            <p style={{ fontSize:13, color:C.sub, marginTop:3 }}>{monthLabel}</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ width:34, height:34, borderRadius:8, background:C.card2, border:`1px solid ${C.border}`, color:C.sub, cursor:"pointer" }}>‹</button>
            <button style={{ width:34, height:34, borderRadius:8, background:C.card2, border:`1px solid ${C.border}`, color:C.sub, cursor:"pointer" }}>›</button>
          </div>
        </div>
        <Card style={{ padding:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6, marginBottom:8 }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
              <div key={d} style={{ textAlign:"center", fontSize:10, color:C.sub, fontWeight:700, letterSpacing:"0.5px", paddingBottom:6 }}>{d}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const hasSessions = !!busyDays[day];
              const isSelected = selectedDay === day;
              const isToday = day === 3;
              return (
                <div key={i} onClick={()=>setSelectedDay(day)}
                  style={{ aspectRatio:"1", borderRadius:10, background:isSelected?C.limeGlow:C.card2, border:`1px solid ${isSelected?`${C.lime}50`:isToday?`${C.lime}30`:C.border2}`, boxShadow:isSelected?"0 0 14px rgba(47,127,255,0.18)":"none", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:3, padding:4 }}>
                  <span style={{ fontSize:12, fontWeight:isToday?800:500, color:isSelected?C.lime:isToday?C.text:C.sub }}>{day}</span>
                  {hasSessions && <div style={{ width:5, height:5, borderRadius:"50%", background:C.lime }} />}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <Card style={{ padding:18 }}>
          <SectionLabel>{`Aug ${selectedDay} · Sessions`}</SectionLabel>
          {(busyDays[selectedDay] || []).length === 0 ? (
            <p style={{ fontSize:12, color:C.muted }}>No sessions scheduled.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {busyDays[selectedDay].map((s,i)=>(
                <div key={i} style={{ padding:"10px 12px", background:C.card2, borderRadius:9, border:`1px solid ${C.border2}`, fontSize:12, color:C.text }}>{s}</div>
              ))}
            </div>
          )}
        </Card>
        <button className="trainer-btn-primary">+ Block Time on Aug {selectedDay}</button>
      </div>
    </div>
  );
}
