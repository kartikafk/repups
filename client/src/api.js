export function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Automatically resolve the correct API base URL for laptop vs mobile testing
const getDynamicApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // Use Vite's /api proxy in development. This keeps HTTPS mobile previews
  // from making a blocked HTTPS-to-HTTP request, while production can provide
  // its explicit public API URL through VITE_API_URL.
  return '/api';
};

const API_URL = getDynamicApiUrl();

// Helper to securely pull active user ID from browser storage.
function getActiveUserId() {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?._id) return parsed._id;
      if (parsed?.id) return parsed.id;
    }
  } catch (e) {}

  return (
    localStorage.getItem('profileId') ||
    localStorage.getItem('userId') ||
    null
  );
}

// Throws a clear error if no user is found, but allows mobile test override if needed
function requireUserId(explicitUserId) {
  const userId = explicitUserId || getActiveUserId();
  if (!userId) {
    // Graceful fallback for unauthenticated mobile testing to prevent crashing
    if (import.meta.env.DEV) {
      console.warn('⚠️ No active user found in localStorage. Using dev fallback ID for testing.');
      return '640000000000000000000000';
    }
    throw new Error('No authenticated user found — please sign in again before saving or loading workout data.');
  }
  return userId;
}

export async function saveSession(report) {
  // Session ownership is taken from the bearer token by the server. Do not
  // require a duplicate browser-stored user object here: it may be absent
  // after a refresh even though the user is authenticated.
  const payload = { ...report };

  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to save session');
  return res.json();
}

export async function fetchSessions(query = {}) {
  const params = new URLSearchParams(query);
  const res = await fetch(`${API_URL}/sessions?${params.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function syncAssessmentRecord(payload) {
  const enrichedPayload = { ...payload };

  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(enrichedPayload)
  });
  if (!res.ok) throw new Error('Failed to sync session record');
  return res.json();
}
