// Service Worker para Belics Barbershop - Push Notifications Resistentes

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  let data = { title: 'Belics Barbershop', body: 'Nueva cita registrada' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data.body = event.data ? event.data.text() : 'Nueva cita registrada';
  }

  const options = {
    body: data.body,
    icon: '/icono-cita.png',
    badge: '/icono-cita.png',
    vibrate: [200, 100, 200],
    requireInteraction: true // Mantiene la notificación visible hasta que el usuario la toque
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/admin') // Al tocar la notificación, abre directo tu panel de administración
  );
});