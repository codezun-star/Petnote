/*
 * Petnote service worker.
 *
 * Deliberately conservative. A service worker sits in front of every request,
 * so the failure modes are serving one user's data to another, or pinning the
 * app to a stale build. The rules here are built to make both impossible:
 *
 *   - Only same-origin GET requests are touched. Anything else — POST, Server
 *     Actions, Supabase, Paddle — goes straight to the network, untouched.
 *   - HTML is never cached. Dashboard pages are rendered per user and the
 *     emergency page carries someone's phone number; neither belongs in a
 *     shared cache. Navigations are network-first with an offline fallback.
 *   - Only build-immutable and static brand assets are cached.
 */

const VERSION = "petnote-v1";
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline";

// Paths that must always hit the network: user data, auth, billing webhooks.
const NEVER_CACHE = [/^\/api\//, /^\/auth\//];

// Safe to cache: content-hashed build output and stable brand art.
const STATIC_ASSET = [
  /^\/_next\/static\//,
  /^\/icons\//,
  /^\/logo-.*\.png$/,
  /^\/hero-.*\.(jpg|jpeg|png|webp)$/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((re) => re.test(url.pathname))) return;

  // Navigations: always go to the network so the user sees live data, and
  // fall back to the offline page only when the network is genuinely gone.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      }),
    );
    return;
  }

  if (!STATIC_ASSET.some((re) => re.test(url.pathname))) return;

  // Static assets: serve from cache, refresh in the background.
  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    }),
  );
});
