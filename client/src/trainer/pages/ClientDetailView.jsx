import { useEffect, useState } from "react";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";
import { C } from "../theme";
import { Card, Avatar, Badge, SectionLabel } from "../components";

export default function ClientDetailView({ clientId, onBack }) {
  const [data, setData] = useState(null); const [error, setError] = useState("");
  useEffect(() => { if (!clientId) return; fetch(apiUrl(`trainer/clients/${clientId}`), { headers: authHeaders() }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to load client."); setData(d); }).catch(e => setError(e.message)); }, [clientId]);
  if (error) return <div><button onClick={onBack} className="trainer-btn-ghost">← Back</button><p style={{color:C.red}}>{error}</p></div>;
  if (!data) return <div style={{color:C.sub}}>Loading client profile…</div>;
  const { client, plans = [], bookings = [], assessments = [] } = data;
  return <div><button onClick={onBack} style={{background:"none",border:0,color:C.sub,cursor:"pointer",marginBottom:16}}>← Back to Clients</button><Card style={{padding:20,marginBottom:14}}><div style={{display:"flex",gap:14,alignItems:"center"}}><Avatar initials={client.name?.slice(0,2).toUpperCase()} size={56}/><div><h2 style={{margin:0,color:C.text}}>{client.name}</h2><div style={{color:C.sub,fontSize:13}}>{client.email}</div><div style={{display:"flex",gap:6,marginTop:8}}>{client.goal && <Badge>{client.goal}</Badge>}{client.fitnessLevel && <Badge color={C.blue}>{client.fitnessLevel}</Badge>}</div></div></div></Card><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}><Card style={{padding:18}}><SectionLabel>Workout Plans</SectionLabel>{plans.length ? plans.map(p=><div key={p._id} style={{color:C.text,marginBottom:8}}><b>{p.name}</b><div style={{color:C.sub,fontSize:12}}>{p.goal || "Training plan"} · {p.duration || "Flexible duration"}</div></div>) : <span style={{color:C.sub,fontSize:13}}>No plans assigned.</span>}</Card><Card style={{padding:18}}><SectionLabel>Sessions</SectionLabel>{bookings.length ? bookings.map(b=><div key={b._id} style={{color:C.sub,fontSize:13,marginBottom:7}}>{new Date(b.slotTime).toLocaleString()} — {b.status}</div>) : <span style={{color:C.sub,fontSize:13}}>No sessions yet.</span>}</Card><Card style={{padding:18}}><SectionLabel>Assessments</SectionLabel>{assessments.length ? assessments.map(a=><div key={a._id} style={{color:C.sub,fontSize:13,marginBottom:7}}>{new Date(a.createdAt).toLocaleDateString()} — score {a.overallScore ?? "—"}</div>) : <span style={{color:C.sub,fontSize:13}}>No assessments yet.</span>}</Card></div></div>;
}
