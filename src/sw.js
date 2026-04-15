import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkOnly, NetworkFirst } from 'workbox-strategies';

// Inyectado por vite-plugin-pwa en build
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Supabase: siempre red
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkOnly()
);

// Navegación: NetworkFirst con fallback al index cacheado
registerRoute(
  new NavigationRoute(new NetworkFirst({ networkTimeoutSeconds: 3 }))
);

// ── Push notification handler ─────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Obsidian', body: event.data.text() }; }

  const { title = 'Obsidian Planner', body = '', url = '/' } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:    '/pwa-192.png',
      badge:   '/pwa-192.png',
      tag:     'daily-summary',
      renotify: false,
      data:    { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((all) => {
      const existing = all.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); return existing.navigate(target); }
      return clients.openWindow(target);
    })
  );
});
