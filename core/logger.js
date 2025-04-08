/**
 * Logger Modülü
 */

// Global appConfig'den ayarları al
const config = window.appConfig || { 
    logLevels: { debug: true, info: true, warn: true, error: true },
    debugMode: true
};

// Logger sınıfı
class Logger {
    constructor(module) {
        this.module = module;
    }
    
    debug(message, data) {
        if (config.logLevels.debug && config.debugMode) {
            console.debug(`[${this.module}] ${message}`, data || '');
        }
    }
    
    info(message, data) {
        if (config.logLevels.info) {
            console.info(`[${this.module}] ${message}`, data || '');
        }
    }
    
    warn(message, data) {
        if (config.logLevels.warn) {
            console.warn(`[${this.module}] ${message}`, data || '');
        }
    }
    
    error(message, error) {
        if (config.logLevels.error) {
            console.error(`[${this.module}] ${message}`, error || '');
        }
    }
}

// Global logger'ı ata
window.logger = function(module) {
    return new Logger(module);
}

console.log("[Logger] Logger modülü başarıyla yüklendi");
