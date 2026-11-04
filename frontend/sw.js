/* Public assets only. Each release keeps its HTML and modules together. */
const CACHE='waveform-static-2026-11-03-v1';
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const assets=await fetch(new URL('offline-assets.json',self.registration.scope),{cache:'no-store'}).then(response=>response.json());
  const cache=await caches.open(CACHE);
  await cache.addAll(assets.map(path=>new Request(new URL(path,self.registration.scope).href,{cache:'reload'})));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('waveform-static-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(event.request.method!=='GET'||url.origin!==scope.origin)return;
  if(event.request.mode==='navigate'){
    // Hash routing only: retired API/private paths retain the host's 404 response.
    if(![scope.pathname,scope.pathname+'index.html'].includes(url.pathname))return;
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(new URL('index.html',scope).href)) || fetch(event.request)));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request)) || fetch(event.request)));
});
