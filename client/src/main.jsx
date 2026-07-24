import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
};

const clearServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch (e) {
    console.warn('Failed to unregister service workers:', e);
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  } catch (e) {
    console.warn('Failed to clear caches:', e);
  }
};

window.addEventListener('load', async () => {
  await clearServiceWorkers();
  renderApp();
});

window.addEventListener('beforeunload', async () => {
  await clearServiceWorkers();
});
