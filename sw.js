// ========================================================================
// MESIN SERVICE WORKER (PWA) MUSHOLLA NURUL HAQ - ULTRA PREMIUM
// ========================================================================

const CACHE_VERSION = 'v11.0'; // <-- Naikkan versinya menjadi 11.0
const CACHE_NAME = 'musholla-cache-' + CACHE_VERSION;
const DYNAMIC_CACHE = 'musholla-dynamic-' + CACHE_VERSION;

// 1. DAFTAR MEMORI WAJIB (Pre-cache)
// Memasukkan Font & Background agar Splash Screen instan walau tanpa internet
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  'https://www.transparenttextures.com/patterns/arabesque.png',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap'
];

// --- FASE 1: INSTALASI ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mengunduh aset inti untuk versi:', CACHE_VERSION);
      return cache.addAll(urlsToCache);
    })
  );
  // self.skipWaiting() SENGAJA DIHILANGKAN
  // Agar sistem menunggu jamaah menekan tombol "Update" di aplikasi
});

// --- FASE 2: AKTIVASI & BERSIH-BERSIH ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Hapus semua cache versi lama (baik utama maupun dinamis)
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE && 
             (cacheName.startsWith('musholla-cache-') || cacheName.startsWith('musholla-dynamic-') || cacheName.startsWith('tpq-cache-'))) {
            console.log('[SW] Membersihkan memori aplikasi usang:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});

// --- FASE 3: MESIN PENGATUR LALU LINTAS DATA (INTERCEPTOR) ---
self.addEventListener('fetch', (event) => {
  
  // FILTER PENTING: Abaikan data dari Google Script (Iframe)
  // Ini memastikan data Qurban, Kas, dll SELALU LIVE dan tidak pernah basi!
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) {
      return; 
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika file ada di memori HP, langsung tampilkan (Super Cepat!)
      if (cachedResponse) {
        return cachedResponse; 
      }

      // Jika tidak ada di memori, ambil dari internet...
      return fetch(event.request).then((networkResponse) => {
        // Jangan simpan respon yang error / bermasalah
        if(!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        // ...lalu simpan salinannya ke Memori Dinamis agar besok makin cepat!
        let responseToCache = networkResponse.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
        
      }).catch(() => {
        // FALLBACK OFFLINE: Jika sinyal putus total saat buka aplikasi baru
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html'); // Paksa buka kerangka utama UI
        }
      });
    })
  );
});

// --- FASE 4: MESIN PENERIMA PERINTAH UPDATE DARI TOMBOL ---
self.addEventListener('message', function(event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting(); // Mesin baru mengambil alih saat tombol Update diklik
  }
});
