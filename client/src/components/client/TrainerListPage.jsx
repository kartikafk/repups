import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Heart, Search, SlidersHorizontal } from "lucide-react";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";
const C = { bg: "#030405", panel: "#0d1014", panel2: "#14191f", line: "#29313a", lime: "#c8ff3d", blue: "#1684ff", text: "#f6f7fb", muted: "#98a0aa" };

export default function TrainerListPage() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState(null);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("All specialties");
  const [availability, setAvailability] = useState("Any availability");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set(JSON.parse(localStorage.getItem("repups-trainer-favorites") || "[]")));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (value = "") => {
    setLoading(true); setError("");
    try {
      const response = await fetch(apiUrl(`client/trainers${value ? `?q=${encodeURIComponent(value)}` : ""}`), { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load trainers.");
      setTrainers(data.trainers || []);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { localStorage.setItem("repups-trainer-favorites", JSON.stringify([...favorites])); }, [favorites]);

  const specialties = useMemo(() => ["All specialties", ...new Set((trainers || []).flatMap((trainer) => (trainer.specializations || []).map((item) => item?.name || item).filter(Boolean)))], [trainers]);
  const visible = useMemo(() => (trainers || []).filter((trainer) => {
    const trainerSpecialties = (trainer.specializations || []).map((item) => String(item?.name || item).toLowerCase());
    const matchesSpecialty = specialty === "All specialties" || trainerSpecialties.includes(specialty.toLowerCase());
    const matchesAvailability = availability === "Any availability" || (availability === "Available now" && trainer.online === true);
    return matchesSpecialty && matchesAvailability;
  }), [trainers, specialty, availability]);

  const toggleFavorite = (id) => setFavorites((previous) => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const nav = [["Home", "/client-dashboard", "⌂"], ["Workouts", "/client/workout-plan", "♧"], ["Assess", "/posture-assessment", "⌗"], ["Coach", "/client/my-trainer", "◌"], ["Profile", "/client/profile", "♙"]];

  return <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "var(--sans, Inter, sans-serif)", paddingBottom: 78 }}>
    <main style={{ width: "min(100%,430px)", margin: "0 auto", padding: "20px 14px 28px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "6px 3px 24px" }}><h1 style={{ fontSize: 27, letterSpacing: -1.1, margin: 0 }}>Rep<span style={{ color: C.lime }}>Ups</span></h1><button aria-label="Notifications" onClick={() => navigate("/client/notifications")} style={iconButton}><Bell size={20} /></button></header>
      <h2 style={{ fontSize: 23, margin: 0 }}>Find your trainer</h2><p style={{ color: C.muted, fontSize: 13, margin: "6px 0 18px" }}>{trainers ? `${trainers.length} trainer${trainers.length === 1 ? "" : "s"} available` : "Loading trainers…"}</p>
      <div style={{ display: "flex", gap: 8 }}><label style={{ ...searchBox, flex: 1 }}><Search size={18} color={C.muted} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load(query)} placeholder="Search trainers, specialties…" style={{ background: "transparent", border: 0, outline: 0, color: C.text, fontSize: 13, minWidth: 0, flex: 1 }} /></label><button onClick={() => setShowFilters((value) => !value)} aria-label="Show filters" style={{ ...iconButton, borderColor: showFilters ? C.lime : C.line, color: showFilters ? C.lime : C.text }}><SlidersHorizontal size={18} /></button></div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}><button onClick={() => load(query)} style={primaryButton}>{loading ? "Searching…" : "Search"}</button><button onClick={() => setSpecialty("All specialties")} style={filterChip}>All trainers</button></div>
      {showFilters && <section style={{ ...card, padding: 13, marginTop: 10, display: "grid", gap: 10 }}><label style={selectLabel}>Specialization<select value={specialty} onChange={(event) => setSpecialty(event.target.value)} style={selectStyle}>{specialties.map((option) => <option key={option}>{option}</option>)}</select></label><label style={selectLabel}>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)} style={selectStyle}><option>Any availability</option><option>Available now</option></select></label><p style={{ margin: 0, color: C.muted, fontSize: 11 }}>Ratings and session availability are shown only when the trainer has provided them.</p></section>}
      {error && <p style={{ color: "#ff6d7c", fontSize: 13, marginTop: 16 }}>{error}</p>}
      <section style={{ display: "grid", gap: 12, marginTop: 18 }}>{!trainers || loading ? <p style={{ color: C.muted, textAlign: "center", padding: 30 }}>Loading trainers…</p> : visible.length === 0 ? <p style={{ color: C.muted, textAlign: "center", padding: 30 }}>No trainers match these filters.</p> : visible.map((trainer) => { const tags = (trainer.specializations || []).map((item) => item?.name || item).filter(Boolean); const favorite = favorites.has(trainer._id); return <article key={trainer._id} style={{ ...card, padding: 13, position: "relative" }}><button onClick={() => toggleFavorite(trainer._id)} aria-label={favorite ? "Remove favorite" : "Save favorite"} style={{ ...iconButton, position: "absolute", right: 11, top: 11, width: 32, height: 32, color: favorite ? "#ff6479" : C.muted, border: 0, background: "transparent" }}><Heart size={19} fill={favorite ? "currentColor" : "none"} /></button><button onClick={() => navigate(`/client/trainers/${trainer._id}`)} style={{ width: "100%", background: "transparent", border: 0, padding: 0, color: C.text, textAlign: "left", cursor: "pointer", display: "flex", gap: 13 }}><div style={{ ...trainerAvatar, ...(trainer.photoUrl ? { backgroundImage: `url(${trainer.photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}>{!trainer.photoUrl && initials(trainer.name)}</div><div style={{ flex: 1, minWidth: 0, paddingRight: 26 }}><div style={{ display: "flex", gap: 6, alignItems: "center" }}><strong style={{ fontSize: 16 }}>{trainer.name}</strong>{trainer.online === true && <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.lime }} />}</div><p style={{ color: C.muted, fontSize: 12, margin: "4px 0 8px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{trainer.title || trainer.email}</p>{tags.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{tags.slice(0, 3).map((tag) => <span key={tag} style={tagStyle}>{tag}</span>)}</div>}<div style={{ display: "flex", justifyContent: "space-between", gap: 8, color: C.muted, marginTop: 11, fontSize: 11 }}><span>{trainer.rating ? `★ ${trainer.rating} (${trainer.reviewCount || 0} reviews)` : "Rating not listed"}</span><span style={{ color: trainer.online === true ? C.lime : C.muted }}>{trainer.online === true ? "Available now" : "View profile"}</span></div></div></button></article>; })}</section>
    </main>
    <nav style={{ position: "fixed", zIndex: 100, bottom: 0, left: "50%", transform: "translateX(-50%)", display: "flex", width: "min(100%,430px)", height: 68, background: "rgba(3,4,5,.98)", borderTop: `1px solid ${C.line}` }}>{nav.map(([label, path, glyph]) => <button key={label} onClick={() => navigate(path)} style={{ flex: 1, border: 0, background: "transparent", color: label === "Coach" ? C.lime : C.muted, fontSize: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}><b style={{ fontSize: 19 }}>{glyph}</b>{label}</button>)}</nav>
  </div>;
}

const card = { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 17 };
const iconButton = { width: 40, height: 40, borderRadius: 11, border: `1px solid ${C.line}`, background: C.panel2, color: C.text, display: "grid", placeItems: "center", cursor: "pointer" };
const searchBox = { height: 44, display: "flex", gap: 9, alignItems: "center", padding: "0 12px", border: `1px solid ${C.line}`, borderRadius: 12, background: C.panel };
const primaryButton = { height: 36, padding: "0 15px", border: 0, borderRadius: 10, background: C.lime, color: "#090b0c", cursor: "pointer", fontWeight: 800, fontSize: 12 };
const filterChip = { height: 36, padding: "0 14px", border: `1px solid ${C.line}`, borderRadius: 10, background: C.panel, color: C.muted, cursor: "pointer", fontSize: 12 };
const selectLabel = { display: "grid", gap: 6, fontSize: 11, color: C.muted };
const selectStyle = { width: "100%", background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 9, color: C.text, padding: "10px 11px", fontSize: 13, outline: 0 };
const trainerAvatar = { width: 68, height: 68, flexShrink: 0, borderRadius: "50%", border: "1px solid rgba(200,255,61,.7)", background: "#172015", color: C.lime, display: "grid", placeItems: "center", fontWeight: 800 };
const tagStyle = { padding: "4px 8px", borderRadius: 999, border: "1px solid #303841", color: "#b5becb", fontSize: 10, background: "#12171c" };
