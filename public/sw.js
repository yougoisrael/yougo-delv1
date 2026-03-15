const SHELL_CACHE  = 'yougo-shell-v2';
const TILE_CACHE   = 'yougo-tiles-v2';
const IMAGE_CACHE  = 'yougo-images-v2';
const ALL = [SHELL_CACHE, TILE_CACHE, IMAGE_CACHE];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c=>c.addAll(['/','/manifest.json'])).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>!ALL.includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('carto')||url.hostname.includes('tile'))
    { e.respondWith(cacheFirst(e.request,TILE_CACHE)); return; }
  if (/\.(png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname))
    { e.respondWith(swr(e.request,IMAGE_CACHE)); return; }
  if (url.hostname.includes('supabase.co'))
    { e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))); return; }
  if (e.request.mode==='navigate'||/\.(js|css)$/.test(url.pathname))
    { e.respondWith(cacheFirst(e.request,SHELL_CACHE)); return; }
});

async function cacheFirst(req,cn){
  const c=await caches.open(cn),h=await c.match(req);
  if(h)return h;
  try{const r=await fetch(req);if(r.ok)c.put(req,r.clone());return r;}
  catch{return new Response('Offline',{status:503});}
}
async function swr(req,cn){
  const c=await caches.open(cn),h=await c.match(req);
  const p=fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r;}).catch(()=>{});
  return h||p;
}

/* ── Push Notifications ── */
self.addEventListener('push', e => {
  const d = e.data?.json() || {};
  e.waitUntil(self.registration.showNotification(d.title || 'YouGo 🛵', {
    body:  d.body  || '',
    icon:  d.icon  || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data:  { url: d.url || '/' },
    vibrate: [200, 100, 200],
  }));
});

/* ── Notification Click ── */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(cs => {
      const url = e.notification.data?.url || '/';
      const open = cs.find(c => c.url.includes(url));
      if (open) return open.focus();
      return clients.openWindow(url);
    })
  );
});
