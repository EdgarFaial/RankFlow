
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'RankFlow', body: 'Você tem novas atualizações de flow!' };
  
  const options = {
    body: data.body,
    icon: '/icon-192.png', // Fallback se não houver ícone dinâmico
    badge: '/badge.png',
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Abrir App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
