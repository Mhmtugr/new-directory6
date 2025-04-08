/**
 * Firebase Konfigürasyon
 * Firebase bağlantı ve başlatma ayarları
 */

// Firebase olup olmadığını kontrol et ve gerekirse mockla
function initializeFirebase() {
    console.log('Firebase başlatılıyor...');
    
    return new Promise((resolve, reject) => {
        try {
            // Firebase yüklü değilse mock kullan
            if (typeof firebase === 'undefined') {
                console.log('Firebase SDK yüklenemedi. Demo moda geçiliyor...');
                enableDemoMode();
                resolve(false);
                return;
            }
            
            // Firebase konfigürasyonunu al
            const firebaseConfig = window.appConfig?.firebase || {
                apiKey: "demo-firebase-key"
            };
            
            // Firebase başlat
            firebase.initializeApp(firebaseConfig);
            
            // Auth dinleyicisi ekle
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    console.log('Kullanıcı oturumu bulundu:', user.email);
                    window.eventBus?.emit('auth:login', user);
                } else {
                    console.log('Kullanıcı oturumu bulunamadı');
                    window.eventBus?.emit('auth:logout');
                }
            });
            
            resolve(true);
        } catch (error) {
            console.error('Firebase başlatma hatası:', error);
            enableDemoMode();
            reject(error);
        }
    });
}

// Demo modu etkinleştir
function enableDemoMode() {
    console.log('Demo modu etkinleştiriliyor...');
    
    // Demo ile giriş yap
    if (window.demoLogin) {
        window.demoLogin();
    } else {
        console.error('demoLogin fonksiyonu bulunamadı!');
    }
}

// Doküman yüklendiğinde Firebase'i başlat
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase()
        .then(isFirebaseInitialized => {
            if (isFirebaseInitialized) {
                console.log('Firebase başarıyla başlatıldı');
            } else {
                console.log('Demo Firebase kullanılıyor');
            }
        })
        .catch(error => {
            console.error('Uygulama başlatma hatası:', error);
            enableDemoMode();
        });
});