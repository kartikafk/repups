import { useState } from "react";
import { C } from "../theme";
import { QNA } from "../mockData";
import { Card, Avatar, Badge } from "../components";

// ─── VIEW: Q&A ────────────────────────────────────────────────────────────────
export default function QnAView() {
  const [answering, setAnswering] = useState(null);
  const [draftAnswer, setDraftAnswer] = useState("");

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
        <div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text }}>RepUps Q&A</h2>
          <p style={{ fontSize:13, color:C.sub, marginTop:3 }}>Questions matched to your specializations</p>
        </div>
        <Badge color={C.lime}>{QNA.length} new questions</Badge>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {QNA.map(q => (
          <Card key={q.id} style={{ padding:20 }}>
            {/* Question header */}
            <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:14 }}>
              <Avatar initials={q.avatar} size={38} color={C.sub} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{q.client}</span>
                  <span style={{ fontSize:11, color:C.muted }}>{q.time}</span>
                </div>
                <p style={{ fontSize:14, color:C.text, lineHeight:1.6, marginBottom:10 }}>{q.question}</p>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {q.tags.map(t => <Badge key={t} color={C.blue}>{t}</Badge>)}
                  {q.aiAnswered && <Badge color={C.purple}>🤖 AI answered</Badge>}
                </div>
              </div>
              <div style={{ flexShrink:0 }}>
                <Badge color={q.replies>0 ? C.teal : C.sub}>{q.replies} {q.replies===1?"reply":"replies"}</Badge>
              </div>
            </div>

            {/* AI answer preview */}
            {q.aiAnswered && (
              <div style={{ background:`${C.purple}0d`, border:`1px solid ${C.purple}22`, borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ fontSize:11, color:C.purple, fontWeight:700, marginBottom:6 }}>🤖 AI Response (client can see)</div>
                <p style={{ fontSize:12, color:C.sub, lineHeight:1.6 }}>RepUp AI has provided a general explanation and suggested this may be related to hip mobility or knee tracking. Recommended the client consult a qualified professional for personalized advice.</p>
              </div>
            )}

            {/* Answer form */}
            {answering === q.id ? (
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                <div style={{ fontSize:11, color:C.lime, fontWeight:700, marginBottom:8 }}>Your Expert Answer</div>
                <textarea value={draftAnswer} onChange={e=>setDraftAnswer(e.target.value)}
                  placeholder="Provide your professional answer based on your expertise…"
                  style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:9, color:C.text, fontFamily:"inherit", fontSize:13, padding:"10px 12px", resize:"vertical", minHeight:100, outline:"none", marginBottom:10 }} />
                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ padding:"8px 18px", background:C.lime, border:"none", borderRadius:8, color:"#00121A", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer" }}
                    onClick={()=>{ setAnswering(null); setDraftAnswer(""); }}>Post Answer</button>
                  <button style={{ padding:"8px 14px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, color:C.sub, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}
                    onClick={()=>setAnswering(null)}>Cancel</button>
                  <button style={{ padding:"8px 14px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, color:C.sub, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}>📎 Attach Exercise</button>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setAnswering(q.id)}
                  style={{ padding:"8px 18px", background:C.limeGlow, border:`1px solid ${C.lime}30`, borderRadius:8, color:C.lime, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                  Answer Question
                </button>
                <button style={{ padding:"8px 14px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, color:C.sub, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}>Save for Later</button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
