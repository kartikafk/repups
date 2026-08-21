import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Home, MapPinned, Search, Users } from "lucide-react";

const C = { bg: "#050708", border: "#252C31", lime: "#C8FF3D" };

const styles = {
  bottomNav: {
    position: "fixed",
    zIndex: 1000,
    left: "50%",
    bottom: 0,
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 430,
    height: "calc(74px + env(safe-area-inset-bottom, 0px))",
    padding: "8px 5px calc(10px + env(safe-area-inset-bottom, 0px))",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    background: "rgba(5,7,8,.98)",
    borderTop: `1px solid ${C.border}`,
    boxSizing: "border-box",
  },
  navButton: {
    border: 0,
    background: "transparent",
    color: "#8A9298",
    minWidth: 0,
    padding: "2px 1px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
  },
  navActive: { color: C.lime },
  navLabel: { fontSize: 7.5, lineHeight: 1.05, textAlign: "center", whiteSpace: "normal", maxWidth: 70 },
};

export default function AppBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navItems = [
    { label: "Home", path: "/dashboard", icon: <Home size={20} strokeWidth={2.4} /> },
    { label: "Community", path: "/community", icon: <Users size={20} strokeWidth={2} /> },
    { label: "Events & Gyms", path: "/client/events-gyms", icon: <MapPinned size={20} strokeWidth={2} /> },
    { label: "Coach", path: "/ai-coach", icon: <Bot size={20} strokeWidth={2} /> },
    { label: "Find Trainer", path: "/client/trainers", icon: <Search size={20} strokeWidth={2.2} /> },
  ].map((item) => ({
    ...item,
    active: item.path === "/community" ? pathname.startsWith(item.path) : item.path === "/ai-coach" ? pathname.startsWith(item.path) : pathname === item.path,
  }));

  return (
    <nav className="app-bottom-nav" style={styles.bottomNav} aria-label="Client navigation">
      {navItems.map((item) => (
        <button
          key={item.label}
          type="button"
          style={{ ...styles.navButton, ...(item.active ? styles.navActive : {}) }}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span style={styles.navLabel}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
