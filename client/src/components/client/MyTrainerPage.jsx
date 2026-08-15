import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";

export default function MyTrainerPage() {
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null); const [error, setError] = useState("");
  useEffect(() => { fetch(apiUrl("client/trainer"), { headers: authHeaders() }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Request failed"); return data; }).then((data) => setTrainer(data.trainer)).catch((err) => setError(err.message)); }, []);
  if (error) return <main className="mytrainer-page"><p>{error}</p></main>;
  if (trainer === null) return <main className="mytrainer-page"><p>Loading trainer…</p></main>;
  if (!trainer) return <main className="mytrainer-page"><h2>My Trainer</h2><p>You are not connected with a trainer yet. Accept a request in Notifications to get started.</p></main>;
  const specialties = trainer.specialties || trainer.specializations || [];
  return <main className="mytrainer-page"><div className="mytrainer-content"><h2>My Trainer</h2><p>Your assigned coach</p><button className="mytrainer-card mytrainer-clickable-card" onClick={() => navigate(`/client/trainers/${trainer._id}`)}><div className="mytrainer-hero"><div className="mytrainer-avatar" style={trainer.photoUrl ? { backgroundImage: `url(${trainer.photoUrl})` } : undefined}>{!trainer.photoUrl && initials(trainer.name)}</div><div><h3>{trainer.name}</h3><p>{trainer.title || trainer.trainingStyle || "Personal Trainer"}</p><p>{trainer.gym || trainer.locationName || ""}</p></div><span className="mytrainer-card-chevron">›</span></div><p>{trainer.bio || "View your trainer's full profile, specialties, and details."}</p>{specialties.length > 0 && <div className="mytrainer-chips">{specialties.slice(0, 3).map((item) => <span key={item.name || item}>{item.name || item}</span>)}</div>}<span className="mytrainer-view-profile">View trainer profile</span></button></div></main>;
}
