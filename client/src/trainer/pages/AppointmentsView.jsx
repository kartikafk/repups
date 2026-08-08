import { useState } from "react";
import { C, useBreakpoint } from "../theme";
import { APPOINTMENTS, CLIENTS } from "../mockData";
import { Card, Avatar, StatusBadge } from "../components";

export default function AppointmentsView({ onOpenAppointment }) {
  const { isMobile } = useBreakpoint();
  const [filter, setFilter] = useState("upcoming");

  const items = APPOINTMENTS.filter(a => filter === "all" ? true : (filter === "upcoming" ? (a.date === "Today" || a.date === "Tomorrow") : a.status === filter));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, fontWeight: 800, color: C.text }}>Appointments</h2>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 3 }}>Manage your bookings</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          { ["upcoming","confirmed","pending","all"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${filter===f?C.lime:C.border}`, background: filter===f?C.limeGlow:"transparent", color: filter===f?C.lime:C.sub, cursor: "pointer" }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          )) }
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(a => {
          const clientObj = CLIENTS.find(c => c.name === a.client);
          const clientId = clientObj ? clientObj.id : null;
          return (
            <Card key={a.id} style={{ padding: "14px 16px", cursor: "pointer", border: `1px solid ${C.border}` }} onClick={() => onOpenAppointment && onOpenAppointment(clientId)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                <Avatar initials={a.avatar} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Barlow Condensed',sans-serif" }}>{a.client}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{a.type} · {a.duration}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.sub }}>{a.date} · {a.time}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ fontSize: 12, color: a.status === 'confirmed' ? C.lime : C.sub, fontWeight: 700 }}>{a.status}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{a.price ? `₹${a.price}` : ''}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
