/**
 * main.js
 * Uygulama ana işlevleri, sayfa kontrolü ve yardımcı fonksiyonlar
 */

// Global durum değişkenleri
const appState = {
    currentPage: 'dashboard',
    isUserLoggedIn: false,
    currentUser: null,
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('language') || 'tr',
    isLoading: false,
    notifications: localStorage.getItem('notifications') === 'true',
    lastError: null,
    isDemoMode: window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('netlify.app') ||
                window.location.search.includes('demo=true')
};

// Sayfa yükleme durumları
const pageLoadStatus = {};

/**
 * Ana Başlatma Modülü
 * Tüm sistemin başlatılmasını koordine eder
 */

// Ana sınıf
class Main {
    constructor() {
        this.initialized = false;
        this.config = window.appConfig || {};
        this.demoMode = this.config.useDemoMode || false;
        
        // Uygulama başlangıcını dinle
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }
    
    init() {
        console.log('MehmetEndüstriyelTakip uygulaması başlatılıyor...');
        
        // Demo mod kontrolü
        if (this.demoMode) {
            console.log('Demo modu tespit edildi');
        }
        
        // Uyumluluk kontrolü
        if (window.compatibilityStatus && !window.compatibilityStatus.isCompatible) {
            console.error('Sistem uyumlu değil, bazı özellikler çalışmayabilir.');
        }
        
        try {
            // Kullanıcı durumunu kontrol et
            this.checkUserAuthentication();
            
            // İnteraktif elemanları bağla
            this.bindInteractiveElements();
            
            this.initialized = true;
        } catch (error) {
            console.error('Uygulama başlatılırken hata oluştu', error);
        }
    }
    
    checkUserAuthentication() {
        // Firebase Authentication kontrolü
        if (typeof firebase !== 'undefined' && firebase.auth) {
            // Firebase Auth kullanılabilir
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    console.log('Oturum açtınız:', user.displayName || user.email);
                } else {
                    console.log('Oturum açılmadı');
                    this.redirectToLogin();
                }
            });
        } else {
            // Firebase Auth yok, demo mod ile devam et
            console.log('Firebase Auth yok, demo mod otomatik giriş yapılıyor');
            if (window.demoLogin) {
                window.demoLogin();
            } else {
                console.warn('Demo login fonksiyonu bulunamadı!');
            }
        }
    }
    
    bindInteractiveElements() {
        // Form submit olaylarını engelle ve AJAX kullan
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', e => {
                e.preventDefault();
                console.log('Form submit engellendi, AJAX kullanılıyor...');
                
                // Form işlemleri için gerekirse AJAX eklenebilir
                const formData = new FormData(form);
                const formAction = form.getAttribute('action') || '';
                
                if (formAction.includes('login')) {
                    // Login işlemi
                    const email = formData.get('email');
                    const password = formData.get('password');
                    
                    if (this.demoMode && window.demoLogin) {
                        window.demoLogin(email, password);
                    } else if (typeof firebase !== 'undefined') {
                        firebase.auth().signInWithEmailAndPassword(email, password)
                            .then(() => {
                                console.log('Giriş başarılı');
                            })
                            .catch(error => {
                                console.error('Giriş başarısız:', error);
                            });
                    }
                }
            });
        });
        
        // Chatbot toggle
        const chatbotBtn = document.getElementById('ai-chatbot-btn');
        if (chatbotBtn && window.toggleChatbot) {
            chatbotBtn.addEventListener('click', window.toggleChatbot);
        }
    }
    
    redirectToLogin() {
        // Demo modda yönlendirme yok
        if (this.demoMode) return;
        
        // Login sayfasına yönlendirme
        if (window.location.pathname !== '/login.html') {
            window.location.href = '/login.html';
        }
    }
}

// Ana uygulama nesnesini oluştur
window.mainApp = new Main();

// Service Worker kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker başarıyla kaydedildi:', registration.scope);
            })
            .catch(error => {
                console.error('ServiceWorker kaydı başarısız:', error);
            });
    });
}