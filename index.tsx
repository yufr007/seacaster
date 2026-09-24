import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
const element = document.getElementById('root');
if (!element) throw new Error('SeaCaster root element is missing.');
// The old worker can otherwise serve a stale Farcaster-era shell after deployment.
if ('serviceWorker' in navigator) void navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(registration => registration.unregister()))).catch(() => {});
ReactDOM.createRoot(element).render(<React.StrictMode><App /></React.StrictMode>);
