import { useState } from "react";
import { C } from "../theme";
import { Card, SectionLabel } from "../components";

// ─── VIEW: SETTINGS ───────────────────────────────────────────────────────────
export default function SettingsView() {
  const [toggles, setToggles] = useState({ emailNotifs:true, smsNotifs:false, newBookingAlerts:true, marketingEmails:false, twoFactor:true, publicProfile:true });
  const toggle = (k) => setToggles(t => ({ ...t, [k]: !t[k] }));

  function Switch({ on, onClick }) {
    return (
      <div onClick={onClick} style={{ width:40, height:22, borderRadius:20, background:on?C.limeGlow:C.card2, border:`1px solid ${on?C.lime:C.border}`, cursor:"pointer", position:"relative", transition:"all 0.15s" }}>
        <div style={{ position:"absolute", top:2, left:on?20:2, width:16, height:16, borderRadius:"50%", background:on?C.lime:C.sub, boxShadow:on?C.glow:"none", transition:"left 0.15s" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth:640 }}>
      <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text, marginBottom:22 }}>Settings</h2>

      <Card style={{ padding:20, marginBottom:14 }}>
        <SectionLabel>Notifications</SectionLabel>
        {[["emailNotifs","Email notifications"],["smsNotifs","SMS notifications"],["newBookingAlerts","New booking alerts"],["marketingEmails","Marketing emails"]].map(([k,label])=>(
          <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:13, color:C.text }}>{label}</span>
            <Switch on={toggles[k]} onClick={()=>toggle(k)} />
          </div>
        ))}
      </Card>

      <Card style={{ padding:20, marginBottom:14 }}>
        <SectionLabel>Security</SectionLabel>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ fontSize:13, color:C.text }}>Two-factor authentication</span>
          <Switch on={toggles.twoFactor} onClick={()=>toggle("twoFactor")} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0" }}>
          <span style={{ fontSize:13, color:C.text }}>Public profile visibility</span>
          <Switch on={toggles.publicProfile} onClick={()=>toggle("publicProfile")} />
        </div>
        <button style={{ marginTop:12, padding:"9px 16px", background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, color:C.sub, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}>Change Password</button>
      </Card>

      <Card style={{ padding:20 }}>
        <SectionLabel>Account</SectionLabel>
        <p style={{ fontSize:12, color:C.sub, marginBottom:12 }}>Manage your language, timezone, and account data.</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:10, color:C.sub, marginBottom:5 }}>Language</div>
            <select style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontFamily:"inherit", fontSize:12, padding:"8px 10px", outline:"none" }}>
              <option>English</option><option>Hindi</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:C.sub, marginBottom:5 }}>Timezone</div>
            <select style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontFamily:"inherit", fontSize:12, padding:"8px 10px", outline:"none" }}>
              <option>IST (UTC+5:30)</option>
            </select>
          </div>
        </div>
        <button style={{ padding:"9px 16px", background:"transparent", border:`1px solid ${C.red}44`, borderRadius:8, color:C.red, fontFamily:"inherit", fontSize:12, cursor:"pointer" }}>Deactivate Account</button>
      </Card>
    </div>
  );
}
