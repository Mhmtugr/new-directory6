/**
 * Uyumluluk Kontrol Modülü
 * Sistem gerekliliklerini kontrol eder
 */

// Firebase SDK kontrolü
function checkFirebaseCompatibility() {
    if (typeof firebase === 'undefined') {
        if (window.appConfig?.useDemoMode) {
            console.log('Demo modunda çalışılıyor, hata mesajı gösterilmiyor.');
        } else {
            console.error('Firebase SDK yüklenemedi. İnternet bağlantınızı kontrol edin ve sayfayı yenileyin.');
        }
        return false;
    }
    return true;
}

// Tarayıcı uyumluluğu kontrolü
function checkBrowserCompatibility() {
    // ES6 desteği kontrolü
    try {
        eval('let x = (x) => x+1');
    } catch (e) {
        console.error('Tarayıcınız ES6 özelliklerini desteklemiyor. Lütfen güncel bir tarayıcı kullanın.');
        return false;
    }
    
    // IndexedDB kontrolü
    if (!window.indexedDB) {
        console.warn('Tarayıcınız IndexedDB desteklemiyor. Çevrimdışı özellikler kısıtlı olabilir.');
    }
    
    return true;
}

// Sistem uyumluluğu kontrolü
function checkSystemCompatibility() {
    const isCompatible = checkBrowserCompatibility();
    const hasFirebase = checkFirebaseCompatibility();
    
    return {
        isCompatible,
        hasFirebase
    };
}

// Uyumluluk kontrollerini yap
const compatibilityStatus = checkSystemCompatibility();

// Global olarak uyumluluk durumunu ata
window.compatibilityStatus = compatibilityStatus;