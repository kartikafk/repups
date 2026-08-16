import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

export default function ClientPageShell({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  useEffect(() => { fetch(apiUrl("me"), { headers: authHeaders() }).then((response) => response.json()).then((data) => setName(data.user?.name || "")).catch(() => {}); }, []);
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";
  const navItems = [["/dashboard", "⌂", "Home"], ["/session", "⌁", "Workout"], ["/posture-assessment", "◎", "Assess"], ["/ai-coach", "✦", "Coach"], ["/client/profile", "◉", "Profile"]];
  return <div className="client-shell client-app-shell"><header className="client-topbar"><div className="client-topbar-brand"><div className="client-topbar-logo">↟</div><div><div className="client-topbar-title">Rep<span>Ups</span></div><div className="client-topbar-subtitle">{title}</div></div></div><div className="client-topbar-right"><span className="client-topbar-status"><i />Online</span><button className="client-topbar-avatar" onClick={() => navigate("/client/profile")} aria-label="Open profile">{initials}</button></div></header><main className="client-main">{children}</main><nav className="client-bottom-nav" aria-label="Client navigation">{navItems.map(([path, icon, label]) => <button key={path} className={location.pathname === path ? "active" : ""} onClick={() => navigate(path)}><span>{icon}</span><small>{label}</small></button>)}</nav></div>;
}
