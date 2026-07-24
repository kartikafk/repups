const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export async function saveSession(report) {
  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  });
  if (!res.ok) throw new Error('Failed to save session');
  return res.json();
}

export async function fetchSessions(limit = 20) {
  const res = await fetch(`${API_URL}/sessions?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}
export async function fetchAssessments() {
  const res = await fetch(`${API_URL}/assessments`);

  if (!res.ok) {
    throw new Error("Failed to fetch assessments");
  }

  return res.json();
}

export async function deleteAssessment(id) {
  const res = await fetch(`${API_URL}/assessments/${id}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    throw new Error("Failed to delete assessment");
  }

  return res.json();
}

// Minimal stats-only record (no video) used purely to let the server
// enforce the 360-hour retention window via a MongoDB TTL index,
// independent of whether the client ever reopens the app.
export async function syncAssessmentRecord({ exercise, avgScore, repCount, avgRom, consistency, userId }) {
  const res = await fetch(`${API_URL}/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise, avgScore, repCount, avgRom, consistency, userId })
  });
  if (!res.ok) throw new Error('Failed to sync assessment record');
  return res.json();
}