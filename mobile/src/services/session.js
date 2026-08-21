import * as SecureStore from 'expo-secure-store';
const sessionKey = 'repups_mobile_session';
export async function getSession() { const raw = await SecureStore.getItemAsync(sessionKey); if (!raw) return null; try { return JSON.parse(raw); } catch { await SecureStore.deleteItemAsync(sessionKey); return null; } }
export function saveSession(token, user) { return SecureStore.setItemAsync(sessionKey, JSON.stringify({ token, user })); }
export function clearSession() { return SecureStore.deleteItemAsync(sessionKey); }
