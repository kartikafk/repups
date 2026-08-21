import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bot, CalendarDays, CheckCircle2, ChevronRight, Home, MapPin, MapPinned, Navigation, Search, Users, Dumbbell, Star, Filter, List, Map, Clock3, Building2 } from "lucide-react";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

const C={bg:"#030405",surface:"#090B0D",border:"#242A2F",lime:"#C8FF3D",blue:"#1687FF",text:"#fff",muted:"#90989E",green:"#29D35B",red:"#ff6464"};
const s={page:{minHeight:"100dvh",background:C.bg,color:C.text,fontFamily:"Inter,system-ui,sans-serif"},shell:{maxWidth:430,margin:"auto",padding:"14px 12px 94px"},card:{background:C.surface,border:`1px solid ${C.border}`,borderRadius:13,padding:12,marginBottom:10},btn:{height:44,border:0,borderRadius:9,background:C.lime,color:"#070905",fontWeight:800,width:"100%"},ghost:{height:40,border:`1px solid ${C.border}`,borderRadius:9,background:"transparent",color:C.text},input:{width:"100%",height:42,boxSizing:"border-box",border:`1px solid ${C.border}`,borderRadius:9,background:"#080A0C",color:C.text,padding:"0 11px",fontSize:13}};
const request=(path,options={})=>fetch(apiUrl(path),{...options,headers:{...authHeaders(),...(options.headers||{})}}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");return d});
const currentUser=()=>{try{return JSON.parse(localStorage.getItem("user")||"{}")}catch{return {}}};
const date=(value)=>value?new Date(value).toLocaleString([], {dateStyle:"medium",timeStyle:"short"}):"Date unavailable";
const image=(item)=>item.images?.[0]||item.imageUrl||"";
function Frame({children}){return <div style={s.page}><main style={s.shell}>{children}</main></div>}
function State({loading,error,retry,empty}){return <div style={{...s.card,textAlign:"center",color:error?C.red:C.muted,padding:28}}>{loading?"Loading…":error?<><p>{error}</p><button style={{...s.ghost,marginTop:12}} onClick={retry}>Retry</button></>:empty}</div>}
function Hero({src,label}){return src?<img src={src} alt="" style={{width:"100%",height:170,objectFit:"cover",borderRadius:11,marginBottom:10}}/>:<div style={{height:120,borderRadius:11,background:"#101416",display:"grid",placeItems:"center",color:C.muted,marginBottom:10}}>{label}</div>}
export function Explore(){
  const nav=useNavigate();
  const [tab,setTab]=useState("events");
  const [data,setData]=useState({events:null,gyms:null});
  const [error,setError]=useState("");

  const load=()=>{
    setError("");
    Promise.all([request("events"),request("gyms")])
      .then(([events,gyms])=>setData({
        events:events.events||[],
        gyms:gyms.gyms||[]
      }))
      .catch(e=>setError(e.message));
  };

  useEffect(()=>{load()},[]);

  const events=data.events;
  const gyms=data.gyms;

  const navItems=[
    ["Home","/dashboard",<Home size={20}/>],
    ["Community","/community",<Users size={20}/>],
    ["Events & Gyms","/client/events-gyms",<MapPin size={20}/>,true],
    ["Coach","/ai-coach",<Bot size={20}/>],
    ["Find Trainer","/client/trainers",<Search size={20}/>],
  ];

  const st={
    page:{
      minHeight:"100dvh",
      background:"#030405",
      color:"#fff",
      fontFamily:"Inter,system-ui,sans-serif"
    },

    shell:{
      width:"100%",
      maxWidth:430,
      margin:"0 auto",
      padding:"14px 12px 92px",
      boxSizing:"border-box"
    },

    top:{
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      marginBottom:4
    },

    title:{
      margin:0,
      fontSize:22,
      fontWeight:800
    },

    filterBtn:{
      width:38,
      height:38,
      borderRadius:"50%",
      border:0,
      background:"transparent",
      color:"#d8dddf",
      display:"grid",
      placeItems:"center"
    },

    location:{
      display:"flex",
      alignItems:"center",
      gap:5,
      color:"#1687FF",
      fontSize:10,
      marginBottom:12
    },

    segment:{
      display:"grid",
      gridTemplateColumns:"1fr 1fr",
      gap:4,
      padding:4,
      border:"1px solid #242A2F",
      borderRadius:11,
      background:"#090B0D",
      marginBottom:14
    },

    segmentBtn:{
      height:36,
      border:0,
      borderRadius:8,
      background:"transparent",
      color:"#c8ced2",
      fontSize:10,
      fontWeight:700
    },

    segmentActive:{
      background:"#C8FF3D",
      color:"#070905"
    },

    sectionHead:{
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      margin:"4px 2px 8px"
    },

    sectionTitle:{
      fontSize:12,
      fontWeight:800
    },

    viewAll:{
      border:0,
      background:"transparent",
      color:"#1687FF",
      fontSize:9,
      padding:0
    },

    eventCard:{
      border:"1px solid #242A2F",
      background:"#090B0D",
      borderRadius:12,
      padding:8,
      display:"grid",
      gridTemplateColumns:"112px 1fr",
      gap:9,
      marginBottom:8
    },

    eventImage:{
      width:"100%",
      height:96,
      objectFit:"cover",
      borderRadius:9,
      background:"#111619"
    },

    eventFallback:{
      width:"100%",
      height:96,
      borderRadius:9,
      background:"linear-gradient(145deg,#171c20,#080a0c)",
      display:"grid",
      placeItems:"center",
      color:"#C8FF3D"
    },

    eventTitle:{
      margin:0,
      fontSize:11,
      fontWeight:800
    },

    meta:{
      display:"flex",
      alignItems:"center",
      gap:5,
      color:"#a3abb0",
      fontSize:8,
      marginTop:4,
      lineHeight:1.35
    },

    register:{
      width:"100%",
      height:32,
      border:0,
      borderRadius:7,
      background:"#C8FF3D",
      color:"#070905",
      fontSize:9,
      fontWeight:850,
      marginTop:7
    },

    listMap:{
      display:"grid",
      gridTemplateColumns:"1fr 1fr",
      gap:5,
      marginBottom:8
    },

    listMapBtn:{
      height:32,
      border:"1px solid #242A2F",
      borderRadius:8,
      background:"#090B0D",
      color:"#9ca5aa",
      fontSize:8.5
    },

    listMapActive:{
      background:"#C8FF3D",
      color:"#070905",
      borderColor:"#C8FF3D"
    },

    gymCard:{
      border:"1px solid #242A2F",
      background:"#090B0D",
      borderRadius:11,
      padding:8,
      display:"grid",
      gridTemplateColumns:"92px 1fr",
      gap:9,
      marginBottom:8
    },

    gymImage:{
      width:92,
      height:72,
      borderRadius:8,
      objectFit:"cover",
      background:"#111619"
    },

    gymFallback:{
      width:92,
      height:72,
      borderRadius:8,
      background:"linear-gradient(145deg,#171c20,#080a0c)",
      display:"grid",
      placeItems:"center",
      color:"#C8FF3D"
    },

    gymName:{
      margin:0,
      fontSize:10.5,
      fontWeight:800
    },

    ratingRow:{
      display:"flex",
      alignItems:"center",
      gap:4,
      marginTop:4,
      fontSize:8
    },

    open:{
      marginLeft:"auto",
      color:"#29D35B",
      fontSize:7.5
    },

    tags:{
      display:"flex",
      gap:4,
      flexWrap:"wrap",
      marginTop:6
    },

    tag:{
      padding:"3px 6px",
      borderRadius:999,
      background:"#12171A",
      color:"#aeb5b9",
      fontSize:6.8
    },

    mapBtn:{
      width:"100%",
      height:40,
      border:"1px solid #242A2F",
      borderRadius:9,
      background:"#090B0D",
      color:"#C8FF3D",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      gap:6,
      fontSize:9,
      fontWeight:750,
      marginTop:6
    },

    state:{
      padding:26,
      textAlign:"center",
      border:"1px solid #242A2F",
      borderRadius:12,
      background:"#090B0D",
      color:"#90989E",
      fontSize:9
    },

    retry:{
      height:34,
      marginTop:10,
      padding:"0 12px",
      border:"1px solid #242A2F",
      borderRadius:8,
      background:"transparent",
      color:"#fff"
    },

    bottom:{
      position:"fixed",
      left:"50%",
      bottom:0,
      transform:"translateX(-50%)",
      width:"100%",
      maxWidth:430,
      height:74,
      display:"grid",
      gridTemplateColumns:"repeat(5,1fr)",
      padding:"8px 4px 10px",
      background:"rgba(3,4,5,.98)",
      borderTop:"1px solid #242A2F",
      boxSizing:"border-box",
      zIndex:1000
    },

    navBtn:{
      border:0,
      background:"transparent",
      color:"#858D93",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      justifyContent:"center",
      gap:4,
      fontSize:7.2
    },

    navActive:{
      color:"#C8FF3D"
    }
  };

  return <div style={st.page}>
    <main style={st.shell}>
      <header style={st.top}>
        <h1 style={st.title}>Explore</h1>
        <button style={st.filterBtn} aria-label="Filter">
          <Filter size={19}/>
        </button>
      </header>

      <div style={st.location}>
        <MapPin size={13}/>
        San Francisco, CA
        <span style={{fontSize:10}}>⌄</span>
      </div>

      <section style={st.segment}>
        <button
          style={{...st.segmentBtn,...(tab==="events"?st.segmentActive:{})}}
          onClick={()=>setTab("events")}
        >
          Events
        </button>
        <button
          style={{...st.segmentBtn,...(tab==="gyms"?st.segmentActive:{})}}
          onClick={()=>setTab("gyms")}
        >
          Gyms
        </button>
      </section>

      {tab==="events" && <>
        <div style={st.sectionHead}>
          <div style={st.sectionTitle}>Upcoming Events</div>
          <button style={st.viewAll}>View All</button>
        </div>

        {!events ? (
          <div style={st.state}>
            {error ? <>
              {error}
              <br/>
              <button style={st.retry} onClick={load}>Retry</button>
            </> : "Loading events…"}
          </div>
        ) : !events.length ? (
          <div style={st.state}>No upcoming events found.</div>
        ) : (
          events.slice(0,4).map(event=>(
            <article
              key={event._id}
              style={st.eventCard}
              onClick={()=>nav(`/client/events/${event._id}`)}
            >
              {image(event) ? (
                <img src={image(event)} alt="" style={st.eventImage}/>
              ) : (
                <div style={st.eventFallback}>
                  <CalendarDays size={30}/>
                </div>
              )}

              <div>
                <h3 style={st.eventTitle}>{event.name}</h3>

                <div style={st.meta}>
                  <CalendarDays size={11}/>
                  {date(event.startsAt)}
                </div>

                <div style={st.meta}>
                  <MapPin size={11}/>
                  {event.location||event.address||"Venue unavailable"}
                </div>

                <div style={{...st.meta,justifyContent:"space-between"}}>
                  <span>{event.distanceLabel||""}</span>
                  <span style={{color:"#C8FF3D"}}>
                    {event.capacity
                      ? `${Math.max(event.capacity-(event.registeredCount||0),0)} spots left`
                      : "Open registration"}
                  </span>
                </div>

                <button
                  style={st.register}
                  onClick={e=>{
                    e.stopPropagation();
                    nav(`/client/events/${event._id}`);
                  }}
                >
                  Register
                </button>
              </div>
            </article>
          ))
        )}
      </>}

      {tab==="gyms" && <>
        <div style={st.sectionHead}>
          <div style={st.sectionTitle}>Nearby Gyms</div>
          <button style={st.viewAll} onClick={()=>nav("/client/gyms")}>View All</button>
        </div>

        <div style={st.listMap}>
          <button style={{...st.listMapBtn,...st.listMapActive}}>
            <List size={13} style={{verticalAlign:"middle"}}/> List
          </button>
          <button style={st.listMapBtn} onClick={()=>nav("/client/gyms/map")}>
            <Map size={13} style={{verticalAlign:"middle"}}/> Map
          </button>
        </div>

        {!gyms ? (
          <div style={st.state}>
            {error ? <>
              {error}
              <br/>
              <button style={st.retry} onClick={load}>Retry</button>
            </> : "Loading gyms…"}
          </div>
        ) : !gyms.length ? (
          <div style={st.state}>No gyms found nearby.</div>
        ) : (
          gyms.slice(0,5).map(gym=>(
            <article
              key={gym._id}
              style={st.gymCard}
              onClick={()=>nav(`/client/gyms/${gym._id}`)}
            >
              {image(gym) ? (
                <img src={image(gym)} alt="" style={st.gymImage}/>
              ) : (
                <div style={st.gymFallback}>
                  <Building2 size={26}/>
                </div>
              )}

              <div>
                <h3 style={st.gymName}>
                  {gym.name}
                  <span style={{float:"right",color:"#90989E",fontSize:7.5}}>
                    {gym.distanceLabel||""}
                  </span>
                </h3>

                <div style={st.ratingRow}>
                  <Star size={11} fill="#FFC928" color="#FFC928"/>
                  <span style={{color:"#FFC928"}}>
                    {Number(gym.rating||0).toFixed(1)}
                  </span>
                  <span style={{color:"#90989E"}}>
                    ({gym.reviewCount||0})
                  </span>

                  <span style={st.open}>
                    {gym.openingHours||"Hours unavailable"}
                  </span>
                </div>

                <div style={st.tags}>
                  {(gym.facilities||gym.tags||[]).slice(0,3).map(tag=>(
                    <span key={tag} style={st.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))
        )}

        <button style={st.mapBtn} onClick={()=>nav("/client/gyms/map")}>
          <MapPinned size={15}/>
          View Map
        </button>
      </>}
    </main>

    <nav style={st.bottom}>
      {navItems.map(([label,path,icon,active])=>(
        <button
          key={label}
          style={{...st.navBtn,...(active?st.navActive:{})}}
          onClick={()=>nav(path)}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  </div>;
}

export function EventDetails(){const {eventId}=useParams(),nav=useNavigate(),[event,setEvent]=useState(),[error,setError]=useState("");const load=()=>request(`events/${eventId}`).then(d=>setEvent(d.event)).catch(e=>setError(e.message));useEffect(()=>{load()},[eventId]);return <Frame title="Event Details">{!event?<State loading={!error} error={error} retry={load}/>:<><Hero src={image(event)} label="Event"/><section style={s.card}><h2 style={{margin:0,fontSize:20}}>{event.name}</h2><p style={{color:C.muted,fontSize:12}}>{date(event.startsAt)}{event.endAt&&` – ${date(event.endAt)}`}</p><p style={{fontSize:12}}><MapPin size={13}/> {event.location||event.address||"Venue unavailable"}</p><p style={{color:C.muted,fontSize:12,lineHeight:1.55}}>{event.description||"No event description is available."}</p><p style={{fontSize:12}}>Organized by {event.organizer||"RepUps"}</p>{event.included?.length>0&&<p style={{fontSize:12,color:C.lime}}>Includes: {event.included.join(" · ")}</p>}</section><button style={s.btn} onClick={()=>nav(`/client/events/${eventId}/register`)}>Register now</button></>}</Frame>}
export function EventRegister(){const {eventId}=useParams(),nav=useNavigate(),[event,setEvent]=useState(),[ticket,setTicket]=useState(""),[quantity,setQuantity]=useState(1),[error,setError]=useState("");useEffect(()=>{request(`events/${eventId}`).then(d=>{setEvent(d.event);setTicket(String(d.event.ticketTypes?.[0]?._id||""))}).catch(e=>setError(e.message))},[eventId]);return <Frame title="Registration">{!event?<State loading={!error} error={error}/>:<><section style={s.card}><b>{event.name}</b><label style={{display:"block",marginTop:14,fontSize:11,color:C.muted}}>Ticket type</label><select style={s.input} value={ticket} onChange={e=>setTicket(e.target.value)}>{(event.ticketTypes||[]).map(t=><option key={t._id} value={t._id}>{t.name} — ₹{t.price}</option>)}</select><label style={{display:"block",marginTop:12,fontSize:11,color:C.muted}}>Quantity</label><input style={s.input} type="number" min="1" max="10" value={quantity} onChange={e=>setQuantity(e.target.value)}/></section><button style={s.btn} disabled={!ticket} onClick={()=>nav(`/client/events/${eventId}/attendee`,{state:{ticketTypeId:ticket,quantity:Number(quantity)}})}>Continue</button></>}</Frame>}
export function EventAttendee(){const {eventId}=useParams(),nav=useNavigate(),loc=useLocation(),u=currentUser(),[form,setForm]=useState({fullName:u.name||"",email:u.email||"",phone:u.phone||"",emergencyContact:"",notes:""}),[error,setError]=useState("");const update=(k,v)=>setForm(x=>({...x,[k]:v}));const continueToReview=()=>{if(!form.fullName||!form.email||!form.phone)return setError("Name, email, and phone are required.");nav(`/client/events/${eventId}/review`,{state:{...loc.state,attendee:form}})};return <Frame title="Attendee information"><section style={s.card}>{[["fullName","Full name"],["email","Email","email"],["phone","Phone number","tel"],["emergencyContact","Emergency contact (optional)"],["notes","Additional notes (optional)"]].map(([key,label,type])=><label key={key} style={{display:"block",fontSize:11,color:C.muted,marginBottom:10}}>{label}<input style={{...s.input,marginTop:5}} type={type||"text"} value={form[key]} onChange={e=>update(key,e.target.value)}/></label>)}</section>{error&&<p style={{color:C.red,fontSize:12}}>{error}</p>}<button style={s.btn} onClick={continueToReview}>Review payment</button></Frame>}
export function EventReview(){const {eventId}=useParams(),nav=useNavigate(),loc=useLocation(),[quote,setQuote]=useState(),[error,setError]=useState(""),[busy,setBusy]=useState(false);const payload=loc.state;useEffect(()=>{if(!payload?.ticketTypeId)return;request(`events/${eventId}/registration/quote`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(d=>setQuote(d.quote)).catch(e=>setError(e.message))},[eventId,payload]);const pay=async()=>{try{setBusy(true);const d=await request(`events/${eventId}/payment/order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const payment=await openRazorpay(d);const result=await verifyPayment(`/events/${eventId}/payment/verify`,payment,{registrationId:d.registrationId});nav(`/client/events/${eventId}/success`,{state:result})}catch(e){setError(e.message)}finally{setBusy(false)}};return <Frame title="Review & Pay">{!quote?<State loading={!error} error={error}/>:<><section style={s.card}><b>{quote.ticket.name} × {quote.quantity}</b><Rows data={quote}/></section>{error&&<p style={{color:C.red,fontSize:12}}>{error}</p>}<button style={s.btn} disabled={busy} onClick={pay}>{busy?"Opening payment…":`Pay ₹${quote.total}`}</button></>}</Frame>}
export function EventSuccess(){const {eventId}=useParams(),loc=useLocation(),[record,setRecord]=useState(loc.state?.registration),[error,setError]=useState("");useEffect(()=>{if(record)return;const id=new URLSearchParams(loc.search).get("registrationId");if(id)request(`events/registrations/${id}`).then(d=>setRecord(d.registration)).catch(e=>setError(e.message))},[record,loc.search]);return <Frame title="Registration confirmed">{record?<section style={{...s.card,textAlign:"center",padding:28}}><CheckCircle2 size={54} color={C.lime}/><h2>You're registered</h2><p style={{color:C.muted}}>Ticket ID: {record._id}</p><p>{record.ticketType} × {record.quantity}</p><p style={{color:C.lime}}>Payment confirmed</p></section>:<State loading={!error} error={error}/>}</Frame>}
function Rows({data}){return <div style={{fontSize:12,lineHeight:2,marginTop:10}}><div>Subtotal <span style={{float:"right"}}>₹{data.subtotal}</span></div>{data.platformFee!==undefined&&<div>Platform fee <span style={{float:"right"}}>₹{data.platformFee}</span></div>}<div>Tax <span style={{float:"right"}}>₹{data.tax}</span></div><b>Total <span style={{float:"right",color:C.lime}}>₹{data.total}</span></b></div>}
export function GymsList(){const nav=useNavigate(),[gyms,setGyms]=useState(),[error,setError]=useState(""),[query,setQuery]=useState("");const load=()=>request(`gyms${query?`?q=${encodeURIComponent(query)}`:""}`).then(d=>setGyms(d.gyms)).catch(e=>setError(e.message));useEffect(()=>{load()},[]);return <Frame title="Nearby gyms"><div style={{display:"flex",gap:8,marginBottom:12}}><input style={s.input} placeholder="Search gyms" value={query} onChange={e=>setQuery(e.target.value)}/><button style={{...s.btn,width:82}} onClick={load}><Search size={16}/></button></div>{!gyms?<State loading={!error} error={error} retry={load}/>:!gyms.length?<State empty="No gyms found nearby."/>:gyms.map(g=><article key={g._id} style={{...s.card,display:"grid",gridTemplateColumns:"72px 1fr",gap:10}} onClick={()=>nav(`/client/gyms/${g._id}`)}>{image(g)?<img src={image(g)} alt="" style={{width:72,height:72,objectFit:"cover",borderRadius:9}}/>:<div style={{background:"#111619",borderRadius:9,display:"grid",placeItems:"center"}}>GYM</div>}<div><b>{g.name}</b><p style={{color:C.muted,fontSize:11}}>{g.location||g.address||"Location unavailable"}</p><small style={{color:C.lime}}>★ {Number(g.rating||0).toFixed(1)} · {g.openingHours||"Hours unavailable"}</small></div></article>)}</Frame>}
export function GymMap(){const nav=useNavigate(),[gyms,setGyms]=useState(),[error,setError]=useState("");useEffect(()=>{request("gyms").then(d=>setGyms(d.gyms)).catch(e=>setError(e.message))},[]);return <Frame title="Gym map">{!gyms?<State loading={!error} error={error}/>:<><section style={{...s.card,height:250,display:"grid",placeItems:"center",color:C.muted,textAlign:"center"}}><Navigation color={C.blue} size={38}/><p>Map provider is not configured.<br/>Choose a gym below for directions.</p></section>{gyms.map(g=><button key={g._id} style={{...s.card,width:"100%",textAlign:"left",color:C.text}} onClick={()=>nav(`/client/gyms/${g._id}`)}>{g.name}<ChevronRight style={{float:"right"}}/></button>)}</>}</Frame>}
export function GymDetails(){const {gymId}=useParams(),nav=useNavigate(),[gym,setGym]=useState(),[membership,setMembership]=useState(),[error,setError]=useState("");useEffect(()=>{Promise.all([request(`gyms/${gymId}`),request("gyms/my/memberships").catch(()=>({memberships:[]}))]).then(([g,m])=>{setGym(g.gym);setMembership(m.memberships.find(x=>String(x.gymId)===gymId&&x.status==="active"))}).catch(e=>setError(e.message))},[gymId]);return <Frame title="Gym details">{!gym?<State loading={!error} error={error}/>:<><Hero src={image(gym)} label="Gym"/><section style={s.card}><h2 style={{margin:0}}>{gym.name}</h2><p style={{color:C.lime}}>★ {Number(gym.rating||0).toFixed(1)} ({gym.reviewCount||0})</p><p style={{fontSize:12}}><MapPin size={13}/> {gym.address||gym.location||"Address unavailable"}</p><p style={{color:C.muted,fontSize:12}}>{gym.description||"No description available."}</p><p style={{fontSize:12}}>Amenities: {(gym.facilities||[]).join(" · ")||"Not listed"}</p></section>{membership?<button style={s.btn} onClick={()=>nav(`/client/gyms/${gymId}/membership`,{state:{membership}})}>View your membership</button>:<button style={s.btn} onClick={()=>nav(`/client/gyms/${gymId}/memberships`)}>View memberships</button>}</>}</Frame>}
export function GymMemberships(){const {gymId}=useParams(),nav=useNavigate(),[plans,setPlans]=useState(),[kind,setKind]=useState("membership"),[error,setError]=useState("");useEffect(()=>{request(`gyms/${gymId}/plans`).then(d=>setPlans(d.plans)).catch(e=>setError(e.message))},[gymId]);const shown=plans?.filter(p=>p.type===kind);return <Frame title="Memberships & passes"><div style={{...s.card,display:"grid",gridTemplateColumns:"1fr 1fr",padding:4}}>{[["membership","Memberships"],["day-pass","Day passes"]].map(([v,label])=><button key={v} onClick={()=>setKind(v)} style={{...s.ghost,border:0,background:kind===v?C.lime:"transparent",color:kind===v?"#070905":C.muted}}>{label}</button>)}</div>{!plans?<State loading={!error} error={error}/>:!shown.length?<State empty="No plans available."/>:shown.map(p=><section key={p._id} style={s.card}><b>{p.name}</b><p style={{color:C.muted,fontSize:12}}>{p.description}</p><p style={{color:C.lime}}>₹{p.price} · {p.durationDays} days</p><button style={s.btn} onClick={()=>nav(`/client/gyms/${gymId}/checkout`,{state:{planId:p._id}})}>Select plan</button></section>)}</Frame>}
export function GymCheckout(){const {gymId}=useParams(),nav=useNavigate(),loc=useLocation(),[quote,setQuote]=useState(),[error,setError]=useState(""),[busy,setBusy]=useState(false);useEffect(()=>{if(!loc.state?.planId)return;request(`gyms/${gymId}/membership/quote`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(loc.state)}).then(d=>setQuote(d.quote)).catch(e=>setError(e.message))},[gymId,loc.state]);const pay=async()=>{try{setBusy(true);const d=await request(`gyms/${gymId}/payment/order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(loc.state)});const payment=await openRazorpay(d);const result=await verifyPayment(`/gyms/${gymId}/payment/verify`,payment,{membershipId:d.membershipId});nav(`/client/gyms/${gymId}/success`,{state:result})}catch(e){setError(e.message)}finally{setBusy(false)}};return <Frame title="Checkout">{!quote?<State loading={!error} error={error}/>:<><section style={s.card}><b>{quote.plan.name}</b><p style={{color:C.muted,fontSize:12}}>{quote.plan.durationDays} days · prepaid</p><Rows data={quote}/></section>{error&&<p style={{color:C.red,fontSize:12}}>{error}</p>}<button style={s.btn} disabled={busy} onClick={pay}>{busy?"Opening payment…":`Pay ₹${quote.total}`}</button></>}</Frame>}
export function GymSuccess(){const {gymId}=useParams(),loc=useLocation(),nav=useNavigate();const membership=loc.state?.membership;return <Frame title="Membership activated">{membership?<section style={{...s.card,textAlign:"center",padding:28}}><CheckCircle2 size={54} color={C.lime}/><h2>You're all set</h2><p>{membership.planName}</p><p style={{color:C.muted}}>Valid until {membership.endAt?date(membership.endAt):"your pass expires"}</p><button style={s.btn} onClick={()=>nav(`/client/gyms/${gymId}/membership`,{state:{membership}})}>View membership</button></section>:<State empty="Your membership confirmation is available from My Memberships."/>}</Frame>}
export function GymMembership(){const {gymId}=useParams(),loc=useLocation(),[membership,setMembership]=useState(loc.state?.membership);useEffect(()=>{if(membership)return;request("gyms/my/memberships").then(d=>setMembership(d.memberships.find(x=>String(x.gymId)===gymId&&x.status==="active")))},[gymId,membership]);return <Frame title="Your membership">{membership?<section style={s.card}><h2>{membership.planName}</h2><p style={{color:C.lime,textTransform:"capitalize"}}>{membership.status}</p><p>Member since {date(membership.startAt)}</p><p style={{color:C.muted}}>Expires {date(membership.endAt)}</p></section>:<State empty="No active membership for this gym."/>}</Frame>}
function loadScript(){return new Promise((resolve,reject)=>{if(window.Razorpay)return resolve();const tag=document.createElement("script");tag.src="https://checkout.razorpay.com/v1/checkout.js";tag.onload=resolve;tag.onerror=()=>reject(new Error("Unable to load Razorpay checkout."));document.body.appendChild(tag)})}
async function openRazorpay(data){await loadScript();return new Promise((resolve,reject)=>{const checkout=new window.Razorpay({key:data.keyId,amount:data.order.amount,currency:data.order.currency,name:"RepUps",description:"RepUps purchase",order_id:data.order.id,handler:resolve,modal:{ondismiss:()=>reject(new Error("Payment was cancelled."))}});checkout.open()})}
async function verifyPayment(path,payment,ids){return request(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...ids,...payment})})}