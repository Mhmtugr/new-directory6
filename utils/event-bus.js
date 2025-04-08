/**
 * EventBus Modülü
 * Uygulama bileşenleri arasında merkezi iletişim ve durum paylaşım mekanizması
 */

class EventBus {
    constructor() {
        this.events = {}; // Kayıtlı dinleyiciler
        this.states = {}; // Durum değerleri
        this.history = []; // Olay geçmişi
        this.historyLimit = 100; // Maksimum geçmiş olayı
        this.debug = false; // Debug modu
    }
    
    /**
     * Bir olaya abone ol
     * @param {string} eventName - Olay adı
     * @param {function} callback - Tetiklenecek fonksiyon
     * @returns {function} - Aboneliği iptal etme fonksiyonu
     */
    on(eventName, callback) {
        if (!eventName || typeof callback !== 'function') {
            console.error('EventBus.on: Geçersiz parametreler', { eventName, callbackType: typeof callback });
            return null;
        }
        
        // Events listesini oluştur (yoksa)
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        // Callback'i ekle
        this.events[eventName].push(callback);
        
        if (this.debug) {
            console.log(`EventBus: '${eventName}' olayı için yeni dinleyici eklendi. Toplam: ${this.events[eventName].length}`);
        }
        
        // Kaydedilmiş durum varsa hemen çağır
        if (this.states[eventName] !== undefined) {
            try {
                callback(this.states[eventName]);
            } catch (error) {
                console.error(`EventBus: '${eventName}' durumu için callback hatası:`, error);
            }
        }
        
        // Aboneliği iptal etmek için kullanılacak fonksiyon
        return () => this.off(eventName, callback);
    }
    
    /**
     * Bir olaydan aboneliği kaldır
     * @param {string} eventName - Olay adı
     * @param {function} [callback] - Kaldırılacak fonksiyon (boş ise tüm dinleyiciler kaldırılır)
     */
    off(eventName, callback) {
        // Olay yoksa işlem yapma
        if (!this.events[eventName]) return;
        
        // Callback belirtildiyse sadece onu kaldır
        if (callback) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
            
            if (this.debug) {
                console.log(`EventBus: '${eventName}' olayından bir dinleyici kaldırıldı. Kalan: ${this.events[eventName].length}`);
            }
        }
        // Callback belirtilmediyse tüm dinleyicileri kaldır
        else {
            delete this.events[eventName];
            
            if (this.debug) {
                console.log(`EventBus: '${eventName}' olayının tüm dinleyicileri kaldırıldı.`);
            }
        }
    }
    
    /**
     * Bir olayı tetikle
     * @param {string} eventName - Olay adı
     * @param {any} data - Olay verisi
     * @param {boolean} [persist=false] - Durumu kalıcı olarak kaydet
     * @returns {object} - Tetikleme sonucu
     */
    emit(eventName, data, persist = false) {
        // Olay geçmişine ekle
        this.addToHistory(eventName, data);
        
        // Durumu kaydet (istenirse)
        if (persist) {
            this.states[eventName] = data;
        }
        
        // Dinleyici yoksa dur
        if (!this.events[eventName] || this.events[eventName].length === 0) {
            if (this.debug) {
                console.log(`EventBus: '${eventName}' olayı için dinleyici yok.`);
            }
            return { handled: false, listeners: 0, success: true };
        }
        
        if (this.debug) {
            console.log(`EventBus: '${eventName}' olayı tetikleniyor. ${this.events[eventName].length} dinleyici bulundu.`, data);
        }
        
        // Tüm dinleyicileri çağır ve sonuçları izle
        let success = 0;
        let errors = [];
        
        this.events[eventName].forEach(callback => {
            try {
                callback(data);
                success++;
            } catch (error) {
                console.error(`EventBus: '${eventName}' dinleyicisi hata verdi:`, error);
                errors.push(error);
            }
        });
        
        // Sonuçları raporla
        return {
            handled: success > 0,
            listeners: this.events[eventName].length,
            success: errors.length === 0,
            successful: success,
            errors: errors
        };
    }
    
    /**
     * Bir olayı bir kez dinle
     * @param {string} eventName - Olay adı
     * @param {function} callback - Olay fonksiyonu
     */
    once(eventName, callback) {
        if (!eventName || typeof callback !== 'function') return;
        
        // Bir kez çalışıp kaldırılacak özel wrapper
        const onceWrapper = (data) => {
            this.off(eventName, onceWrapper); // Kendini kaldır
            callback(data); // Asıl fonksiyonu çağır
        };
        
        this.on(eventName, onceWrapper);
    }
    
    /**
     * Bir durumu kaydet ve ilgili olayı tetikle
     * @param {string} stateName - Durum adı
     * @param {any} value - Durum değeri
     */
    setState(stateName, value) {
        this.states[stateName] = value;
        return this.emit(stateName, value);
    }
    
    /**
     * Bir durumu getir
     * @param {string} stateName - Durum adı
     * @returns {any} - Durum değeri
     */
    getState(stateName) {
        return this.states[stateName];
    }
    
    /**
     * Debug modunu aç/kapa
     * @param {boolean} enabled - Debug modu açık mı
     */
    setDebug(enabled) {
        this.debug = enabled;
        console.log(`EventBus: Debug modu ${enabled ? 'açıldı' : 'kapatıldı'}.`);
    }
    
    /**
     * Olay geçmişine ekle
     * @private
     * @param {string} eventName - Olay adı
     * @param {any} data - Olay verisi
     */
    addToHistory(eventName, data) {
        // Geçmiş array'ini kontrol et
        if (this.history.length >= this.historyLimit) {
            this.history.pop(); // En eski kaydı çıkar
        }
        
        // Geçmişe ekle (baş tarafa)
        this.history.unshift({
            eventName,
            timestamp: Date.now(),
            data: this.debug ? JSON.parse(JSON.stringify(data || null)) : '[debug kapalı]'
        });
    }
    
    /**
     * Geçmiş olayları getir
     * @param {number} [limit=10] - Maksimum kayıt sayısı
     * @returns {Array} - Olay geçmişi
     */
    getHistory(limit = 10) {
        return this.history.slice(0, Math.min(limit, this.history.length));
    }
    
    /**
     * Tüm olayları ve durumları temizle
     */
    clear() {
        this.events = {};
        this.states = {};
        this.history = [];
        
        if (this.debug) {
            console.log('EventBus: Tüm kayıtlar temizlendi.');
        }
    }
    
    /**
     * Durum verilerini localStorage'a kaydet
     * @param {string} [key='eventbus_state'] - localStorage anahtarı
     */
    persistState(key = 'eventbus_state') {
        try {
            localStorage.setItem(key, JSON.stringify(this.states));
            return true;
        } catch (error) {
            console.error('EventBus: Durum kaydedilemedi:', error);
            return false;
        }
    }
    
    /**
     * Durumları localStorage'dan yükle
     * @param {string} [key='eventbus_state'] - localStorage anahtarı
     */
    loadState(key = 'eventbus_state') {
        try {
            const savedState = localStorage.getItem(key);
            if (savedState) {
                this.states = JSON.parse(savedState);
                return true;
            }
        } catch (error) {
            console.error('EventBus: Durum yüklenemedi:', error);
        }
        return false;
    }
}

// Sistem çapındaki olay tipleri
const SystemEvents = {
    // Uygulama yaşam döngüsü
    APP_INITIALIZED: 'app:initialized',
    APP_READY: 'app:ready',
    APP_ERROR: 'app:error',
    
    // Görünüm değişiklikleri
    VIEW_CHANGED: 'view:changed',
    TAB_CHANGED: 'tab:changed',
    UI_UPDATED: 'ui:updated',
    
    // Kullanıcı oturumu
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    AUTH_CHANGED: 'auth:changed',
    
    // Veri işlemleri
    DATA_LOADED: 'data:loaded',
    DATA_UPDATED: 'data:updated',
    DATA_ERROR: 'data:error',
    
    // Siparişler
    ORDER_ADDED: 'order:added',
    ORDER_UPDATED: 'order:updated',
    ORDER_DELETED: 'order:deleted',
    
    // Malzemeler
    MATERIAL_ADDED: 'material:added',
    MATERIAL_UPDATED: 'material:updated',
    MATERIAL_CRITICAL: 'material:critical',
    
    // Yapay Zeka
    AI_RESPONSE: 'ai:response',
    AI_ERROR: 'ai:error',
    AI_READY: 'ai:ready',
    
    // Ağ durumu
    NETWORK_ONLINE: 'network:online',
    NETWORK_OFFLINE: 'network:offline',
    API_ERROR: 'api:error',
    
    // Senkronizasyon
    SYNC_STARTED: 'sync:started',
    SYNC_COMPLETED: 'sync:completed',
    SYNC_ERROR: 'sync:error'
};

// Global EventBus örneği oluştur
window.eventBus = new EventBus();
window.SystemEvents = SystemEvents;

// EventBus'ın debug modunu kontrol et
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'eventbus') {
    window.eventBus.setDebug(true);
    console.log('EventBus debug modu aktif');
}

console.log('EventBus modülü başarıyla yüklendi');
