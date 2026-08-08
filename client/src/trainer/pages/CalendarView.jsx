import { useState, useEffect } from "react";
import { C, useBreakpoint } from "../theme";
import { Card, SectionLabel } from "../components";

function formatDateISO(d) { return d.toISOString().split("T")[0]; }
function timeLabel(dt) { return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

export default function CalendarView({ trainerId }) {
  const { isMobile, isTablet } = useBreakpoint();
  const [currentDate, setCurrentDate] = useState(formatDateISO(new Date()));
  const [slots, setSlots] = useState([]); // array of { slot, isBooked, booking }
  const [loading, setLoading] = useState(false);
  const [publishingTimes, setPublishingTimes] = useState([]);

  useEffect(() => {
    if (!trainerId) return;
    let mounted = true;
    async function fetchDay() {
      setLoading(true);
      try {
        const res = await fetch(`/api/trainers/${trainerId}/slots/day?date=${currentDate}`, {
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (mounted && data.success) {
          setSlots(data.slots || []);
        } else if (mounted) {
          setSlots([]);
        }
      } catch (err) {
        console.error("Failed to load day slots:", err);
        if (mounted) setSlots([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDay();
    return () => { mounted = false; };
  }, [trainerId, currentDate]);

  const publishAvailability = async () => {
    if (!trainerId || publishingTimes.length === 0) return;
    try {
      const res = await fetch(`/api/trainers/${trainerId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotTimes: publishingTimes })
      });
      const data = await res.json();
      if (data.success) {
        setPublishingTimes([]);
        // Simple refresh
        const res2 = await fetch(`/api/trainers/${trainerId}/slots/day?date=${currentDate}`);
        const d2 = await res2.json();
        if (d2.success) setSlots(d2.slots || []);
      } else {
        alert(data.error || "Failed to publish slots");
      }
    } catch (err) {
      console.error("Publish slots error:", err);
      alert("Server error while publishing availability.");
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!bookingId) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        setSlots(prev => prev.map(s => {
          if (s.booking && String(s.booking._id) === String(bookingId)) {
            return { ...s, booking: { ...s.booking, status: "cancelled" }, isBooked: false };
          }
          return s;
        }));
      } else {
        alert(data.error || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Cancel booking error:", err);
      alert("Server error while cancelling booking.");
    }
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 320px", gap:18 }}>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <h2 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:800, color:C.text }}>Calendar</h2>
            <p style={{ fontSize:13, color:C.sub, marginTop:3 }}>{currentDate}</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input type="date" value={currentDate} onChange={(e)=>setCurrentDate(e.target.value)} style={{ padding:8, borderRadius:8, border:`1px solid ${C.border}`, background:C.card }} />
          </div>
        </div>

        <Card style={{ padding: 20 }}>
          <SectionLabel>Slots for {currentDate}</SectionLabel>
          {loading ? <div style={{ color:C.sub }}>Loading...</div> : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {slots.length === 0 && <div style={{ color:C.sub }}>No slots published for this day.</div>}
              {slots.map(({ slot, isBooked, booking }) => (
                <div key={slot._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"10px 12px", background: C.card2, borderRadius: 10, border: `1px solid ${isBooked ? C.border2 : C.border}` }}>
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <div style={{ fontWeight:700, color:C.text }}>{timeLabel(slot.slotTime)}</div>
                    <div style={{ fontSize:12, color:C.sub }}>{isBooked ? "Booked" : "Open"}</div>
                    {booking && (
                      <div style={{ fontSize:12, color: booking.status === 'cancelled' ? C.muted : (booking.status==='live'?C.lime:C.gold), marginLeft: 6 }}>
                        {booking.status} {booking.clientId ? `· ${booking.clientId}` : ""}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {booking && (booking.status === "scheduled" || booking.status === "live") && (
                      <button onClick={() => cancelBooking(booking._id)} style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.sub }}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div>
        <Card style={{ padding:20 }}>
          <SectionLabel>Publish availability</SectionLabel>
          <p style={{ fontSize:12, color:C.sub, marginBottom:12 }}>Add times (ISO datetime) to publish slots for this trainer.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <input type="datetime-local" value={publishingTimes[0]||""} onChange={(e)=>setPublishingTimes([e.target.value])} style={{ padding:8, borderRadius:8, border:`1px solid ${C.border}`, background:C.card2 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={publishAvailability} style={{ flex:1, padding:"10px 12px", borderRadius:8, background:C.lime, color:"#000", fontWeight:800 }}>Publish</button>
              <button onClick={()=>setPublishingTimes([])} style={{ padding:"10px 12px", borderRadius:8, background:"transparent", border:`1px solid ${C.border}`, color:C.sub }}>Clear</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
