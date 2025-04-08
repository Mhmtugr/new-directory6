/**
 * MehmetEndüstriyelTakip Sistemi - Service Worker
 */

const CACHE_NAME = 'mets-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/config/app-config.js',
  '/utils/event-bus.js',
  '/core/logger.js',
  '/services/api-service.js',
  '/services/erp-service.js',
  '/services/ai-service.js',
  '/modules/ai/chatbot.js',
  '/modules/ai/ai-integration.js',
  '/modules/dashboard/dashboard.js',
  '/modules/orders/orders.js',
  '/modules/production/production.js',
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-144x144.png',
  '/assets/icons/icon-152x152.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-384x384.png',
  '/assets/icons/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.9/index.global.min.js'
];

// Service Worker kurulumu
self.addEventListener('install', event => {
  console.log('Service Worker kurulumu başlatılıyor');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Önbellek oluşturuldu, dosyalar kaydediliyor');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('Tüm dosyalar önbelleğe alındı');
        return self.skipWaiting(); // Hemen aktifleştirir
      })
      .catch(error => {
        console.error('Önbelleğe alma sırasında hata:', error);
      })
  );
});

// Service Worker aktifleşme
self.addEventListener('activate', event => {
  console.log('Service Worker aktifleştiriliyor');
  
  // Eski önbellekleri temizle
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Eski sürümdeki önbellekleri sil
            if (cacheName !== CACHE_NAME) {
              console.log(`Eski önbellek siliniyor: ${cacheName}`);
              return caches.delete(cacheName);
            }
            return null;
          }).filter(Boolean)
        );
      })
      .then(() => {
        console.log('Service Worker artık aktif');
        return self.clients.claim(); // Tüm sayfa kontrolünü üzerine al
      })
  );
});

// Ağ isteklerini yakalama
self.addEventListener('fetch', event => {
  // API istekleri ve AI istekleri için network-first stratejisi
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('api.deepseek.com') ||
      event.request.url.includes('api.openai.com')) {
    
    event.respondWith(networkFirstStrategy(event.request));
  }
  // Statik asset'ler için cache-first stratejisi  
  else if (
    ASSETS_TO_CACHE.some(asset => event.request.url.includes(asset)) ||
    event.request.url.endsWith('.js') ||
    event.request.url.endsWith('.css') ||
    event.request.url.endsWith('.png') ||
    event.request.url.endsWith('.jpg') ||
    event.request.url.endsWith('.svg') ||
    event.request.url.endsWith('.ico')
  ) {
    event.respondWith(cacheFirstStrategy(event.request));
  }
  // Diğer istekler için
  else {
    event.respondWith(networkFirstStrategy(event.request));
  }
});

// Cache-First stratejisi: önce cache'e bak, yoksa ağdan al
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Sadece başarılı yanıtları cache'le
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Ağ isteği başarısız:', error);
    
    // Offline sayfa veya fallback içerik
    return new Response('İçerik şu anda kullanılamıyor. Lütfen internet bağlantınızı kontrol edin.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
    });
  }
}

// Network-First stratejisi: önce ağdan dene, başarısız olursa cache'e bak
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Başarılı yanıtları cache'le
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Ağ isteği başarısız:', error);
    
    // Önbellekte var mı kontrol et
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // API isteği ve önbellek yok - hata mesajı döndür
    return new Response('Ağ veya önbellek yanıtı alınamadı', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
    });
  }
}

// Background Sync API - çevrimdışı işlemleri senkronize etmek için
self.addEventListener('sync', event => {
  console.log('Sync olayı tetiklendi:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  } else if (event.tag === 'sync-materials') {
    event.waitUntil(syncMaterials());
  }
});

// Bekleyen siparişleri senkronize et
async function syncOrders() {
  try {
    // LocalStorage'a erişilemediği için IndexedDB veya Cache API kullanılabilir
    // Bu örnekte tarayıcı sayfasından veri aktarımı için Cache API kullanılıyor
    
    const cache = await caches.open('pending-orders-cache');
    const pendingOrdersRequest = new Request('pending-orders-data');
    const cachedData = await cache.match(pendingOrdersRequest);
    
    if (!cachedData) {
      console.log('Senkronize edilecek sipariş bulunamadı');
      return;
    }
    
    const pendingOrders = await cachedData.json();
    
    if (pendingOrders.length === 0) {
      console.log('Senkronize edilecek sipariş yok');
      return;
    }
    
    console.log(`${pendingOrders.length} bekleyen sipariş senkronize ediliyor`);
    
    const successfulOrders = [];
    
    // Her siparişi gönder
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
        
        if (response.ok) {
          successfulOrders.push(order.id);
        }
      } catch (error) {
        console.error(`Sipariş gönderimi başarısız (${order.id}):`, error);
      }
    }
    
    // Başarılı siparişleri çıkar ve yeni listeyi güncelle
    if (successfulOrders.length > 0) {
      const remainingOrders = pendingOrders.filter(order => !successfulOrders.includes(order.id));
      
      // Güncellenmiş listeyi önbelleğe kaydet
      await cache.put(pendingOrdersRequest, new Response(JSON.stringify(remainingOrders)));
      
      // İstemcileri bilgilendir
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETED',
          message: `${successfulOrders.length} sipariş başarıyla senkronize edildi.`,
          successCount: successfulOrders.length
        });
      });
    }
    
  } catch (error) {
    console.error('Sipariş senkronizasyonu genel hatası:', error);
  }
}

// Bekleyen malzemeleri senkronize et
async function syncMaterials() {
  // syncOrders() fonksiyonuna benzer şekilde implemente edilebilir
  console.log('Malzeme senkronizasyonu başlatıldı');
}

// Push bildirimleri
self.addEventListener('push', event => {
  if (!event.data) {
    console.log('İçeriksiz push olayı alındı');
    return;
  }
  
  try {
    let notificationData;
    
    // JSON veya metin olarak veri çözme
    try {
      notificationData = event.data.json();
    } catch {
      notificationData = {
        title: 'MehmetEndüstriyelTakip Bildirimi',
        body: event.data.text()
      };
    }
    
    // Bildirim göster
    const title = notificationData.title || 'MehmetEndüstriyelTakip';
    const options = {
      body: notificationData.body || '',
      icon: notificationData.icon || '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge.png',
      data: {
        url: notificationData.url || '/',
        action: notificationData.action || 'default'
      },
      vibrate: [100, 50, 100],
      actions: notificationData.actions || [
        { action: 'view', title: 'Görüntüle' },
        { action: 'close', title: 'Kapat' }
      ]
    };
    
    event.waitUntil(self.registration.showNotification(title, options));
    
  } catch (error) {
    console.error('Push bildirimi işleme hatası:', error);
  }
});

// Bildirime tıklama
self.addEventListener('notificationclick', event => {
  event.notification.close(); // Bildirimi kapat
  
  // Tıklanan eylem veya varsayılan eylem
  const action = event.action || 'default';
  const url = event.notification.data?.url || '/';
  
  if (action === 'close') {
    return; // Kapat eylemi - bir şey yapma
  }
  
  // Mevcut tarayıcı penceresini aç veya odakla
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Aynı URL'ye sahip açık pencere var mı kontrol et
        for (let client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Yoksa yeni pencere aç
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('MehmetEndüstriyelTakip Service Worker v1.0 yüklendi');