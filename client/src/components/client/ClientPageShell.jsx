import { useEffect, useState } from "react";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

export default function ClientPageShell({ title, children }) {
  const [name, setName] = useState("");
  useEffect(() => { fetch(apiUrl("me"), { headers: authHeaders() }).then((response) => response.json()).then((data) => setName(data.user?.name || "")).catch(() => {}); }, []);
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";
  return <div className="client-shell"><header className="client-topbar"><div className="client-topbar-brand"><div className="client-topbar-logo">💪</div><div><div className="client-topbar-title">Rep<span>Ups</span></div><div className="client-topbar-subtitle">{title}</div></div></div><div className="client-topbar-right"><span className="client-topbar-status"><i />Online</span><div className="client-topbar-avatar">{initials}</div><button className="client-topbar-menu-btn" aria-label="Menu"><span /><span /><span /></button></div></header><main className="client-main">{children}</main></div>;
}
