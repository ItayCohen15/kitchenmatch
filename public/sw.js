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
  const target = jobId ? `/?job=${jobId}` : '/';

  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    // אם האפליקציה כבר פתוחה — מקד אותה והודע לה לפתוח את המשמרת
    for (const c of all) {
      if ('focus' in c) {
        await c.focus();
        if (jobId) c.postMessage({ type: 'open-job', jobId });
        return;
      }
    }
    // אחרת — פתח חלון חדש עם מזהה המשמרת ב-URL
    if (clients.openWindow) await clients.openWindow(target);
  })());
});
