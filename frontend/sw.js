/* Cache only the public static shell. No API credentials, audio or user data. */
const CACHE='waveform-static-2026-11-03-v1';
self.addEventListener('install',event=>event.waitUntil((async()=>{const assets=await fetch(new URL('offline-assets.json',self.registration.scope),{cache:'no-store'}).then(r=>r.json());const cache=await caches.open(CACHE);await cache.addAll(assets.map(p=>new URL(p,self.registration.scope).href));})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('waveform-static-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match(new URL('index.html',self.registration.scope).href)));return;}
 event.respondWith(caches.match(event.request).then(cached=>cached || fetch(event.request)));
});
