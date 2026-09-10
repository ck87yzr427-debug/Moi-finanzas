const CACHE = "moi-finanzas-v160-work-assistants";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./supabase-config.js",
  "./work-assistants.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && !k.startsWith("moi-finanzas-data-")).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function withWorkAssistants(resp){
  if(!resp || !resp.ok) return resp;
  return resp.text().then(html => {
    if(!html.includes("work-assistants.js")){
      html = html.replace("</body>", '<script src="./work-assistants.js"></script>\n</body>');
    }
    const headers = new Headers(resp.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.delete("content-length");
    return new Response(html,{status:resp.status,statusText:resp.statusText,headers});
  });
}

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  const req=event.request;

  if(req.mode === "navigate"){
    event.respondWith(
      fetch(req,{cache:"no-store"})
        .then(resp => withWorkAssistants(resp.clone()).then(injected => {
          const cacheCopy=injected.clone();
          caches.open(CACHE).then(cache=>cache.put("./index.html",cacheCopy));
          return injected;
        }))
        .catch(()=>caches.match("./index.html").then(resp=>withWorkAssistants(resp)))
    );
    return;
  }

  if(new URL(req.url).pathname.endsWith("/supabase-config.js") || new URL(req.url).pathname.endsWith("/work-assistants.js")){
    event.respondWith(fetch(req,{cache:"no-store"}).then(resp=>{
      if(resp && resp.status===200){const copy=resp.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
      return resp;
    }).catch(()=>caches.match(req)));
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>cached || fetch(req).then(resp=>{
      if(resp && resp.status===200){
        const copy=resp.clone();
        caches.open(CACHE).then(cache=>cache.put(req,copy));
      }
      return resp;
    }))
  );
});