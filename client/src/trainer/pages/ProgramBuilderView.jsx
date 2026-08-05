import { C, useBreakpoint } from "../theme";
import { CLIENTS } from "../mockData";
import { Card } from "../components";

// ─── VIEW: PROGRAM BUILDER (dedicated page) ───────────────────────────────────
export default function ProgramBuilderView({ onNav }) {
  const { isMobile } = useBreakpoint();
  const EXERCISES = ["Barbell Squat","Bench Press","Deadlift","OHP","Pull-Up","Romanian Deadlift","Leg Press","Cable Row","Lateral Raise","Face Pull","Hip Thrust","Tricep Pushdown"];

  return (
    <div>
      <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0, justifyContent:"space-between", alignItems: isMobile ? "stretch" : "center", marginBottom:22 }}>
        <div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text }}>Program Builder</h2>
          <p style={{ fontSize:13, color:C.sub, marginTop:3 }}>Design a new workout program day by day</p>
        </div>
        <button onClick={()=>onNav && onNav("plans")} className="trainer-btn-soft" style={{ alignSelf: isMobile ? "flex-start" : "auto" }}>
          ← Back to Plans
        </button>
      </div>

      <Card style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:800, color:C.text, marginBottom:20 }}>
          New Workout Plan
        </div>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap:14, marginBottom:20 }}>
          {[["Plan Name","e.g. Hypertrophy Block A"],["Assigned Client","Select client"],["Duration (weeks)","8"]].map(([l,ph])=>(
            <div key={l}>
              <div style={{ fontSize:11, color:C.sub, marginBottom:6, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase" }}>{l}</div>
              {l==="Assigned Client" ? (
                <select style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontFamily:"inherit", fontSize:13, padding:"10px 12px", outline:"none" }}>
                  <option>Select client…</option>
                  {CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <input placeholder={ph} style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontFamily:"inherit", fontSize:13, padding:"10px 12px", outline:"none" }} />
              )}
            </div>
          ))}
        </div>

        {/* Exercise rows */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:C.sub, marginBottom:12, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase" }}>Day 1 Exercises</div>
          <div style={{ display:"flex", gap:8, marginBottom:10, padding:"10px 14px", background:C.card2, borderRadius:10, border:`1px solid ${C.border2}`, alignItems:"center", overflowX: isMobile ? "auto" : "visible" }}>
            <select style={{ flex:"2 0 140px", background:"transparent", border:"none", color:C.text, fontFamily:"inherit", fontSize:13, outline:"none", cursor:"pointer" }}>
              {EXERCISES.map(e=><option key={e}>{e}</option>)}
            </select>
            {[["Sets","4"],["Reps","8"],["Weight","80 kg"],["Rest","90s"]].map(([l,v])=>(
              <input key={l} defaultValue={v} style={{ width:64, flexShrink:0, background:"transparent", border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontFamily:"monospace", fontSize:12, padding:"6px 8px", outline:"none", textAlign:"center" }} />
            ))}
            <input placeholder="Form cue…" style={{ flex:"2 0 120px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:6, color:C.text, fontFamily:"inherit", fontSize:12, padding:"6px 8px", outline:"none" }} />
            <button style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:16, flexShrink:0 }}>✕</button>
          </div>
          <button style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:C.card2, border:`1px dashed ${C.border}`, borderRadius:8, color:C.sub, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}>
            + Add Exercise
          </button>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button onClick={()=>onNav && onNav("plans")} className="trainer-btn-primary">Save & Assign Plan</button>
          <button onClick={()=>onNav && onNav("plans")} className="trainer-btn-ghost">Save as Draft</button>
        </div>
      </Card>
    </div>
  );
}
