const V='jmg-v4',AS=['assets/logo-white.png','assets/favicon.png','assets/icon-512.png','assets/home-bg.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(AS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=V).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!='GET'||u.origin!=location.origin)return;
 if(u.pathname.includes('/assets/'))return e.respondWith(caches.match(r).then(h=>h||fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x})));
 e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(k=>k.put(r,c));return x}).catch(()=>caches.match(r).then(h=>h||caches.match('index.html'))))});
