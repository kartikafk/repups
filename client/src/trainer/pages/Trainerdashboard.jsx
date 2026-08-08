@@
-import { Avatar, Sidebar } from "../components";
-
-import DashboardView from "./DashboardView";
-import ClientsView from "./ClientsView";
-import ClientDetailView from "./ClientDetailView";
-import AppointmentsView from "./AppointmentsView";
-import CalendarView from "./CalendarView";
-import MessagesView from "./MessagesView";
-import NotificationsView from "./NotificationsView";
-import QnAView from "./QnAView";
-import PlansView from "./PlansView";
-import ProgramBuilderView from "./ProgramBuilderView";
-import AssessmentsView from "./AssessmentsView";
-import ReviewsView from "./ReviewsView";
-import EarningsView from "./EarningsView";
-import BillingView from "./BillingView";
-import ProfileView from "./ProfileView";
-import SettingsView from "./SettingsView";
-import HelpView from "./HelpView";
+import { Avatar, Sidebar } from "../components";
+
+import DashboardView from "./DashboardView";
+import ClientDetailView from "./ClientDetailView";
+import AppointmentsView from "./AppointmentsView";
+import CalendarView from "./CalendarView";
+import ReviewsView from "./ReviewsView";
+import EarningsView from "./EarningsView";
+import BillingView from "./BillingView";
+import ProfileView from "./ProfileView";
+import SettingsView from "./SettingsView";
+import HelpView from "./HelpView";
@@
-import ActiveClientProfile from "./ActiveClientProfile";
-import ClientRequestProfile from "./ClientRequestProfile";
+import ActiveClientProfile from "./ActiveClientProfile";
+import ClientRequestProfile from "./ClientRequestProfile";
@@
-  const [view, setView] = useState("dashboard");
-  const [clientId, setClientId] = useState(null);
+  const [view, setView] = useState("dashboard");
+  const [clientId, setClientId] = useState(null);
+  const [prospectiveClientId, setProspectiveClientId] = useState(null);
@@
-  function openClient(id) { setClientId(id); setView("clientDetail"); }
-  function navigateTo(id) { setView(id); }
+  function openClient(id) { setClientId(id); setView("clientDetail"); }
+  function navigateTo(id, payload) {
+    // allow passing a payload (eg. client id) for certain views
+    if (id === "prospective") {
+      setProspectiveClientId(payload || null);
+    }
+    setView(id);
+  }
@@
-    clients:      <ClientsView onOpenClient={openClient} />,
-    clientDetail: <ClientDetailView clientId={clientId} onBack={() => setView("clients")} />,
+    clientDetail: <ClientDetailView clientId={clientId} onBack={() => setView("dashboard")} />,
@@
-    existing:     <ActiveClientProfile onNavigate={navigateTo} />,
-    prospective:  <ClientRequestProfile onNavigate={navigateTo} />,
-    appointments: <AppointmentsView />,
-    calendar:     <CalendarView />,
-    messages:     <MessagesView />,
-    notifications:<NotificationsView />,
-    qna:          <QnAView />,
-    plans:        <PlansView onNav={navigateTo} />,
-    planBuilder:  <ProgramBuilderView onNav={navigateTo} />,
-    assessments:  <AssessmentsView />,
+    existing:     <ActiveClientProfile onNavigate={navigateTo} />,
+    prospective:  <ClientRequestProfile clientId={prospectiveClientId} onNavigate={navigateTo} />,
+    appointments: <AppointmentsView />,
+    calendar:     <CalendarView />,
@@
-    reviews:      <ReviewsView />,
+    reviews:      <ReviewsView />,
     earnings:     <EarningsView />,
     billing:      <BillingView />,
     profile:      <ProfileView trainer={trainerData} />, // 👈 Pass live trainer data prop here
     settings:     <SettingsView />,
     help:         <HelpView />,
   };
@@
-  const unreadNotifs = NOTIFICATIONS.filter(n => n.unread).length;
+  // notifications removed from nav — keep unread count for the topbar bell display
+  const unreadNotifs = (typeof NOTIFICATIONS !== "undefined" ? NOTIFICATIONS.filter(n => n.unread).length : 0);
@@
-        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
-          {!isMobile && (
-            <div className="trainer-topbar-status">
-              <div className="trainer-topbar-dot" style={{ "--accent": C.lime }} />
-              <span>Online</span>
-            </div>
-          )}
-          <Avatar initials={initials} size={32} />
-          <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="trainer-menu-btn">
-            <span /><span /><span />
-            {unreadNotifs > 0 && (
-              <span className="trainer-menu-badge">{unreadNotifs}</span>
-            )}
-          </button>
-        </div>
+        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
+          {!isMobile && (
+            <div className="trainer-topbar-status">
+              <div className="trainer-topbar-dot" style={{ "--accent": C.lime }} />
+              <span>Online</span>
+            </div>
+          )}
+          <Avatar initials={initials} size={32} />
+          {/* Bell icon for notifications (no dedicated notifications page) */}
+          <button aria-label="Notifications" className="trainer-topbar-bell" style={{ background:"transparent", border:"none", cursor:"pointer", fontSize:18 }}>{unreadNotifs>0?`🔔 ${unreadNotifs}`:"🔔"}</button>
+          <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="trainer-menu-btn">
+            <span /><span /><span />
+          </button>
+        </div>
