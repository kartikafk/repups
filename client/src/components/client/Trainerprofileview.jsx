import { useState, useEffect } from "react";

const C = {
  bg: "#0a0a0a", surface: "#111111", card: "#161616", card2: "#1a1a1a", border: "#222222",
  lime: "#C8F135", limeGlow: "rgba(200,241,53,0.12)",
  red: "#FF4444", blue: "#3B82F6", purple: "#B892FF", orange: "#FF9F43",
  muted: "#555555", text: "#EEEEEE", sub: "#888888",
};

// Small ring-badge — echoes the circular progress rings already used on the
// trainer dashboard (streak / avg rating / sessions today), so this reads
// as the same product rather than a bolted-on template.
function RatingRing({ value, size = 74 }) {
  const pct = Math.min(value / 5, 1);
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={C.lime} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: size * 0.28, color: C.text, lineHeight: 1 }}>
          {value.toFixed(1)}
        </div>
        <div style={{ fontSize: size * 0.1, color: C.lime, letterSpacing: 1 }}>★★★★★</div>
      </div>
    </div>
  );
}

function Tag({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0" }}>
      <span style={{ width: 22, textAlign: "center", fontSize: 13, color: C.sub }}>{icon}</span>
      <span style={{ fontSize: 13, color: C.text }}>{label}</span>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div style={{ padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: C.card2,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: C.sub,
          }}>
            {review.initials}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{review.name}</span>
        </div>
        <span style={{ fontSize: 11, color: C.lime }}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
      </div>
      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{review.text}</div>
    </div>
  );
}

export default function TrainerProfileView({ trainerId, onBack, onMessage, onScheduleCall }) {
  const [trainer, setTrainer] = useState(null);
  const [similarTrainers, setSimilarTrainers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!trainerId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5001/api/trainers/${trainerId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!cancelled && data.success) setTrainer(data.trainer);
      } catch (err) {
        console.error("❌ Failed to fetch trainer profile:", err);
      }

      // Optional endpoints — profile still renders fine if these 404 or
      // aren't built yet, they just show empty states instead.
      try {
        const revRes = await fetch(`http://localhost:5001/api/trainers/${trainerId}/reviews`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const revData = await revRes.json();
        if (!cancelled && revData.success) setReviews(revData.reviews || []);
      } catch {
        /* no reviews endpoint yet — empty state handles it */
      }

      try {
        const simRes = await fetch(`http://localhost:5001/api/trainers?exclude=${trainerId}&limit=4`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const simData = await simRes.json();
        if (!cancelled && simData.success) setSimilarTrainers(simData.trainers || []);
      } catch {
        /* optional — section hides itself if empty */
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [trainerId, token]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.sub, fontFamily: "'Barlow',sans-serif" }}>
        Loading trainer profile…
      </div>
    );
  }

  if (!trainer) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: C.sub, fontFamily: "'Barlow',sans-serif" }}>
        <div style={{ fontSize: 14 }}>Couldn't load this trainer's profile.</div>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12 }}>
          ← Go back
        </button>
      </div>
    );
  }

  const initials = trainer.name ? trainer.name.split(" ").map(n => n[0]).join("").toUpperCase() : "TC";
  const rating = typeof trainer.rating === "number" ? trainer.rating : 5.0;
  const reviewCount = trainer.reviewCount ?? reviews.length;
  const specialties = trainer.specialties?.length ? trainer.specialties : ["General Fitness"];
  const bio = trainer.bio || "This trainer hasn't added a bio yet.";
  const bioIsLong = bio.length > 220;
  const displayedBio = expanded || !bioIsLong ? bio : bio.slice(0, 220) + "…";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Barlow',sans-serif", paddingBottom: 90 }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack} aria-label="Back" style={{ background: "none", border: "none", color: C.text, fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 16 }}>Trainer Profile</span>
        </div>
        <button aria-label="Share" style={{ background: "none", border: "none", color: C.sub, fontSize: 16, cursor: "pointer" }}>⤴</button>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>

        {/* Hero card */}
        <div style={{ position: "relative", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.lime}, ${C.blue})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#000", fontWeight: 900, fontSize: 22,
            }}>
              {initials}
            </div>
            <span style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: C.lime, border: `2px solid ${C.card}` }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 19 }}>{trainer.name}</span>
              {trainer.verified !== false && (
                <span title="Verified trainer" style={{ color: C.blue, fontSize: 14 }}>✔</span>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <Tag icon="🏋️" label={specialties.join(" · ")} />
              {trainer.experience && <Tag icon="⏱" label={`${trainer.experience} of coaching`} />}
              {trainer.gym && <Tag icon="📍" label={trainer.gym} />}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <button style={{ background: C.lime, border: "none", color: "#000", fontWeight: 800, fontSize: 12, borderRadius: 8, padding: "6px 16px", cursor: "pointer" }}>
                Follow
              </button>
              <span style={{ fontSize: 12, color: C.sub }}>{trainer.followers ?? 0} followers</span>
            </div>
          </div>

          {/* Signature rating badge — floats over the card edge, like the
              stat rings on the dashboard */}
          <div style={{ position: "absolute", top: -14, right: 16 }}>
            <div style={{ background: C.bg, borderRadius: "50%", padding: 4 }}>
              <RatingRing value={rating} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "14px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <span style={{ fontSize: 12, color: C.sub, flex: 1 }}>Session rate</span>
          {trainer.discountedRate && (
            <span style={{ fontSize: 13, color: C.muted, textDecoration: "line-through" }}>₹{trainer.rate}</span>
          )}
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, color: C.lime }}>
            ₹{trainer.discountedRate || trainer.rate || "—"}<span style={{ fontSize: 11, color: C.sub, fontWeight: 400 }}>/session</span>
          </span>
        </div>

        {/* About */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, color: C.lime, letterSpacing: 0.5 }}>ABOUT THE TRAINER</span>
          </div>
          <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, margin: 0 }}>{displayedBio}</p>
          {bioIsLong && (
            <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", color: C.lime, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "8px 0 0" }}>
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Ratings & reviews */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15 }}>Ratings and reviews</span>
            <span style={{ fontSize: 12, color: C.sub }}>({reviewCount})</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Only verified session ratings count toward the score.</div>
          {reviews.length === 0 ? (
            <div style={{ padding: "20px 0", color: C.sub, fontSize: 12 }}>No reviews yet — be the first client to leave one after a session.</div>
          ) : (
            reviews.map((r, i) => <ReviewCard key={i} review={r} />)
          )}
        </div>

        {/* Similar trainers */}
        {similarTrainers.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, marginBottom: 12 }}>See similar trainers</div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
              {similarTrainers.map(t => {
                const tInitials = t.name ? t.name.split(" ").map(n => n[0]).join("").toUpperCase() : "TC";
                return (
                  <div key={t._id} style={{ flexShrink: 0, width: 64, textAlign: "center" }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%", margin: "0 auto",
                      background: `linear-gradient(135deg, ${C.purple}, ${C.blue})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#000", fontWeight: 800, fontSize: 15,
                      border: `2px solid ${C.border}`,
                    }}>
                      {tInitials}
                    </div>
                    <div style={{ fontSize: 10, color: C.sub, marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating action bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        display: "flex", gap: 10, padding: "14px 16px",
        background: C.bg, borderTop: `1px solid ${C.border}`,
      }}>
        <button onClick={onMessage} style={{
          flex: 1, background: "transparent", border: `1px solid ${C.lime}`, color: C.lime,
          borderRadius: 10, padding: "12px 0", fontWeight: 800, fontSize: 13, cursor: "pointer",
        }}>
          💬 Message
        </button>
        <button onClick={onScheduleCall} style={{
          flex: 1, background: C.lime, border: "none", color: "#000",
          borderRadius: 10, padding: "12px 0", fontWeight: 800, fontSize: 13, cursor: "pointer",
        }}>
          🎥 Schedule call
        </button>
      </div>
    </div>
  );
}