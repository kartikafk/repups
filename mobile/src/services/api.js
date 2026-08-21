const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
// Physical device: set EXPO_PUBLIC_API_URL to your computer's Wi-Fi IP; localhost cannot reach a PC API.
export const API_URL = configuredUrl || 'http://192.168.1.42:5001/api';
async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options }); }
  catch { throw new Error(`Cannot reach the API at ${API_URL}. Check the server and that your phone and PC share Wi-Fi.`); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || 'Request failed.');
  return data;
}
export function signIn({ email, password, role }) { const trainer = role === 'trainer'; return request(trainer ? '/trainers/signin' : '/auth/signin', { method: 'POST', body: JSON.stringify(trainer ? { email, password } : { email, password, role }) }); }
export function signUp({ name, email, password, role }) { return request(role === 'trainer' ? '/trainers/register' : '/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }); }

async function authenticatedRequest(path, token) {
  return request(path, { headers: { Authorization: `Bearer ${token}` } });
}

export async function getClientDashboard(token, fallbackUser) {
  const me = await authenticatedRequest('/me', token).catch(() => ({ user: fallbackUser }));
  const user = me.user || fallbackUser;
  const userId = user?._id || user?.id;
  const [sessions, plans, posture, trainerRequests] = await Promise.all([
    authenticatedRequest('/sessions?limit=100', token).catch(() => []),
    authenticatedRequest('/workout-plans/me', token).catch(() => ({ plans: [] })),
    userId ? authenticatedRequest(`/posture/${userId}/latest`, token).catch(() => ({ record: null })) : Promise.resolve({ record: null }),
    authenticatedRequest('/client/trainer-requests', token).catch(() => ({ requests: [] })),
  ]);
  return { user, sessions: Array.isArray(sessions) ? sessions : [], plans: plans.plans || [], posture: posture.record || null, trainer: (trainerRequests.requests || []).find((item) => item.status === 'accepted')?.trainer || null };
}

export async function getCommunityFeed(token) {
  const result = await authenticatedRequest('/community/feed', token);
  return result.posts || [];
}

export function createCommunityPost(token, text) {
  return request('/community/feed', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, type: 'workout' }),
  });
}

export function toggleCommunityLike(token, postId) {
  return request(`/community/feed/${postId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getCommunityChallenges(token) {
  const result = await authenticatedRequest('/community/challenges', token);
  return result.challenges || [];
}

export function joinCommunityChallenge(token, challengeId) {
  return request(`/community/challenges/${challengeId}/join`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

export async function getCommunityLeaderboard(token) {
  const result = await authenticatedRequest('/community/leaderboard', token);
  return result.leaderboard || [];
}

export function getFriendChallenges(token, userId) {
  return authenticatedRequest(`/community/friend-challenges/${userId}`, token).then((result) => result.challenges || []);
}

export function sendFriendChallenge(token, data) {
  return request('/community/friend-challenges', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
}

export function respondToFriendChallenge(token, challengeId, action) {
  return request(`/community/friend-challenges/${challengeId}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

export async function getEventsAndGyms(token) {
  const [events, gyms] = await Promise.all([
    authenticatedRequest('/events', token).catch(() => ({ events: [] })),
    authenticatedRequest('/gyms', token).catch(() => ({ gyms: [] })),
  ]);
  return { events: events.events || [], gyms: gyms.gyms || [] };
}

export function getEvent(token, eventId) { return authenticatedRequest(`/events/${eventId}`, token).then((result) => result.event); }
export function getGym(token, gymId) { return authenticatedRequest(`/gyms/${gymId}`, token).then((result) => result.gym); }
export function getGymPlans(token, gymId) { return authenticatedRequest(`/gyms/${gymId}/plans`, token).then((result) => result.plans || []); }
export function quoteEventRegistration(token, eventId, ticketTypeId, quantity) { return request(`/events/${eventId}/registration/quote`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ ticketTypeId, quantity }) }).then((result) => result.quote); }
export function quoteGymMembership(token, gymId, planId) { return request(`/gyms/${gymId}/membership/quote`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ planId }) }).then((result) => result.quote); }

export function chatWithCoach(token, query) { return request('/ai-coach/chat', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ query }) }); }
export function getClientTrainers(token, query = '') { return authenticatedRequest(`/client/trainers${query ? `?q=${encodeURIComponent(query)}` : ''}`, token).then((result) => result.trainers || []); }
export function getClientTrainer(token, trainerId) { return authenticatedRequest(`/client/trainers/${trainerId}`, token).then((result) => result.trainer); }
