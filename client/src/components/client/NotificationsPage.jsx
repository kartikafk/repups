import { useEffect, useState } from "react";
import { apiUrl } from "../../config";
import { authHeaders } from "../../api";

const request = (path, options = {}) => fetch(apiUrl(path), { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Request failed"); return data; });
const iconFor = (type) => ({ connection: "👤", booking: "📅", message: "💬", payment: "₹", review: "★" }[type] || "•");
const timeAgo = (date) => { const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000); return minutes < 1 ? "just now" : minutes < 60 ? `${minutes} min ago` : minutes < 1440 ? `${Math.floor(minutes / 60)} hr ago` : `${Math.floor(minutes / 1440)} days ago`; };
const MOCK_REQUEST = { _id: "mock-trainer-request", status: "pending", trainer: { name: "Jordan Lee" } };
const MOCK_PAYMENT = { _id: "mock-payment", title: "Payment received", body: "Your ₹999 monthly membership payment was received.", type: "payment", createdAt: new Date().toISOString(), readAt: null };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(null), [requests, setRequests] = useState(null), [error, setError] = useState(""), [marking, setMarking] = useState(false);
  const load = () => Promise.all([request("notifications"), request("client/trainer-requests")]).then(([notificationData, requestData]) => { setNotifications(notificationData.notifications || []); setRequests(requestData.requests || []); }).catch((err) => setError(err.message));
  useEffect(() => { void load(); }, []);
  const respond = (id, status) => {
    if (id === MOCK_REQUEST._id) { setRequests([]); setError(""); return; }
    request(`client/trainer-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then(load).catch((err) => setError(err.message));
  };
  const markAllRead = () => { setMarking(true); request("notifications/read-all", { method: "PATCH" }).then(load).catch((err) => setError(err.message)).finally(() => setMarking(false)); };
  const pendingRequests = requests?.length === 0 ? [MOCK_REQUEST] : requests?.filter((requestItem) => requestItem.status === "pending") || [];
  const visibleNotifications = notifications?.length === 0 ? [MOCK_PAYMENT] : notifications || [];
  const unreadCount = visibleNotifications.filter((notification) => !notification.readAt).length;
  return <main className="notif-page"><div className="notif-inner"><header className="notif-header"><div><h2>Notifications</h2><p>{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p></div>{unreadCount > 0 && <button onClick={markAllRead} disabled={marking}>{marking ? "Marking…" : "Mark all as read"}</button>}</header>{error && <p className="notif-error">{error}</p>}{pendingRequests.map((requestItem) => <section key={requestItem._id} className="notif-request-card"><b>Trainer connection request</b><p>{requestItem.trainer?.name || "A trainer"} wants to connect with you.</p><button className="notif-accept-btn" onClick={() => respond(requestItem._id, "accepted")}>Accept</button><button className="notif-reject-btn" onClick={() => respond(requestItem._id, "rejected")}>Reject</button></section>)}{!notifications ? <p className="notif-empty">Loading notifications…</p> : <div className="notif-list">{visibleNotifications.map((notification) => <article key={notification._id} className={`notif-item${!notification.readAt ? " unread" : ""}`}><span className="notif-icon">{iconFor(notification.type)}</span><div><b>{notification.title}</b><p>{notification.body}</p></div><time>{timeAgo(notification.createdAt)}</time></article>)}</div>}</div></main>;
}
