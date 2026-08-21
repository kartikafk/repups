import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Video, MoreVertical, MessageCircle, Share2, Bookmark, Dumbbell, Target } from "lucide-react";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";
import { C, base, BottomNav, Top } from "./communityShared";

const styles = {
 composer:{...base.card,padding:10,marginBottom:10}, ctop:{display:"grid",gridTemplateColumns:"44px 1fr",gap:10},
 avatar:{width:42,height:42,borderRadius:"50%",background:"#171C20",display:"grid",placeItems:"center",color:C.lime,fontWeight:800,border:`1px solid ${C.border}`},
 ta:{width:"100%",minHeight:60,resize:"none",border:0,outline:0,background:"transparent",color:C.text,fontSize:10,lineHeight:1.45},
 acts:{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"1fr 1fr 110px",gap:6},
 btn:{height:34,borderRadius:8,border:`1px solid ${C.border}`,background:"#080A0C",color:C.text,display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontSize:9},
 postBtn:{height:34,border:0,borderRadius:8,background:C.lime,color:"#070905",fontWeight:800,fontSize:9},
 post:{...base.card,padding:10,marginBottom:10}, head:{display:"grid",gridTemplateColumns:"40px 1fr 24px",gap:8,alignItems:"center"},
 name:{fontSize:11,fontWeight:760}, meta:{color:C.muted,fontSize:8,marginTop:2}, txt:{fontSize:10.5,lineHeight:1.5,margin:"10px 0"},
 media:{minHeight:142,borderRadius:10,border:`1px solid ${C.border}`,background:"linear-gradient(145deg,#101418,#050607)",display:"grid",gridTemplateColumns:"1.15fr .85fr",overflow:"hidden"},
 visual:{display:"grid",placeItems:"center",color:C.lime,borderRight:`1px solid ${C.border}`},
 info:{padding:12,display:"flex",flexDirection:"column",justifyContent:"center"}, title:{fontSize:11,fontWeight:760}, mmeta:{color:C.muted,fontSize:8,marginTop:4},
 engage:{display:"grid",gridTemplateColumns:"70px 70px 1fr 30px",gap:6,alignItems:"center",marginTop:9},
 ebtn:{height:30,border:0,background:"transparent",color:C.muted,display:"flex",alignItems:"center",gap:5,fontSize:9}
};
const currentAccount = () => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } };

export default function CommunityFeed(){
 const navigate=useNavigate(), [text,setText]=useState(""), [posts,setPosts]=useState([]), [error,setError]=useState(""), user=currentAccount();
 useEffect(()=>{ fetch(apiUrl("community/feed"),{headers:authHeaders()}).then(async r=>{const d=await r.json(); if(!r.ok) throw new Error(d.error||"Unable to load the community feed."); return d;}).then(d=>setPosts(d.posts||[])).catch(e=>setError(e.message)); },[]);
 const createPost=async()=>{ if(!text.trim()) return; try { const r=await fetch(apiUrl("community/feed"),{method:"POST",headers:{...authHeaders(),"Content-Type":"application/json"},body:JSON.stringify({text,type:"workout"})}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Unable to publish your post."); setPosts(p=>[d.post,...p]); setText(""); } catch(e){setError(e.message);} };
 const like=async(id)=>{ try { const r=await fetch(apiUrl(`community/feed/${id}/like`),{method:"POST",headers:authHeaders()}); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Unable to update reaction."); const uid=user._id||user.id; setPosts(items=>items.map(p=>p._id!==id?p:{...p,likes:d.liked?[...(p.likes||[]),uid]:(p.likes||[]).filter(x=>String(x)!==String(uid))})); } catch(e){setError(e.message);} };
 return <div style={base.page}><main style={base.shell}><Top navigate={navigate} active="feed"/>
  <section style={styles.composer}><div style={styles.ctop}><div style={styles.avatar}>{(user.name||"You").slice(0,2).toUpperCase()}</div><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Share your workout, posture tip, or progress with the community..." style={styles.ta}/></div><div style={styles.acts}><button style={styles.btn} disabled><ImageIcon size={15}/>Photo</button><button style={styles.btn} disabled><Video size={15}/>Video</button><button style={styles.postBtn} onClick={createPost}>Post</button></div></section>
  {error&&<p style={{color:C.blue,fontSize:10,margin:"0 0 10px"}}>{error}</p>}
  {posts.length===0&&!error&&<p style={{color:C.muted,fontSize:11,textAlign:"center",padding:20}}>No community posts yet.</p>}
  {posts.map(p=><section key={p._id} style={styles.post}><div style={styles.head}><div style={styles.avatar}>{(p.avatar||p.name||"U").slice(0,2)}</div><div><div style={styles.name}>{p.name}<span style={{color:C.blue}}> ◆</span></div><div style={styles.meta}>{new Date(p.createdAt).toLocaleString()} • Athlete</div></div><MoreVertical size={17} color={C.muted}/></div><p style={styles.txt}>{p.text}</p>
  {p.imageUrl?<img src={p.imageUrl} alt="Community post" style={{width:"100%",maxHeight:260,objectFit:"cover",borderRadius:10}}/>:<div style={styles.media}><div style={styles.visual}>{p.type==="milestone"?<Target size={34}/>:<Dumbbell size={38}/>}</div><div style={styles.info}><div style={styles.title}>{p.exercise||"Training update"}</div><div style={styles.mmeta}>{p.stat||"Community progress"}</div></div></div>}
  <div style={styles.engage}><button onClick={()=>like(p._id)} style={{...styles.ebtn,color:C.blue}}>👍 {p.likes?.length||0}</button><button style={styles.ebtn}><MessageCircle size={15}/>{p.comments?.length||0}</button><button style={{...styles.ebtn,justifyContent:"flex-end"}}><Share2 size={15}/>Share</button><Bookmark size={16} color={C.muted}/></div></section>)}
 </main><BottomNav navigate={navigate}/></div>;
}
