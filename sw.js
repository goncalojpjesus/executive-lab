const V="xl-202610072030";
const FILES=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("message",e=>{if(e.data==="ativar")self.skipWaiting()});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.origin!==location.origin)return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));
});
const IDB={db:null,abrir(){return this.db||(this.db=new Promise((ok,ko)=>{const r=indexedDB.open("xl",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)}))},
  async get(k){const d=await this.abrir();return new Promise(ok=>{const q=d.transaction("kv").objectStore("kv").get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>ok(undefined)})},
  async set(k,v){const d=await this.abrir();return new Promise(ok=>{const t=d.transaction("kv","readwrite");t.objectStore("kv").put(v,k);t.oncomplete=()=>ok();t.onerror=()=>ok()})}};
self.addEventListener("push",e=>{e.waitUntil((async()=>{
  let corpo="Há novidades nos trabalhos.",n=0;
  try{
    const pt=await IDB.get("pt"),srv=await IDB.get("srv"),desde=await IDB.get("desde")||0;
    if(pt&&srv){
      const o=await fetch(srv,{method:"POST",body:JSON.stringify({fn:"avisos",args:[pt,desde]})}).then(r=>r.json());
      const l=(o.ok&&o.r&&o.r.ok&&o.r.avisos)||[];
      if(l.length){n=l.length;const u=l[l.length-1];corpo=u.txt+(n>1?`  (+${n-1})`:"");await IDB.set("desde",u.q)}
    }
  }catch(err){}
  await self.registration.showNotification("Executive Lab",{body:corpo,icon:"icon-192.png",badge:"icon-192.png",tag:"xl",renotify:true,data:{url:"./"}});
  try{for(const c of await self.clients.matchAll({type:"window"}))c.postMessage("novidades")}catch(err){}
})())});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil((async()=>{
  const cs=await self.clients.matchAll({type:"window",includeUncontrolled:true});
  for(const c of cs){if("focus" in c){c.postMessage("novidades");return c.focus()}}
  return self.clients.openWindow("./");
})())});
