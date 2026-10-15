import { useEffect, useCallback } from 'react';
import { api, BASE } from '../api';

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
  // רישום/חידוש ה-subscription בלבד (בלי בקשת הרשאה) — בטוח לקרוא כשכבר יש הרשאה.
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      // שלח ל-API (כתובת אחת מרכזית — ראה הערת האבטחה ב-api/index.ts)
      await fetch(`${BASE}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('km_token') || ''}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ subscription: sub }),
      });
      return true;
    } catch {
      // רישום Push נכשל — מתעלמים בשקט (לא חוסם את האפליקציה)
      return false;
    }
  }, [userId]);

  // בקשת הרשאה — רק ממחווה מפורשת של המשתמש (כפתור "הפעל התראות"). בקשה
  // אוטומטית ב-login נדחית ע"י Safari ועלולה להיחסם לצמיתות ב-Chrome.
  const enablePush = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
    return subscribe();
  }, [subscribe]);

  // אוטומטי: מחדשים subscription רק אם המשתמש כבר אישר התראות בעבר — בלי לבקש.
  useEffect(() => {
    if (!userId) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') subscribe();
  }, [userId, subscribe]);

  return { enablePush };
}
