/**
 * AI Entegrasyon Modülü
 * Tüm yapay zeka yeteneklerini sistemle entegre eder
 */

class AIIntegration {
    constructor() {
        this.config = {
            enabled: true,
            provider: 'deepseek',
            apiKey: window.DEEPSEEK_API_KEY || 'sk-3a17ae40b3e445528bc988f04805e54b',
            models: {
                text: 'deepseek-chat',
                analysis: 'deepseek-chat',
                technical: 'deepseek-chat'
            },
            temperature: 0.7,
            maxTokens: 1500,
            defaultSystemPrompt: `Sen MehmetEndüstriyelTakip sisteminin yapay zeka asistanısın. 
                                Orta Gerilim Hücre üretimi konusunda uzman bir mühendis olarak davranıyorsun.
                                Elektrik ve mekanik bileşenler, üretim süreçleri ve teknik özellikler hakkında derin bilgi sahibisin.`
        };
        
        this.capabilities = {
            chatbot: true,
            technicalAssistant: true,
            materialAnalysis: true,
            productionForecasting: false, // Henüz aktif değil
            documentAnalysis: false // Henüz aktif değil
        };
        
        this.technicalKnowledge = {
            // RM serisi hücreler hakkında bilgiler
            'rm36cb': `RM 36 CB (Circuit Breaker) hücresi, 36kV gerilim seviyesinde çalışan kesicili hücredir.
                      Nominal akım değeri 630A-2500A arasında olup, kısa devre akımı 16kA-25kA'dır.
                      Metal muhafazalı yapıda olup, IEC 62271-200 standardına uygundur.`,
                      
            'rm36lb': `RM 36 LB (Load-Break) hücresi, 36kV gerilim seviyesinde çalışan yük ayırıcılı hücredir.
                      Nominal akım değeri 630A-1250A arasında olup, genellikle hat besleme amaçlı kullanılır.`,
                      
            'rm36fl': `RM 36 FL (Fuse-Link) hücresi, 36kV gerilim seviyesinde çalışan sigortalı ayırıcı hücresidir.
                      Genellikle trafo koruması için kullanılır, sigorta değerleri 6.3A-63A arasında değişir.`
        };
        
        this.modules = {};
        this.initialized = false;
        
        this.init();
    }
    
    /**
     * Modülü başlatır
     */
    init() {
        // API anahtarı kontrolü
        if (!this.config.apiKey) {
            console.warn('AI Entegrasyon: API anahtarı bulunamadı, demo mod kullanılacak');
            this.config.demoMode = true;
        }
        
        // Event Bus kontrolü
        if (!window.eventBus) {
            console.warn('AI Entegrasyon: Event Bus bulunamadı, kısıtlı işlevsellik');
        } else {
            // Olay dinleyicileri ekle
            this.registerEventListeners();
        }
        
        this.loadModules();
        this.initialized = true;
        
        console.log('AI Entegrasyon modülü başarıyla başlatıldı');
        
        // Hazır olduğunu bildir
        if (window.eventBus) {
            window.eventBus.emit(window.SystemEvents.AI_READY, {
                enabled: this.config.enabled,
                capabilities: this.capabilities,
                provider: this.config.provider
            });
        }
    }
    
    /**
     * Alt modülleri yükler
     */
    loadModules() {
        // AI servisi bağlantısı
        if (window.aiService) {
            this.modules.aiService = window.aiService;
            console.log('AI Servisi bağlandı');
        }
        
        // Chatbot modülü
        if (window.chatbot) {
            this.modules.chatbot = window.chatbot;
            console.log('Chatbot modülü bağlandı');
        }
        
        // AI Analytics modülü
        if (window.aiAnalytics) {
            this.modules.aiAnalytics = window.aiAnalytics;
            console.log('AI Analytics modülü bağlandı');
        }
    }
    
    /**
     * Event Bus dinleyicileri ekler
     */
    registerEventListeners() {
        if (!window.eventBus) return;
        
        // Teknik sorgulamalar için dinleyici
        window.eventBus.on('technical:query', data => {
            this.handleTechnicalQuery(data.question, data.context);
        });
        
        // Chatbot mesajları için dinleyici
        window.eventBus.on('chatbot:message', data => {
            this.handleChatbotQuery(data.message, data.messageId);
        });
        
        // Malzeme analizi için dinleyici
        window.eventBus.on('material:analyze', data => {
            this.analyzeMaterialRequirements(data.orders, data.inventory);
        });
        
        // AI Hatalarını dinle
        window.eventBus.on(window.SystemEvents.AI_ERROR, data => {
            console.error('AI Hatası:', data);
            this.handleAIError(data);
        });
    }
    
    /**
     * Teknik sorgulamaları işler
     * @param {string} question - Teknik soru
     * @param {object} context - İlave bağlam bilgisi
     * @returns {Promise} - Yanıt sözü
     */
    async handleTechnicalQuery(question, context = {}) {
        try {
            console.log('Teknik sorgulama:', question);
            
            // Önce yerel teknik bilgi tabanını kontrol et
            const localAnswer = this.findInTechnicalKnowledge(question);
            if (localAnswer) {
                console.log('Yerel teknik bilgi bulundu');
                this.sendResponse('technical:response', {
                    answer: localAnswer,
                    source: 'local',
                    question
                });
                return localAnswer;
            }
            
            // Yerel bilgi yoksa AI servisine sor
            if (this.modules.aiService) {
                console.log('AI servisi ile teknik sorgulama yapılıyor');
                
                const systemPrompt = `Sen bir orta gerilim hücre tasarımı ve üretimi konusunda uzman bir mühendissin.
                                      Soruları teknik doğrulukla ve standartlara uygun şekilde cevapla.
                                      Elektrik mühendisliği terimlerini doğru kullan.
                                      Cevaplarını kısa ve öz tut, ancak gerekli teknik detayları atlamadan.`;
                
                const response = await this.modules.aiService.query(question, {
                    systemPrompt,
                    temperature: 0.3, // Daha kesin yanıtlar için düşük sıcaklık
                    context
                });
                
                if (response.error) {
                    throw new Error(response.error);
                }
                
                this.sendResponse('technical:response', {
                    answer: response.content || response,
                    source: 'ai',
                    question,
                    model: this.config.models.technical
                });
                
                return response.content || response;
            }
            
            // AI servisi yoksa demo yanıt
            return this.getDemoTechnicalResponse(question);
            
        } catch (error) {
            console.error('Teknik sorgu hatası:', error);
            
            // Hata bildir
            this.sendResponse(window.SystemEvents.AI_ERROR, {
                message: 'Teknik sorgulama hatası',
                details: error.message,
                type: 'technical'
            });
            
            return {
                error: true,
                message: 'Teknik bilgiyi şu anda yükleyemiyorum. Lütfen daha sonra tekrar deneyin.'
            };
        }
    }
    
    /**
     * Yerel teknik bilgi tabanında arama yapar
     * @param {string} question - Aranan soru
     * @returns {string|null} - Bulunan yanıt veya null
     */
    findInTechnicalKnowledge(question) {
        const lowerQuestion = question.toLowerCase();
        
        // Hücre tiplerine göre arama
        if (lowerQuestion.includes('rm 36 cb') || lowerQuestion.includes('rm36cb')) {
            return this.technicalKnowledge.rm36cb;
        }
        
        if (lowerQuestion.includes('rm 36 lb') || lowerQuestion.includes('rm36lb')) {
            return this.technicalKnowledge.rm36lb;
        }
        
        if (lowerQuestion.includes('rm 36 fl') || lowerQuestion.includes('rm36fl')) {
            return this.technicalKnowledge.rm36fl;
        }
        
        // Belirli teknik terimler için arama
        if (lowerQuestion.includes('akım trafosu') || lowerQuestion.includes('current transformer')) {
            return `RM 36 CB hücrelerinde genellikle 200-400/5-5A veya 300-600/5-5A değerlerinde toroidal tip akım trafoları kullanılır. 
                   Bu trafolar 5P20 koruma sınıfında ve 7,5/15VA gücündedir. Canias kodları: 144866% (KAP-80/190-95) veya 142227% (KAT-85/190-95).`;
        }
        
        if (lowerQuestion.includes('sigorta') || lowerQuestion.includes('fuse')) {
            return `RM 36 FL hücrelerinde genellikle 6.3A-63A arasında HH tipi yüksek gerilim sigortaları kullanılır. 
                   Sigorta seçimi korunacak trafonun gücüne göre yapılır. 24kV için CEF markalı, 36kV için C&S markalı sigortalar tercih edilir.`;
        }
        
        // Genel terimler için bulunamadı
        return null;
    }
    
    /**
     * Demo teknik yanıt üretir (gerçek API bağlantısı yoksa)
     * @param {string} question - Soru
     * @returns {object} - Demo yanıt
     */
    getDemoTechnicalResponse(question) {
        const lowerQuestion = question.toLowerCase();
        let answer = 'Bu konuda teknik bilgi mevcut değil.';
        
        // Bazı anahtar kelimelere göre yanıt üret
        if (lowerQuestion.includes('akım trafosu') || lowerQuestion.includes('current transformer')) {
            answer = 'RM 36 CB hücresinde genellikle 200-400/5-5A 5P20 7,5/15VA veya 300-600/5-5A 5P20 7,5/15VA özelliklerinde toroidal tip akım trafoları kullanılmaktadır. Bu trafolar primer koruma için kullanılır.';
        } else if (lowerQuestion.includes('bara') || lowerQuestion.includes('busbar')) {
            answer = 'RM 36 serisi için 40x10mm kesitinde elektrolitik bakır baralar kullanılır. Standard boyları 582mm ve 432mm\'dir. Akım taşıma kapasitesi 1250A\'dir.';
        } else if (lowerQuestion.includes('gerilim trafosu') || lowerQuestion.includes('voltage transformer')) {
            answer = 'RM 36 serisi hücrelerde gerilim ölçümü için 36kV/√3 / 100V/√3 dönüşüm oranına sahip gerilim trafoları kullanılır. Doğruluk sınıfı 0.5, gücü 30VA\'dır.';
        } else {
            answer = 'RM 36 serisi hücreler, 36kV orta gerilim için tasarlanmış metal muhafazalı hava izoleli hücrelerdir. Ana bileşenler: kesici/yük ayırıcı, akım trafosu, gerilim trafosu, koruma rölesi ve bara sisteminden oluşur.';
        }
        
        return {
            content: answer,
            source: 'demo',
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Chatbot mesajlarını işler
     * @param {string} message - Kullanıcı mesajı
     * @param {string} messageId - Mesaj ID'si
     */
    async handleChatbotQuery(message, messageId) {
        try {
            console.log('Chatbot mesajı alındı:', message);
            
            // AI servisi var mı?
            if (this.modules.aiService) {
                const response = await this.modules.aiService.query(message, {
                    temperature: 0.7,
                    context: { messageId }
                });
                
                if (response.error) {
                    throw new Error(response.error);
                }
                
                this.sendResponse('chatbot:response', {
                    message: response.content || response,
                    messageId,
                    timestamp: new Date().toISOString()
                });
                
                return response.content || response;
            }
            
            // AI servisi yoksa demo yanıt
            return this.getDemoChatResponse(message, messageId);
            
        } catch (error) {
            console.error('Chatbot yanıt hatası:', error);
            
            // Hata bildir
            this.sendResponse(window.SystemEvents.AI_ERROR, {
                message: 'Chatbot yanıt hatası',
                details: error.message,
                type: 'chatbot',
                messageId
            });
            
            // Kullanıcıya hata yanıtı gönder
            this.sendResponse('chatbot:response', {
                message: 'Üzgünüm, şu anda yanıt veremiyorum. Teknik bir sorun yaşıyorum.',
                messageId,
                timestamp: new Date().toISOString(),
                isError: true
            });
        }
    }
    
    /**
     * Demo chatbot yanıtı üretir
     * @param {string} message - Kullanıcı mesajı
     * @param {string} messageId - Mesaj ID
     */
    getDemoChatResponse(message, messageId) {
        const lowerMessage = message.toLowerCase();
        let response;
        
        // Temel yanıtlar
        if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
            response = 'Merhaba! Size nasıl yardımcı olabilirim?';
        } else if (lowerMessage.includes('sipariş')) {
            response = 'Siparişlerle ilgili bilgileri Siparişler sayfasında görüntüleyebilirsiniz. Size yardımcı olabilmem için sipariş numarası verebilir misiniz?';
        } else if (lowerMessage.includes('malzeme')) {
            response = 'Malzeme stoklarını Malzeme Yönetimi sayfasında takip edebilirsiniz. Kritik stok seviyesine düşen malzemeleri sistem otomatik olarak işaretler.';
        } else {
            response = 'Bu konuda size daha detaylı bilgi verebilmem için lütfen sorunuzu biraz daha açar mısınız?';
        }
        
        // Demo yanıtı oluştur
        const result = {
            message: response,
            messageId,
            timestamp: new Date().toISOString(),
            source: 'demo'
        };
        
        // Event ile yanıtı gönder
        this.sendResponse('chatbot:response', result);
        
        return result;
    }
    
    /**
     * Malzeme gereksinimleri analizi yapar
     * @param {Array} orders - Sipariş listesi
     * @param {Array} inventory - Envanter listesi
     */
    async analyzeMaterialRequirements(orders, inventory) {
        try {
            console.log('Malzeme analizi başlatılıyor');
            
            // Basit analiz algoritması (gerçek sistemde daha karmaşık olacaktır)
            const analysis = {
                requiredMaterials: [],
                criticalMaterials: [],
                sufficientMaterials: [],
                suggestions: []
            };
            
            // Her sipariş için gerekli malzemeleri hesapla
            orders.forEach(order => {
                // Örnek bir hesaplama - gerçek sistemde her hücre tipi için farklı hesaplamalar yapılmalıdır
                if (order.cellType === 'RM 36 CB') {
                    // CB hücresi için malzemeler
                    this.addMaterialRequirement(analysis, 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', 1, inventory, '137998%');
                    this.addMaterialRequirement(analysis, 'KAP-80/190-95 Akım Trafosu', 3, inventory, '144866%');
                    this.addMaterialRequirement(analysis, '582mm Bara', 6, inventory, '109367%');
                } else if (order.cellType === 'RM 36 LB') {
                    // LB hücresi için malzemeler
                    this.addMaterialRequirement(analysis, 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', 1, inventory, '137998%');
                    this.addMaterialRequirement(analysis, '582mm Bara', 3, inventory, '109367%');
                    this.addMaterialRequirement(analysis, '432mm Bara', 3, inventory, '109363%');
                }
            });
            
            // Kritik malzemeleri belirle ve önerilerde bulun
            analysis.requiredMaterials.forEach(material => {
                if (material.stock < material.required) {
                    // Kritik malzeme
                    analysis.criticalMaterials.push(material);
                    
                    // Aciliyet durumuna göre öneriler
                    if (material.stock === 0) {
                        analysis.suggestions.push({
                            material: material.name,
                            code: material.code,
                            action: 'ACİL SİPARİŞ',
                            priority: 'high',
                            message: `${material.name} stokta yok! Hemen sipariş verilmeli.`
                        });
                    } else {
                        const shortageRatio = material.stock / material.required;
                        if (shortageRatio < 0.3) {
                            // Ciddi eksiklik
                            analysis.suggestions.push({
                                material: material.name,
                                code: material.code,
                                action: 'SİPARİŞ VER',
                                priority: 'medium',
                                message: `${material.name} kritik seviyenin altında. Sipariş verilmeli.`
                            });
                        } else {
                            // Hafif eksiklik
                            analysis.suggestions.push({
                                material: material.name,
                                code: material.code,
                                action: 'TAKİP ET',
                                priority: 'low',
                                message: `${material.name} stok seviyesi düşük. Takip edilmeli.`
                            });
                        }
                    }
                } else {
                    // Yeterli malzeme
                    analysis.sufficientMaterials.push(material);
                }
            });
            
            // Analiz sonucunu gönder
            this.sendResponse('material:analysis', {
                analysis,
                timestamp: new Date().toISOString(),
                orderCount: orders.length
            });
            
            return analysis;
            
        } catch (error) {
            console.error('Malzeme analizi hatası:', error);
            
            // Hata bildir
            this.sendResponse(window.SystemEvents.AI_ERROR, {
                message: 'Malzeme analizi hatası',
                details: error.message,
                type: 'material'
            });
            
            return {
                error: true,
                message: 'Malzeme analizi yapılamadı',
                details: error.message
            };
        }
    }
    
    /**
     * Malzeme gereksinimi ekler
     * @private
     */
    addMaterialRequirement(analysis, materialName, quantity, inventory, code) {
        // Mevcut malzemeyi bul
        const existingMaterial = analysis.requiredMaterials.find(m => m.name === materialName);
        
        if (existingMaterial) {
            // Zaten eklenmişse miktarı güncelle
            existingMaterial.required += quantity;
        } else {
            // Yeni malzeme ekle
            const stockItem = inventory.find(i => i.name === materialName || i.code === code);
            const stock = stockItem ? stockItem.stock : 0;
            
            analysis.requiredMaterials.push({
                name: materialName,
                code: code,
                required: quantity,
                stock: stock,
                shortage: Math.max(0, quantity - stock)
            });
        }
    }
    
    /**
     * AI hataları için yedek çözümler üretir
     * @param {object} errorData - Hata bilgileri
     */
    handleAIError(errorData) {
        const { type, messageId } = errorData;
        
        // Hata tipine göre işlem
        switch (type) {
            case 'technical':
                console.log('Teknik AI hatası için yedek çözüm aranıyor');
                // Demo yanıt göndermek gibi bir çözüm olabilir
                break;
                
            case 'chatbot':
                console.log('Chatbot hatası için yedek çözüm');
                // Basit bir hata mesajı gönder
                if (messageId) {
                    this.sendResponse('chatbot:response', {
                        message: 'Üzgünüm, teknik bir sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
                        messageId,
                        timestamp: new Date().toISOString(),
                        isError: true
                    });
                }
                break;
                
            case 'material':
                console.log('Malzeme analizi hatası için yedek çözüm');
                // Basit varsayılan analiz sonucu gönder
                break;
                
            default:
                console.log('Bilinmeyen AI hatası');
        }
    }
    
    /**
     * EventBus ile yanıt gönderir
     * @private
     */
    sendResponse(eventName, data) {
        if (window.eventBus) {
            window.eventBus.emit(eventName, data);
            return true;
        }
        return false;
    }
}

// Global AI entegrasyon nesnesi oluştur
window.aiIntegration = new AIIntegration();

console.log('AI Entegrasyon modülü yüklendi');