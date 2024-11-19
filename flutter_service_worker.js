'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "6b0bcbbd8ca175602911f74cd0d2bbfc",
"assets/AssetManifest.bin.json": "67ccdff6f314d54bc239a5f564116e0d",
"assets/AssetManifest.json": "0bcbffa9aa349e1d2eed018d919a7da4",
"assets/assets/Frame.png": "1e447ea13234437c72d8759ca3726292",
"assets/assets/inter.ttf": "32204736a4290ec41200abe91e5190d1",
"assets/assets/red_logo.png": "172c56df6eaef589718765362dee2bf0",
"assets/assets/white_logo.png": "892bc1d4fc51dec7f09dbfda29d7da36",
"assets/FontManifest.json": "986f7ffad632c33f58ff9498f625e749",
"assets/fonts/MaterialIcons-Regular.otf": "936449b5dcffc739c511c96da7dd7cdf",
"assets/NOTICES": "84092dfc00b68e935731164826491d9d",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "e986ebe42ef785b27164c36a9abc7818",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"canvaskit/canvaskit.js": "32cc31c7f950543ad75e035fcaeb2892",
"canvaskit/canvaskit.js.symbols": "cc5704e0ef2428716d521cca8a5407a4",
"canvaskit/canvaskit.wasm": "bd99b6414d17f38ddf3d38cc2327c6c9",
"canvaskit/chromium/canvaskit.js": "6a5bd08897043608cb8858ce71bcdd8a",
"canvaskit/chromium/canvaskit.js.symbols": "eb8bbbea221d16be0c0157d035f0005a",
"canvaskit/chromium/canvaskit.wasm": "e4373621fcca520db26bbe1419de5312",
"canvaskit/skwasm.js": "ac0f73826b925320a1e9b0d3fd7da61c",
"canvaskit/skwasm.js.symbols": "a6bd1b7f2562a04db7cc22d151ad85fa",
"canvaskit/skwasm.wasm": "06280586b0c7423eb031389a7e814c16",
"canvaskit/skwasm.worker.js": "89990e8c92bcb123999aa81f7e203b1c",
"favicon.png": "fe96a7f2617b48ae69e95f9eb790d2d8",
"flutter.js": "4b2350e14c6650ba82871f60906437ea",
"flutter_bootstrap.js": "2a43b11a4fd48606d53e9736bdbf220d",
"icons/Icon-192.png": "d485b20b42025c32ebc40009ea7a2a4a",
"icons/Icon-512.png": "6d59a9aba3cd232a306d73ec8a152b9b",
"icons/Icon-maskable-192.png": "d485b20b42025c32ebc40009ea7a2a4a",
"icons/Icon-maskable-512.png": "6d59a9aba3cd232a306d73ec8a152b9b",
"index.html": "81e66f4b8309538fda709c47d4caeb7e",
"/": "81e66f4b8309538fda709c47d4caeb7e",
"main.dart.js": "f3ec3e5a3a92dba60565377c61219fdf",
"manifest.json": "bad930be251f8a58c365d0b8523f29cb",
"splash/img/dark-1x.png": "3cb961efe0e841551d67e87a6646708b",
"splash/img/dark-2x.png": "4275d765f36427e3b8535f90431e5835",
"splash/img/dark-3x.png": "242134234cec3db8494d4edb1dd3f43b",
"splash/img/dark-4x.png": "ca1438910f9def10fc686baaf0bc7e13",
"splash/img/light-1x.png": "3cb961efe0e841551d67e87a6646708b",
"splash/img/light-2x.png": "4275d765f36427e3b8535f90431e5835",
"splash/img/light-3x.png": "242134234cec3db8494d4edb1dd3f43b",
"splash/img/light-4x.png": "ca1438910f9def10fc686baaf0bc7e13",
"version.json": "f0a450a7da680cc7e825505dc1700943"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
