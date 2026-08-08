import { useState, useEffect } from "react";
import { C, useBreakpoint } from "../../trainer/theme";
import { Card } from "../../trainer/components";
import { useLocation } from "react-router-dom";

export default function BookSessionView({ trainerId: propTrainerId, onBooked, initialDate }) {
  const { isMobile } = useBreakpoint();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const trainerId = propTrainerId || params.get("trainerId");

  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  useEffect(() => {
    if (!trainerId) return;
    let mounted = true;
    async function loadSlots() {
      setLoading(true);
      try {
        const res = await fetch(`/api/trainers/${trainerId}/slots`, { headers: { "Content-Type":"application/json" }});
        const data = await res.json();
        if (mounted && data.success) setSlots(data.slots || []);
      } catch (err) {
        console.error("Failed to load slots", err);
      } finally { if (mounted) setLoading(false); }
    }
    loadSlots();
    return () => { mounted = false; };
  }, [trainerId]);

  const filtered = slots.filter(s => {
    const d = new Date(s.slotTime);
    return d.toISOString().split("T")[0] === selectedDate;
  });

  const confirmBooking = async () => {
    if (!selectedSlotId) return alert("Select a slot");
    try {
      const token = localStorage.getItem("token");
      const me = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          trainerId,
          clientId: me._id || me.id || me.email || "client",
          clientName: me.name || "Client",
          slotId: selectedSlotId
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onBooked) onBooked(data.booking);
        alert("Booking confirmed");
      } else {
        alert(data.error || "Failed to book. It may have been taken.");
      }
    } catch (err) {
      console.error("Booking error", err);
      alert("Server error while booking.");
    }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800, color:C.text }}>Book a Session</h2>
          <p style={{ fontSize:13, color:C.sub }}>Select a date and slot</p>
        </div>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </div>

      <Card style={{ padding:16 }}>
        {loading ? <div style={{ color:C.sub }}>Loading slots...</div> : (
          filtered.length === 0 ? <div style={{ color:C.sub }}>No available slots for selected day.</div> : (
            filtered.map(s => (
              <div key={s._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px", borderRadius:8, border: `1px solid ${selectedSlotId===s._id?C.lime:C.border}`, background:selectedSlotId===s._id?C.limeGlow:C.card2, marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, color:C.text }}>{new Date(s.slotTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  <div style={{ fontSize:12, color:C.sub }}>{s.isBooked ? "Booked" : "Available"}</div>
                </div>
                <div>
                  <button disabled={s.isBooked} onClick={()=>setSelectedSlotId(s._id)} style={{ padding:"8px 10px", borderRadius:8, background:selectedSlotId===s._id?C.lime:"transparent", border:`1px solid ${C.border}`, color: selectedSlotId===s._id? "#000": C.sub }}>
                    {selectedSlotId===s._id ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            ))
          )
        )}
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <button onClick={confirmBooking} disabled={!selectedSlotId} style={{ flex:1, padding:"10px 12px", borderRadius:8, background:C.lime, color:"#000", fontWeight:800 }}>Confirm booking</button>
        </div>
      </Card>
    </div>
  );
}
