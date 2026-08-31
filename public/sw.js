self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : { title: 'Belics Barbershop', body: 'Nueva cita registrada' };
  
  const options = {
    body: data.body,
    icon: '/icono-cita.png',
    badge: '/icono-cita.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});