/**
 * Uygulama Yapılandırma Dosyası
 */

// App configuration 
const appConfig = {
    appName: "MehmetEndüstriyelTakip",
    version: "1.0.0",
    environment: "development",
    apiUrl: "https://api.mehmetendüstriyel.com",
    useLocalStorage: true,
    useDemoMode: true,
    debugMode: true,
    
    // AI Configuration
    ai: {
        enabled: true,
        apiKey: "demo-key-for-testing",
        model: "gpt-4",
        temperature: 0.7,
        maxTokens: 2048
    },
    
    // Firebase configuration
    firebase: {
        apiKey: "demo-firebase-key",
        authDomain: "mets-demo.firebaseapp.com", 
        projectId: "mets-demo",
        storageBucket: "mets-demo.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef123456789",
        measurementId: "G-ABCDEFGHI"
    },
    
    // Sistem modülleri
    modules: {
        dashboard: true,
        orders: true,
        production: true,
        materials: true,
        planning: true,
        reports: true,
        technical: true,
        settings: true,
        ai: true
    },
    
    // Hata log seviyeleri
    logLevels: {
        debug: true,
        info: true,
        warn: true,
        error: true
    }
};

// Global olarak appConfig'i ata
window.appConfig = appConfig;
