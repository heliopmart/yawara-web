self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.notification.body,
      icon: data.notification.icon || '/images/yawara-icon-192x192.png',
      badge: data.notification.badge || '/images/yawara-icon-black.png',
      vibrate: [100, 50, 100],
      data: data.notification.data,
    };

    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});