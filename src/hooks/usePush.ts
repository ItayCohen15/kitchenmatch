import { useEffect } from 'react';
import { api } from '../api';

const VAPID_PUBLIC_KEY = 'BGe7jMp7O9XXvNgEZwO2tXWUIAknrKDil9QUCc3hMaAi5GEEqN6AOHjkF7FkSID46PWscQPGgKG5l3_feaiEJks';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function usePush(userId?: number) {
  useEffect(() => {
    if (!userId) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const register = async () => {
      try {
        // רשום Service Worker
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // בקש הרשאה
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // בדוק אם כבר יש subscription
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // שלח ל-API
        const BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://deprive-shakable-fog.ngrok-free.dev';
      await fetch(`${BASE}/push/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('km_token') || ''}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ subscription: sub }),
        });
      } catch (e) {
        console.log('Push registration failed:', e);
      }
    };

    register();
  }, [userId]);
}
