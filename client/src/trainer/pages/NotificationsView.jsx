import { useState } from "react";
import { C } from "../theme";
import { NOTIFICATIONS } from "../mockData";
import { Card } from "../components";

// ─── VIEW: NOTIFICATIONS ──────────────────────────────────────────────────────
export default function NotificationsView() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unreadCount = items.filter(n=>n.unread).length;
  const typeColor = { booking:C.blue, message:C.lime, payment:C.gold, review:C.gold, assessment:C.teal, system:C.purple };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text }}>Notifications</h2>
          <p style={{ fontSize:13, color:C.sub, marginTop:3 }}>{unreadCount} unread</p>
        </div>
        <button onClick={()=>setItems(items.map(n=>({...n, unread:false})))} style={{ padding:"9px 16px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:9, color:C.sub, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}>Mark all as read</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {items.map(n => (
          <Card key={n.id} onClick={()=>setItems(items.map(i=>i.id===n.id?{...i, unread:false}:i))}
            style={{ padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer", border:`1px solid ${n.unread?`${C.lime}30`:C.border}`, background:n.unread?C.limeGlow:C.card }}>
            <div style={{ width:36, height:36, borderRadius:9, background:`${typeColor[n.type]}18`, border:`1px solid ${typeColor[n.type]}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{n.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{n.title}</span>
                {n.unread && <div style={{ width:6, height:6, borderRadius:"50%", background:C.lime }} />}
              </div>
              <div style={{ fontSize:12, color:C.sub, marginTop:3 }}>{n.body}</div>
            </div>
            <div style={{ fontSize:11, color:C.muted, flexShrink:0 }}>{n.time}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
