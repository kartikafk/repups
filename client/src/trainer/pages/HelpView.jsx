import { useState } from "react";
import { C } from "../theme";
import { HELP_TOPICS } from "../mockData";
import { Card, SectionLabel } from "../components";

// ─── VIEW: HELP & SUPPORT ─────────────────────────────────────────────────────
export default function HelpView() {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ maxWidth:720 }}>
      <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text, marginBottom:6 }}>Help & Support</h2>
      <p style={{ fontSize:13, color:C.sub, marginBottom:22 }}>Answers to common questions, or reach our support team directly.</p>

      <Card style={{ padding:20, marginBottom:18 }}>
        <SectionLabel>Frequently Asked Questions</SectionLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {HELP_TOPICS.map(t => (
            <div key={t.id} style={{ background:C.card2, borderRadius:10, border:`1px solid ${C.border2}`, overflow:"hidden" }}>
              <div onClick={()=>setOpen(open===t.id?null:t.id)} style={{ padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{t.q}</span>
                <span style={{ color:C.lime, fontSize:13 }}>{open===t.id?"−":"+"}</span>
              </div>
              {open===t.id && <div style={{ padding:"0 14px 14px", fontSize:12, color:C.sub, lineHeight:1.6 }}>{t.a}</div>}
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding:20 }}>
        <SectionLabel>Contact Support</SectionLabel>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <input placeholder="Subject" style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontFamily:"inherit", fontSize:13, padding:"10px 12px", outline:"none" }} />
          <textarea placeholder="Describe your issue…" style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontFamily:"inherit", fontSize:13, padding:"10px 12px", resize:"vertical", minHeight:100, outline:"none" }} />
          <button className="trainer-btn-primary" style={{ alignSelf:"flex-start" }}>Send Message</button>
        </div>
      </Card>
    </div>
  );
}
