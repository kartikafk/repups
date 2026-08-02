// Automatically resolve the correct API base URL for laptop vs mobile testing
const getDynamicApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5001/api';
  }
  // Fallback to your computer's local network IP when accessing via phone browser
  return `http://${hostname}:5001/api`;
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
  const userId = requireUserId(report.userId);
  const payload = {
    ...report,
    userId
  };

  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to save session');
  return res.json();
}

export async function fetchSessions(query = {}) {
  const userId = requireUserId(query.userId);

  const finalQuery = {
    ...query,
    userId
  };

  const params = new URLSearchParams(finalQuery);
  const res = await fetch(`${API_URL}/sessions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function syncAssessmentRecord(payload) {
  const userId = requireUserId(payload.userId);
  const enrichedPayload = {
    ...payload,
    userId
  };

  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enrichedPayload)
  });
  if (!res.ok) throw new Error('Failed to sync session record');
  return res.json();
}