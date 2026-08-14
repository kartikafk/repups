import { useState, useEffect } from "react";
import { C, useBreakpoint } from "../theme";
import { Card, SectionLabel } from "../components";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

// ─── VIEW: PROFILE ────────────────────────────────────────────────────────────
export default function ProfileView({ trainer: initialTrainer }) {
  const { isMobile, isTablet } = useBreakpoint();
  
  const specialtiesList = ["Strength Training", "Corrective Exercise", "Hypertrophy", "Powerlifting", "Sports Performance", "Weight Loss", "Mobility", "Functional Training"];

  const [formData, setFormData] = useState({
    name: "",
    title: "Elite Strength & Conditioning Coach",
    locationName: "Mumbai, India",
    experience: "8 years",
    languages: "English, Hindi",
    trainingStyle: "Evidence-based, corrective",
    bio: "",
    specialties: [],
    pricing: {
      personalTraining: 2500,
      videoConsultation: 1500,
      workoutProgramming: 1000,
    }
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // 🔄 Watch for incoming database trainer data and sync form state
  useEffect(() => {
    if (initialTrainer) {
      setPhotoUrl(initialTrainer.photoUrl || "");
      setFormData({
        name: initialTrainer.name || "",
        title: initialTrainer.title || "Elite Strength & Conditioning Coach",
        locationName: initialTrainer.locationName || initialTrainer.location?.name || "Mumbai, India",
        experience: initialTrainer.experience || "8 years",
        languages: initialTrainer.languages || "English, Hindi",
        trainingStyle: initialTrainer.trainingStyle || "Evidence-based, corrective",
        bio: initialTrainer.bio || "",
        specialties: initialTrainer.specialties || [],
        pricing: {
          personalTraining: initialTrainer.pricing?.personalTraining || 2500,
          videoConsultation: initialTrainer.pricing?.videoConsultation || 1500,
          workoutProgramming: initialTrainer.pricing?.workoutProgramming || 1000,
        }
      });
    }
  }, [initialTrainer]);

  const toggleSpecialty = (s) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(item => item !== s)
        : [...prev.specialties, s]
    }));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("Please choose a JPG, PNG, or WEBP image under 5MB.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const body = new FormData(); body.append("photo", file);
      const res = await fetch(apiUrl("me/photo"), { method: "POST", headers: authHeaders(), body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Photo upload failed.");
      setPhotoUrl(data.photoUrl);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, photoUrl: data.photoUrl }));
      setMessage("Profile photo updated.");
    } catch (error) { setMessage(error.message); } finally { setUploadingPhoto(false); }
  };

  const handleSave = async () => {
    setMessage("");
    setSaving(true);

    let trainerId = null;
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        trainerId = parsed._id || parsed.id;
      }
    } catch (e) {}

    if (!trainerId && initialTrainer?._id) {
      trainerId = initialTrainer._id;
    }

    if (!trainerId) {
      setMessage("❌ Error: No authenticated trainer ID found.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(apiUrl(`trainers/${trainerId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("✅ Profile saved successfully!");
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...storedUser, ...data.trainer }));
      } else {
        setMessage(`❌ ${data.error || "Failed to update profile."}`);
      }
    } catch (err) {
      console.error("Save profile network error:", err);
      setMessage("❌ Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const initials = formData.name ? formData.name.split(" ").map(n => n[0]).join("").toUpperCase() : "CM";

  const certs = [
    { name: "CSCS — Certified Strength & Conditioning Specialist", org: "NSCA", status: "verified", expiry: "Dec 2026" },
    { name: "FMS Level 2 — Functional Movement Screen", org: "FMS", status: "verified", expiry: "Mar 2027" },
    { name: "Precision Nutrition Level 1", org: "Precision", status: "pending", expiry: "N/A" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 340px", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {message && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: message.includes("✅") ? "#c8ff0015" : "#ff3c5a15", color: message.includes("✅") ? C.lime : C.red, border: `1px solid ${message.includes("✅") ? C.lime : C.red}40`, fontSize: 13, fontWeight: 600 }}>
            {message}
          </div>
        )}

        <Card style={{ padding: 24 }}>
          <SectionLabel>Basic Information</SectionLabel>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: photoUrl ? `center/cover no-repeat url(${photoUrl})` : C.limeGlow, border: `2px solid ${C.lime}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 800, color: C.lime, flexShrink: 0 }}>
              {!photoUrl && initials}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ color: C.lime, fontSize: 12, cursor: "pointer" }}>{uploadingPhoto ? "Uploading photo…" : "Change profile photo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={uploadingPhoto} style={{ display: "none" }} /></label>
              <input 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Full Name"
                style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 800, padding: "10px 14px", outline: "none" }} 
              />
              <input 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                placeholder="Professional Title"
                style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "9px 14px", outline: "none" }} 
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 5, textTransform: "uppercase" }}>Location</div>
              <input value={formData.locationName} onChange={e => setFormData({ ...formData, locationName: e.target.value })} style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "9px 12px", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 5, textTransform: "uppercase" }}>Experience</div>
              <input value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "9px 12px", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 5, textTransform: "uppercase" }}>Languages</div>
              <input value={formData.languages} onChange={e => setFormData({ ...formData, languages: e.target.value })} style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "9px 12px", outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 5, textTransform: "uppercase" }}>Training Style</div>
              <input value={formData.trainingStyle} onChange={e => setFormData({ ...formData, trainingStyle: e.target.value })} style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "9px 12px", outline: "none" }} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: C.sub, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 5, textTransform: "uppercase" }}>Bio</div>
            <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell clients about your philosophy..." style={{ width: "100%", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "inherit", fontSize: 13, padding: "9px 12px", outline: "none", resize: "vertical", minHeight: 80 }} />
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionLabel>Specializations</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {specialtiesList.map(s => {
              const active = formData.specialties.includes(s);
              return (
                <button 
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${active ? `${C.lime}44` : C.border}`, background: active ? C.limeGlow : C.card2, color: active ? C.lime : C.sub, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: active ? 600 : 400 }}>
                  {s}
                </button>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionLabel>Services & Pricing (₹)</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.card2, borderRadius: 10, border: `1px solid ${C.border2}` }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: C.lime, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: C.text }}>Personal Training (1hr)</span>
              <input 
                type="number"
                value={formData.pricing.personalTraining} 
                onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, personalTraining: Number(e.target.value) } })}
                style={{ width: 130, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.lime, fontFamily: "monospace", fontSize: 12, padding: "5px 9px", outline: "none", textAlign: "right" }} 
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.card2, borderRadius: 10, border: `1px solid ${C.border2}` }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: C.lime, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, color: C.text }}>Video Consultation (45min)</span>
              <input 
                type="number"
                value={formData.pricing.videoConsultation} 
                onChange={e => setFormData({ ...formData, pricing: { ...formData.pricing, videoConsultation: Number(e.target.value) } })}
                style={{ width: 130, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.lime, fontFamily: "monospace", fontSize: 12, padding: "5px 9px", outline: "none", textAlign: "right" }} 
              />
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card style={{ padding: 20 }}>
          <SectionLabel>Certifications</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {certs.map((cert, i) => {
              const statusMap = { verified: [C.lime, "✓ Verified"], pending: [C.gold, "⏳ Pending"] };
              const [col, lbl] = statusMap[cert.status] || [C.sub, cert.status];
              return (
                <div key={i} style={{ padding: "12px 14px", background: C.card2, borderRadius: 10, border: `1px solid ${C.border2}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{cert.name}</span>
                    <span className="trainer-badge" style={{ "--accent": col }}>{lbl}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.sub }}>{cert.org} · Expires {cert.expiry}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionLabel>Availability</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 14 }}>
            {["M","T","W","T","F","S","S"].map((d, i) => {
              const available = [0, 1, 2, 4].includes(i);
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ height: 36, borderRadius: 8, background: available ? C.limeGlow : C.card2, border: `1px solid ${available ? `${C.lime}40` : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                    {available && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.lime }} />}
                  </div>
                  <div style={{ fontSize: 10, color: available ? C.lime : C.muted }}>{d}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <button onClick={handleSave} disabled={saving} className="trainer-btn-primary" style={{ width: "100%", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving Profile..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
