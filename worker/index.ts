'use strict';

self.addEventListener('push', function (event: any) {
  if (!event.data) return;

  try {
    const data = JSON.parse(event.data.text());
    event.waitUntil(
      (self as any).registration.showNotification(data.title || 'Goalflow Notification', {
        body: data.message || data.body || '',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: {
          url: data.url || '/'
        }
      })
    );
  } catch (e) {
    console.error('Error parsing push event data', e);
  }
});

self.addEventListener('notificationclick', function (event: any) {
  event.notification.close();
  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList: any[]) {
      const url = event.notification.data?.url || '/';
      
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow(url);
      }
    })
  );
});
