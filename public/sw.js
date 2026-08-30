// ===== גרסת מטמון — העלה את המספר כדי לפרוש נכסים חדשים בעדכון הבא =====
const CACHE_VERSION = 'staffly-cache-v1';

// מעטפת האפליקציה שנשמור מראש (כדי שדפים/ריענון יעבדו גם אופליין)
const APP_SHELL = ['/', '/index.html'];

// נכסים סטטיים מאותו origin שנשמור במטמון (cache-first)
const STATIC_ASSET = /\.(?:js|mjs|css|png|svg|ico|webp|jpe?g|gif|woff2?)$/i;

// אפשר לגרסה חדשה של ה-SW להשתלט מיד (כדי שתיקונים ייכנסו לתוקף בפתיחה הבאה)
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      // אל תיכשל בהתקנה אם נכס בודד לא נטען — precache הוא "best-effort"
      await cache.addAll(APP_SHELL).catch(() => {});
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // מחק מטמונים ישנים מגרסאות קודמות
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // אל תיגע בבקשות שאינן GET (POST/PUT/DELETE וכו') — למשל שליחות ל-API/כסף
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // לעולם אל תיגע בבקשות API (אימות/escrow/כסף) — לא במטמון ולא בשינוי.
  // ה-API יושב על origin נפרד (kitchenmatch-api.onrender.com); נדלג עליו במפורש
  // וגם על נתיב /api/ למקרה שאי-פעם יעבור לאותו origin.
  if (url.hostname === 'kitchenmatch-api.onrender.com' || url.pathname.startsWith('/api/')) return;

  // טפל רק בבקשות מאותו origin. חוצות-origin (API, גופנים של Google) עוברות
  // כרגיל לרשת בלי מעורבות ה-SW — כך לעולם לא נשמור/נשבור בקשות חיצוניות.
  if (url.origin !== self.location.origin) return;

  // ניווטים / HTML → network-first (האפליקציה החיה מקבלת תמיד HTML עדכני,
  // ורק אופליין נופלים למעטפת השמורה — כך עדכוני קוד לא "נתקעים" במטמון)
  const isNavigation =
    req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put('/index.html', fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch {
          const cached = (await caches.match('/index.html')) || (await caches.match('/'));
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // נכסים סטטיים מאותו origin → cache-first (js/css/png/svg/woff...)
  if (STATIC_ASSET.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          // שמור רק תגובות מלאות ותקינות (200) — לא 206/שגיאות
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(req, fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch {
          return Response.error();
        }
      })()
    );
    return;
  }

  // כל השאר (GET מאותו origin שאינו HTML/נכס סטטי) → רשת רגילה, ללא מטמון
});

self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const title = data.title || 'KitchenMatch';
  const body  = data.body  || '';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'he',
      vibrate: [200, 100, 200],
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  const jobId = data.jobId;
  const isChat = data.type === 'chat';
  const target = jobId ? (isChat ? `/?chat=${jobId}` : `/?job=${jobId}`) : '/';

  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    // אם האפליקציה כבר פתוחה — מקד אותה והודע לה לפתוח את המשמרת/הצ'אט
    for (const c of all) {
      if ('focus' in c) {
        await c.focus();
        if (jobId) c.postMessage({ type: isChat ? 'open-chat' : 'open-job', jobId });
        return;
      }
    }
    // אחרת — פתח חלון חדש עם היעד ב-URL
    if (clients.openWindow) await clients.openWindow(target);
  })());
});
