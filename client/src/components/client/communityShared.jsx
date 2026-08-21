import { Bell, Home, Users, MapPinned, Bot, Search } from "lucide-react";

export const C = { bg:"#030405", surface:"#090B0D", border:"#242A2F", lime:"#C8FF3D", blue:"#1687FF", text:"#FFFFFF", muted:"#90989E" };
export const base = {
 page:{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:'Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'},
 shell:{width:"100%",maxWidth:430,margin:"0 auto",padding:"14px 12px 94px",boxSizing:"border-box"},
 topbar:{minHeight:58,display:"flex",alignItems:"center",justifyContent:"space-between"},
 logo:{fontSize:22,fontWeight:850,letterSpacing:"-0.8px"}, bell:{width:38,height:38,border:0,borderRadius:"50%",background:"transparent",color:C.text,display:"grid",placeItems:"center",position:"relative"},
 dot:{position:"absolute",top:6,right:7,width:7,height:7,borderRadius:"50%",background:C.lime,border:`2px solid ${C.bg}`},
 tabs:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:`1px solid ${C.border}`,marginBottom:12},
 tab:{height:44,border:0,borderBottom:"2px solid transparent",background:"transparent",color:C.muted,fontSize:10}, activeTab:{color:C.lime,borderBottomColor:C.lime,fontWeight:760},
 card:{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,boxSizing:"border-box"},
 bottom:{position:"fixed",zIndex:1000,left:"50%",bottom:0,transform:"translateX(-50%)",width:"100%",maxWidth:430,height:74,display:"grid",gridTemplateColumns:"repeat(5,1fr)",padding:"8px 4px 10px",background:"rgba(3,4,5,.98)",borderTop:`1px solid ${C.border}`,boxSizing:"border-box"},
 nav:{border:0,background:"transparent",color:"#858D93",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,fontSize:7.5}, navActive:{color:C.lime}
};
export function BottomNav() { return null; }
export function Top({ navigate, active }) {
  const tabs = [
    ["For You", "/community", "feed"],
    ["Following", "/community/following", "following"],
    ["Challenges", "/community/challenges", "challenges"],
    ["Leaderboard", "/community/leaderboard", "leaderboard"],
  ];

  return (
    <>
      <header style={base.topbar}>
        <div style={base.logo}>Rep<span style={{ color: C.lime }}>Ups</span></div>
        <button type="button" style={base.bell} aria-label="Notifications" onClick={() => navigate("/client/notifications")}>
          <Bell size={20} />
          <span style={base.dot} />
        </button>
      </header>
      <nav style={base.tabs} aria-label="Community sections">
        {tabs.map(([label, path, key]) => (
          <button key={key} type="button" style={{ ...base.tab, ...(active === key ? base.activeTab : {}) }} onClick={() => navigate(path)}>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
