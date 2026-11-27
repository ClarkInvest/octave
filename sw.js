/* Service worker : garde l'appli disponible sans internet. */
const CACHE = 'octave-v0.10.1';
const SOUNDS = 'octave-sons-v1'; /* les sons de piano ne changent pas d'une version à l'autre */
const FILES = ['./', './index.html', './styles.css', './app.js', './engine.js', './mascots.js', './music.js', './game.js', './learn.js', './monde3.js', './path.js', './train.js', './midi.js', './arrange.js', './mysongs.js', './rewards.js', './diag.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== SOUNDS).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    const copy = res.clone();
    if (res.ok && (e.request.url.startsWith(self.location.origin) || e.request.url.includes('fonts.g'))) caches.open(e.request.url.includes('/sounds/') ? SOUNDS : CACHE).then((c) => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match('./index.html'))));
});
