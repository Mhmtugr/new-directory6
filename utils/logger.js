/**
 * logger.js
 * Uygulama için loglama işlevleri
 */

import appConfig from '../config/app-config.js'; // 'default' yerine doğru yapılandırma
console.log('Logger initialized with config:', appConfig);

// Log seviyeleri
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

class Logger {
    constructor() {
        this.logLevel = LOG_LEVELS.INFO; // Varsayılan log seviyesi
        this.logs = []; // Uygulama içi log tutma
        this.maxLogSize = 1000; // Maksimum log sayısı
        
        // Konfigürasyondaki log seviyesini ayarla
        if (appConfig && appConfig.logLevel) {
            this.setLogLevel(appConfig.logLevel);
        }
    }
    
    // Log seviyesini ayarla
    setLogLevel(level) {
        if (typeof level === 'string') {
            const upperLevel = level.toUpperCase();
            if (LOG_LEVELS[upperLevel] !== undefined) {
                this.logLevel = LOG_LEVELS[upperLevel];
            }
        } else if (typeof level === 'number' && level >= 0 && level <= 4) {
            this.logLevel = level;
        }
    }
    
    // Log ekle
    log(level, message, data) {
        // Log seviyesi kontrolü
        if (level < this.logLevel) return;
        
        const timestamp = new Date().toISOString();
        let levelName = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level) || 'UNKNOWN';
        
        // Mesajı oluştur
        const logEntry = {
            timestamp,
            level: levelName,
            message,
            data
        };
        
        // Dahili log depolamasına ekle
        this.logs.push(logEntry);
        
        // Maksimum log sayısı aşıldıysa eski logları temizle
        if (this.logs.length > this.maxLogSize) {
            this.logs = this.logs.slice(-this.maxLogSize);
        }
        
        // Konsola yazdırma
        const consoleMsg = `[${timestamp}] [${levelName}] ${message}`;
        
        switch (level) {
            case LOG_LEVELS.DEBUG:
                console.debug(consoleMsg, data || '');
                break;
            case LOG_LEVELS.INFO:
                console.info(consoleMsg, data || '');
                break;
            case LOG_LEVELS.WARN:
                console.warn(consoleMsg, data || '');
                break;
            case LOG_LEVELS.ERROR:
                console.error(consoleMsg, data || '');
                break;
        }
        
        // Loglama sistemi entegrasyonu (varsa)
        this.sendToLogSystem(logEntry);
    }
    
    // Hata log işlevleri
    debug(message, data) {
        this.log(LOG_LEVELS.DEBUG, message, data);
    }
    
    info(message, data) {
        this.log(LOG_LEVELS.INFO, message, data);
    }
    
    warn(message, data) {
        this.log(LOG_LEVELS.WARN, message, data);
    }
    
    error(message, data) {
        this.log(LOG_LEVELS.ERROR, message, data);
    }
    
    // Logları dışa aktarma
    exportLogs() {
        return JSON.stringify(this.logs);
    }
    
    // Logları temizleme
    clearLogs() {
        this.logs = [];
        return true;
    }
    
    // Son X log kaydını getir
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }
    
    // Belirli bir log seviyesindeki logları getir
    getLogsByLevel(level) {
        const numericLevel = typeof level === 'string' 
            ? LOG_LEVELS[level.toUpperCase()] 
            : level;
            
        if (numericLevel === undefined) return [];
        
        return this.logs.filter(log => {
            const logLevel = LOG_LEVELS[log.level];
            return logLevel === numericLevel;
        });
    }
    
    // Belirli bir süre içindeki logları getir
    getLogsByTimeRange(startTime, endTime) {
        return this.logs.filter(log => {
            const logTime = new Date(log.timestamp).getTime();
            return logTime >= startTime.getTime() && logTime <= endTime.getTime();
        });
    }
    
    // Belirli bir kelimeyi içeren logları ara
    searchLogs(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.logs.filter(log => {
            return log.message.toLowerCase().includes(term) || 
                   (log.data && JSON.stringify(log.data).toLowerCase().includes(term));
        });
    }
    
    // Harici loglama sistemine gönder
    sendToLogSystem(logEntry) {
        // Uygulamada kullanılan harici loglama sistemi entegrasyonu buraya eklenebilir
        // Örneğin: Sentry, LogRocket, Firebase Analytics vb.
        try {
            // Konfigürasyon kontrolü
            if (appConfig && appConfig.remoteLogging && appConfig.remoteLogging.enabled) {
                // Hata loglarını her zaman, diğerlerini yapılandırmaya göre gönder
                if (logEntry.level === 'ERROR' || appConfig.remoteLogging.logLevel <= LOG_LEVELS[logEntry.level]) {
                    // Burada örnek bir uzak sunucuya POST işlemi yapılabilir
                    // fetch(appConfig.remoteLogging.endpoint, {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify(logEntry)
                    // });
                }
            }
        } catch (error) {
            // Loglama sisteminde hata oluşması durumunda sessizce devam et
            console.error("[Logger] Uzak loglama sistemine gönderim hatası:", error);
        }
    }
}

// Singleton olarak Logger örneği oluştur
const instance = new Logger();

// Statik metodlar
export default {
    // Log seviyeleri
    LOG_LEVELS,
    
    // Log seviyesi ayarlama
    setLogLevel(level) {
        instance.setLogLevel(level);
    },
    
    // Temel loglama metodları
    debug(message, data) {
        instance.debug(message, data);
    },
    
    info(message, data) {
        instance.info(message, data);
    },
    
    warn(message, data) {
        instance.warn(message, data);
    },
    
    error(message, data) {
        instance.error(message, data);
    },
    
    // Log yönetim metodları
    exportLogs() {
        return instance.exportLogs();
    },
    
    clearLogs() {
        return instance.clearLogs();
    },
    
    getRecentLogs(count) {
        return instance.getRecentLogs(count);
    },
    
    getLogsByLevel(level) {
        return instance.getLogsByLevel(level);
    },
    
    getLogsByTimeRange(startTime, endTime) {
        return instance.getLogsByTimeRange(startTime, endTime);
    },
    
    searchLogs(searchTerm) {
        return instance.searchLogs(searchTerm);
    }
};