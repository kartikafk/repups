import { useState, useEffect } from "react";
import { C, useBreakpoint } from "../theme";
import { NOTIFICATIONS, NAV_ITEMS } from "../mockData";
import { Avatar, Sidebar } from "../components";

import DashboardView from "./DashboardView";
import ClientsView from "./ClientsView";
import ClientDetailView from "./ClientDetailView";
import AppointmentsView from "./AppointmentsView";
import CalendarView from "./CalendarView";
import MessagesView from "./MessagesView";
import NotificationsView from "./NotificationsView";
import QnAView from "./QnAView";
import PlansView from "./PlansView";
import ProgramBuilderView from "./ProgramBuilderView";
import AssessmentsView from "./AssessmentsView";
import ReviewsView from "./ReviewsView";
import EarningsView from "./EarningsView";
import BillingView from "./BillingView";
import ProfileView from "./ProfileView";
import SettingsView from "./SettingsView";
import HelpView from "./HelpView";

// New client-profile pages — same folder as this file. Each renders its
// own "🟢 Active Clients" / "🟠 Client Requests" nav buttons in its
// header, which call the onNavigate prop passed below (navigateTo).
import ActiveClientProfile from "./ActiveClientProfile";
import ClientRequestProfile from "./ClientRequestProfile";

export default function TrainerDashboard() {
  const [view, setView] = useState("dashboard");
  const [clientId, setClientId] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const { isMobile } = useBreakpoint();

  // State for live trainer profile from backend database
  const [trainerData, setTrainerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let trainerId = null;
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        trainerId = parsed._id || parsed.id;
      }
    } catch (err) {
      console.error("Error reading stored user from localStorage", err);
    }

    if (!trainerId) {
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5001/api/trainers/${trainerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.trainer) {
          setTrainerData(data.trainer);
        }
      })
      .catch((err) => console.error("Failed to fetch trainer profile:", err))
      .finally(() => setLoading(false));
  }, []);

  function openClient(id) { setClientId(id); setView("clientDetail"); }
  function navigateTo(id) { setView(id); }

  const viewMap = {
    dashboard:    <DashboardView onNav={navigateTo} trainer={trainerData} />,
    clients:      <ClientsView onOpenClient={openClient} />,
    clientDetail: <ClientDetailView clientId={clientId} onBack={() => setView("clients")} />,
    // "existing" and "prospective" match the exact strings each page's own
    // nav buttons call onNavigate with — so clicking either button on
    // either page routes straight through navigateTo, no extra wiring.
    existing:     <ActiveClientProfile onNavigate={navigateTo} />,
    prospective:  <ClientRequestProfile onNavigate={navigateTo} />,
    appointments: <AppointmentsView />,
    calendar:     <CalendarView trainerId={trainerData?._id} />,
    messages:     <MessagesView />,
    notifications:<NotificationsView />,
    qna:          <QnAView />,
    plans:        <PlansView onNav={navigateTo} />,
    planBuilder:  <ProgramBuilderView onNav={navigateTo} />,
    assessments:  <AssessmentsView />,
    reviews:      <ReviewsView />,
    earnings:     <EarningsView />,
    billing:      <BillingView />,
    profile:      <ProfileView trainer={trainerData} />, // 👈 Pass live trainer data prop here
    settings:     <SettingsView />,
    help:         <HelpView />,
  };

  const activeLabel = NAV_ITEMS.find(n => n.id === view)?.label
    || (view === "clientDetail" ? "Client Profile"
    : view === "planBuilder" ? "Program Builder"
    : view === "existing" ? "Active Client"
    : view === "prospective" ? "Client Request"
    : "");
  const unreadNotifs = NOTIFICATIONS.filter(n => n.unread).length;

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: C.text, fontFamily: "'Barlow', sans-serif" }}>
        Loading Trainer Portal...
      </div>
    );
  }

  const currentTrainer = trainerData || { name: "Coach" };
  const initials = currentTrainer.name ? currentTrainer.name.split(" ").map(n => n[0]).join("").toUpperCase() : "CM";

  return (
    <div className="trainer-shell">
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap" rel="stylesheet"/>

      {/* Top bar */}
      <div className="trainer-topbar">
        <div className="trainer-topbar-brand">
          <div className="trainer-topbar-logo" style={{ "--accent": C.lime }}>💪</div>
          <div>
            <div className="trainer-topbar-title">Rep<span style={{ color:C.lime }}>Ups</span></div>
            {!isMobile && <div className="trainer-topbar-subtitle">{activeLabel || "Trainer Portal"}</div>}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {!isMobile && (
            <div className="trainer-topbar-status">
              <div className="trainer-topbar-dot" style={{ "--accent": C.lime }} />
              <span>Online</span>
            </div>
          )}
          <Avatar initials={initials} size={32} />
          <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="trainer-menu-btn">
            <span /><span /><span />
            {unreadNotifs > 0 && (
              <span className="trainer-menu-badge">{unreadNotifs}</span>
            )}
          </button>
        </div>
      </div>

      <Sidebar active={view} onChange={navigateTo} open={navOpen} onClose={() => setNavOpen(false)} />

      <main className="trainer-main">
        {viewMap[view] || <div style={{ color:C.sub }}>Coming soon</div>}
      </main>
    </div>
  );
}
