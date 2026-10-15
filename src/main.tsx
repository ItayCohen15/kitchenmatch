import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// רישום Service Worker ללא תנאי — מעטפת אופליין + PWA מתקינה לכל מבקר (כולל
// מנותקים, ביקור ראשון, ואדמין ללא UserId). בקשת הרשאת ה-push וה-subscription
// נשארות ב-usePush (ומופעלות רק ממחווה מפורשת / כשכבר יש הרשאה).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
