import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#0a0a0a", surface: "#111111", card: "#161616", border: "#222222",
  lime: "#C8F135", red: "#FF4444", blue: "#3B82F6", purple: "#B892FF", orange: "#FF9F43",
  muted: "#555555", text: "#EEEEEE", sub: "#888888",
};

const GOALS = ["Weight Loss", "Muscle Gain", "Posture Correction", "Strength", "Mobility", "Endurance"];

const SPECIALTY_COLOR = {
  "Weight Loss": C.orange, "Muscle Gain": C.lime, "Posture Correction": C.blue,
  "Strength": C.red, "Mobility": C.purple, "Endurance": "#4ADE80",
};

function Stars({ rating }) {
  return (
    <span style={{ color: C.orange, fontSize: 12, fontWeight: 700 }}>
      ★ {rating ? rating.toFixed(1) : "5.0"}
    </span>
  );
}

function MatchBar({ pct }) {
  const color = pct >= 70 ? C.lime : pct >= 40 ? C.orange : C.muted;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.sub, marginBottom: 3 }}>
        <span>Goal match</span>
        <span style={{ color, fontWeight: 800 }}>{pct}%</span>
      </div>
      <div style={{ background: C.border, borderRadius: 99, height: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width .3s ease" }} />
      </div>
    </div>
  );
}

const formatLocation = (loc) => {
  if (!loc) return "Nearby Studio";
  if (typeof loc === "string") return loc;
  if (typeof loc === "object" && loc.coordinates) {
    return `Coordinates: ${loc.coordinates[1].toFixed(2)}, ${loc.coordinates[0].toFixed(2)}`;
  }
  return "Nearby Studio";
};

// 📄 TrainerProfileModal placed cleanly right here in TrainerDiscovery.jsx
function TrainerProfileModal({ trainer, onClose, onMessage, onBook }) {
  if (!trainer) return null;
  const initials = trainer.name ? trainer.name.split(" ").map(n => n[0]).join("").toUpperCase() : "TR";
  const specialties = trainer.specialties || ["Strength", "Muscle Gain"];
  const displayLocation = formatLocation(trainer.gym || trainer.location);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000cc", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 150, padding: 20,
    }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${C.lime}, ${C.blue})`,
            color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Barlow Condensed',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              {trainer.name} {trainer.verified && <span style={{ fontSize: 12, color: C.blue }} title="Verified">✔</span>}
            </div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>{trainer.title || "Elite Fitness Coach"}</div>
            <div style={{ fontSize: 12, color: C.lime, marginTop: 4 }}>{trainer.distanceKm ?? 2.5} km away · {displayLocation}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: C.surface, padding: 14, borderRadius: 12, marginBottom: 16, textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase" }}>Rating</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.orange }}><Stars rating={trainer.rating} /> ({trainer.reviewsCount || 12})</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.sub, textTransform: "uppercase" }}>Hourly Rate</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.lime, fontFamily: "'Barlow Condensed',sans-serif" }}>₹{trainer.pricing?.personalTraining || 2500}</div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: C.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Specialties</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {specialties.map(g => (
            <span key={g} style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
              background: (SPECIALTY_COLOR[g] || C.muted) + "1f", color: SPECIALTY_COLOR[g] || C.sub,
              border: `1px solid ${(SPECIALTY_COLOR[g] || C.muted)}44`,
            }}>
              {g}
            </span>
          ))}
        </div>

        <div style={{ fontSize: 12, color: C.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>About Coach</div>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 24, background: C.surface, padding: 14, borderRadius: 12 }}>
          {trainer.bio || "Certified fitness expert specializing in results-driven programming, hypertrophy, and biomechanical optimization."}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onMessage} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "transparent", border: `1px solid ${C.blue}`, color: C.blue, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            💬 Message Coach
          </button>
          <button onClick={onBook} style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: C.lime, border: "none", color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
            📅 Book Session
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotPickerModal({ trainer, onClose, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const slots = trainer.slots || ["Today 5:00 PM", "Tomorrow 7:00 AM"];
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000cc", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 160, padding: 20,
    }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, width: "100%", maxWidth: 380 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, marginBottom: 4 }}>
          Book a video call
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 16 }}>
          with {trainer.name} · ₹{trainer.pricing?.personalTraining || 2500}/session
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {slots.map(s => (
            <button key={s} onClick={() => setSelected(s)} style={{
              textAlign: "left", padding: "10px 14px", borderRadius: 10,
              background: selected === s ? C.lime + "1f" : C.surface,
              border: `1px solid ${selected === s ? C.lime : C.border}`,
              color: selected === s ? C.lime : C.text, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 10, color: C.sub, marginBottom: 14, display: "flex", gap: 6, alignItems: "center" }}>
          🔒 Your phone number is never shared. The call happens in-app.
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.sub, fontWeight: 700, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            disabled={!selected}
            onClick={() => selected && onConfirm(trainer, selected)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
              background: selected ? C.lime : C.muted, color: "#000", fontWeight: 800, cursor: selected ? "pointer" : "not-allowed",
            }}>
            Confirm booking
          </button>
        </div>
      </div>
    </div>
  );
}

function TrainerCard({ trainer, matchPct, onProfileView, onMessage, onBook }) {
  const initials = trainer.name ? trainer.name.split(" ").map(n => n[0]).join("").toUpperCase() : "TR";
  const price = trainer.pricing?.personalTraining || 2500;
  const specialties = trainer.specialties || ["Strength", "Muscle Gain"];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${C.lime}, ${C.blue})`,
          color: "#000", fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{trainer.name}</span>
                {trainer.verified && <span style={{ fontSize: 10, color: C.blue }} title="Verified trainer">✔</span>}
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                <Stars rating={trainer.rating} /> · {trainer.reviewsCount || 12} reviews · <span style={{ color: C.lime, fontWeight: 700 }}>{trainer.distanceKm ?? 2.5} km away</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: C.lime, fontFamily: "'Barlow Condensed',sans-serif" }}>₹{price}</div>
              <div style={{ fontSize: 9, color: C.sub }}>per session</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
            {specialties.map(g => (
              <span key={g} style={{
                fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                background: (SPECIALTY_COLOR[g] || C.muted) + "1f", color: SPECIALTY_COLOR[g] || C.sub,
                border: `1px solid ${(SPECIALTY_COLOR[g] || C.muted)}44`,
              }}>
                {g}
              </span>
            ))}
          </div>

          {matchPct !== null && <div style={{ marginBottom: 10 }}><MatchBar pct={matchPct} /></div>}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={onProfileView} style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              View profile
            </button>
            <button onClick={onMessage} style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "transparent", border: `1px solid ${C.blue}`, color: C.blue, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Message
            </button>
            <button onClick={onBook} style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: C.lime, border: "none", color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
              Book call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrainerDiscovery() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [search, setSearch] = useState("");
  const [maxDistance, setMaxDistance] = useState(15);
  const [sortBy, setSortBy] = useState("match");
  
  const [viewingProfileTrainer, setViewingProfileTrainer] = useState(null);
  const [bookingTrainer, setBookingTrainer] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    const fetchNearbyTrainers = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { longitude, latitude } = pos.coords;
            try {
              const res = await fetch(`/api/trainers/nearby?lng=${longitude}&lat=${latitude}&maxDistanceKm=${maxDistance}`);
              const data = await res.json();
              if (data.success) {
                setTrainers(data.trainers);
              }
            } catch (err) {
              console.error("Error fetching nearby trainers:", err);
            }
          },
          () => {
            fetchDefaultTrainers();
          }
        );
      } else {
        fetchDefaultTrainers();
      }
    };

    const fetchDefaultTrainers = async () => {
      try {
        const res = await fetch(`/api/trainers/nearby?lng=72.8777&lat=19.0760&maxDistanceKm=${maxDistance}`);
        const data = await res.json();
        if (data.success) setTrainers(data.trainers);
      } catch (e) {
        console.error(e);
      }
    };

    fetchNearbyTrainers();
  }, [maxDistance]);

  const toggleGoal = (g) => setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleOpenChat = (trainer) => {
    const trainerId = trainer._id || trainer.id;
    navigate("/trainer-chat", { state: { trainerId, trainer } });
  };

  const results = useMemo(() => {
    let list = trainers.filter(t => (t.distanceKm ?? 0) <= maxDistance);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || (t.specialties && t.specialties.some(s => s.toLowerCase().includes(q))));
    }
    const withMatch = list.map(t => {
      const specs = t.specialties || [];
      const matchPct = selectedGoals.length === 0 ? null : Math.round((specs.filter(g => selectedGoals.includes(g)).length / selectedGoals.length) * 100);
      return { ...t, matchPct: matchPct || 50 };
    });
    if (selectedGoals.length > 0) {
      withMatch.sort((a, b) => b.matchPct - a.matchPct || (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else if (sortBy === "distance") {
      withMatch.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else if (sortBy === "rating") {
      withMatch.sort((a, b) => b.rating - a.rating);
    }
    return withMatch;
  }, [trainers, selectedGoals, search, maxDistance, sortBy]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Barlow','Barlow Condensed',sans-serif", paddingBottom: 40 }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, marginBottom: 4 }}>
          Find nearby trainers
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 20 }}>
          Connected via live GPS geolocation — finding expert coaches right around your corner.
        </div>

        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or specialty…"
          style={{ width: "100%", boxSizing: "border-box", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 13, outline: "none", marginBottom: 14 }}
        />

        <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Your goals</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {GOALS.map(g => (
            <button key={g} onClick={() => toggleGoal(g)} style={{
              padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: selectedGoals.includes(g) ? C.lime : C.surface,
              border: `1px solid ${selectedGoals.includes(g) ? C.lime : C.border}`,
              color: selectedGoals.includes(g) ? "#000" : C.text,
            }}>
              {g}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>Within {maxDistance} km</div>
            <input type="range" min={1} max={30} value={maxDistance} onChange={e => setMaxDistance(Number(e.target.value))} style={{ width: "100%", accentColor: C.lime }} />
          </div>
          {selectedGoals.length === 0 && (
            <div>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>Sort by</div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "7px 10px", fontSize: 12 }}>
                <option value="distance">Nearest</option>
                <option value="rating">Top rated</option>
              </select>
            </div>
          )}
        </div>

        {confirmedBooking && (
          <div style={{ background: C.lime + "14", border: `1px solid ${C.lime}55`, borderRadius: 12, padding: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12 }}>
              <strong style={{ color: C.lime }}>Booked ✓</strong> — video call with {confirmedBooking.trainer.name} on {confirmedBooking.slot}.
            </div>
            <button onClick={() => handleOpenChat(confirmedBooking.trainer)} style={{ background: "transparent", border: `1px solid ${C.lime}`, color: C.lime, borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              Open chat
            </button>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.sub, marginBottom: 10 }}>{results.length} trainer{results.length !== 1 ? "s" : ""} nearby</div>

        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: C.sub, fontSize: 12 }}>
            No trainers found within {maxDistance} km. Try expanding your radius range!
          </div>
        ) : results.map(t => (
          <TrainerCard
            key={t._id || t.id}
            trainer={t}
            matchPct={t.matchPct}
            onProfileView={() => setViewingProfileTrainer(t)}
            onMessage={() => handleOpenChat(t)}
            onBook={() => setBookingTrainer(t)}
          />
        ))}
      </div>

      {viewingProfileTrainer && (
        <TrainerProfileModal
          trainer={viewingProfileTrainer}
          onClose={() => setViewingProfileTrainer(null)}
          onMessage={() => {
            const tr = viewingProfileTrainer;
            setViewingProfileTrainer(null);
            handleOpenChat(tr);
          }}
          onBook={() => {
            const tr = viewingProfileTrainer;
            setViewingProfileTrainer(null);
            setBookingTrainer(tr);
          }}
        />
      )}

      {bookingTrainer && (
        <SlotPickerModal
          trainer={bookingTrainer}
          onClose={() => setBookingTrainer(null)}
          onConfirm={(trainer, slot) => {
            setConfirmedBooking({ trainer, slot });
            setBookingTrainer(null);
          }}
        />
      )}
    </div>
  );
}