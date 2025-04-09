/**
 * Yapay Zeka Entegrasyon Modülü
 * 
 * Bu modül yapay zeka modüllerinin koordinasyonu ve 
 * üretim planlama sistemine entegrasyonu için kullanılır.
 */

class AIIntegrationService {
    constructor() {
        this.modules = {
            productionML: null,
            productionPlanner: null,
            chatbot: null
        };
        this.ready = false;
        this.initialize();
    }

    async initialize() {
        console.log('Yapay Zeka Entegrasyon Servisi başlatılıyor...');
        try {
            // Makine öğrenmesi modüllerini kontrol et
            if (window.productionML) {
                this.modules.productionML = window.productionML;
                console.log('Üretim ML modülü bulundu');
            }

            if (window.productionPlanner) {
                this.modules.productionPlanner = window.productionPlanner;
                console.log('Üretim planlayıcı modülü bulundu');
            }

            // EventBus bağlantıları
            this.setupEventBusHandlers();

            // Chatbot ile entegrasyon
            this.enhanceChatbotWithProductionML();

            this.ready = true;
            console.log('Yapay Zeka Entegrasyonu tamamlandı');
        } catch (error) {
            console.error('Yapay Zeka Entegrasyon Servisi başlatılırken hata:', error);
            if (window.eventBus) {
                window.eventBus.emit('ai:error', {
                    module: 'integration',
                    error: error.message
                });
            }
        }
    }

    setupEventBusHandlers() {
        if (!window.eventBus) return;

        // Üretim tahmini isteklerini dinle
        window.eventBus.on('production:requestEstimate', (data) => {
            this.handleProductionEstimateRequest(data);
        });

        // Üretim planı isteklerini dinle
        window.eventBus.on('production:requestSchedule', (data) => {
            this.handleProductionScheduleRequest(data);
        });

        // Yapay zekadan teknik bilgi isteklerini dinle
        window.eventBus.on('ai:requestTechnicalInfo', (data) => {
            this.handleTechnicalInfoRequest(data);
        });

        console.log('Yapay zeka entegrasyonu için EventBus bağlantıları kuruldu');
    }

    handleProductionEstimateRequest(data) {
        if (!this.modules.productionML) {
            console.warn('Üretim ML modülü henüz yüklenemedi');
            return null;
        }

        try {
            const estimate = this.modules.productionML.predictProductionDays(data);
            console.log(`"${data.cellType}" hücresi için üretim tahmini: ${estimate} gün`);
            
            // Sonucu EventBus üzerinden bildir
            if (window.eventBus) {
                window.eventBus.emit('production:estimate', {
                    requestData: data,
                    estimate
                });
            }
            
            return estimate;
        } catch (error) {
            console.error('Üretim tahmini hatası:', error);
            return null;
        }
    }

    handleProductionScheduleRequest(data) {
        if (!this.modules.productionML) {
            console.warn('Üretim ML modülü henüz yüklenemedi');
            return null;
        }

        try {
            // Mevcut üretim programını al
            const currentSchedule = [];
            
            // Üretim takviminden mevcut görevleri ekle (varsa)
            if (window.productionPlanner && window.productionPlanner.currentSchedule) {
                currentSchedule.push(...window.productionPlanner.currentSchedule);
            }
            
            // Üretim programını oluştur
            const scheduleSuggestion = this.modules.productionML.suggestProductionSchedule(data, currentSchedule);
            
            console.log(`"${data.cellType}" hücresi için üretim programı:`, scheduleSuggestion);
            
            // Sonucu EventBus üzerinden bildir
            if (window.eventBus) {
                window.eventBus.emit('production:schedule', {
                    requestData: data,
                    schedule: scheduleSuggestion
                });
            }
            
            return scheduleSuggestion;
        } catch (error) {
            console.error('Üretim programı oluşturma hatası:', error);
            return null;
        }
    }

    handleTechnicalInfoRequest(data) {
        // Burada ürüne ait teknik bilgileri Yapay Zeka ile bulabilir
        // ve gerekirse üretim tahmini için kullanabiliriz
        console.log('Teknik bilgi isteği:', data);
    }

    enhanceChatbotWithProductionML() {
        // Chatbot'un productionML özelliklerini kullanmasını sağla
        const originalQueryAI = window.queryDeepseekAI;
        
        if (typeof originalQueryAI === 'function') {
            console.log('Chatbot yapay zeka üretim yetenekleriyle genişletiliyor');
            
            window.queryDeepseekAI = async function(userMessage) {
                const lowerMessage = userMessage.toLowerCase();
                
                // Eğer mesaj üretim tahmini ile ilgili ise
                if ((lowerMessage.includes('üretim') || lowerMessage.includes('üret') || lowerMessage.includes('imalat')) && 
                    (lowerMessage.includes('süre') || lowerMessage.includes('zaman') || lowerMessage.includes('ne kadar'))) {
                    
                    try {
                        // Hangi hücre tipi hakkında soru soruluyor?
                        let cellType = null;
                        if (lowerMessage.includes('rm 36 cb')) cellType = 'RM 36 CB';
                        else if (lowerMessage.includes('rm 36 lb')) cellType = 'RM 36 LB';
                        else if (lowerMessage.includes('rm 36 fl')) cellType = 'RM 36 FL';
                        else if (lowerMessage.includes('rmu')) cellType = 'RMU';
                        
                        // Eğer belirli bir hücre tipi sorgulanmışsa ve ML modülü mevcutsa
                        if (cellType && window.productionML) {
                            const orderDetails = {
                                cellType: cellType,
                                voltage: '36kV',
                                current: '630A',
                                customDesign: false
                            };
                            
                            // Üretim süresi tahminini al
                            const estimatedDays = window.productionML.predictProductionDays(orderDetails);
                            
                            // Olası üretim programını öner
                            const scheduleSuggestion = window.productionML.suggestProductionSchedule(orderDetails);
                            
                            // Chatbot'un üretim bilgisiyle zenginleştirilmiş cevabını oluştur
                            return `**Yapay Zeka Üretim Tahmini:**

${cellType} tipi bir hücrenin üretimi yaklaşık **${estimatedDays} gün** sürecektir.

En uygun üretim başlangıç tarihi: ${new Date(scheduleSuggestion.suggestedStartDate).toLocaleDateString('tr-TR')}
Tahmini bitiş tarihi: ${new Date(scheduleSuggestion.suggestedEndDate).toLocaleDateString('tr-TR')}

**Üretim Adımları:**
${scheduleSuggestion.stagesTimeline.map(stage => {
    const stageName = {
        electricDesign: 'Elektrik Tasarım',
        mechanicalDesign: 'Mekanik Tasarım',
        purchasing: 'Satın Alma',
        mechanicalProduction: 'Mekanik Üretim',
        innerAssembly: 'İç Montaj',
        cabling: 'Kablaj',
        generalAssembly: 'Genel Montaj',
        testing: 'Test'
    }[stage.stage] || stage.stage;
    
    return `- ${stageName}: ${new Date(stage.start).toLocaleDateString('tr-TR')} - ${new Date(stage.end).toLocaleDateString('tr-TR')} (${stage.duration} gün)`;
}).join('\n')}

Bu tahmin, geçmiş üretim verilerimize dayanmaktadır ve mevcut üretim kapasitesi dikkate alınmıştır. Özel gereksinimler veya malzeme tedarik süreleri bu tahmini etkileyebilir.`;
                        }
                    } catch (error) {
                        console.error('Chatbot üretim tahmini hatası:', error);
                    }
                }
                
                // Üretim tahminiyle ilgili değilse orijinal fonksiyonu kullan
                return originalQueryAI(userMessage);
            };
        }
    }

    // Yeni sipariş için tahmin ve planlama yap
    analyzeNewOrder(orderData) {
        if (!this.ready || !this.modules.productionML) {
            console.warn('Yapay zeka modülleri henüz hazır değil');
            return null;
        }
        
        try {
            // Üretim süresi tahmini
            const estimatedDays = this.modules.productionML.predictProductionDays(orderData);
            
            // Üretim programı önerisi
            const scheduleSuggestion = this.modules.productionML.suggestProductionSchedule(orderData);
            
            // Üretim çakışma kontrolü
            const conflicts = this.modules.productionML.checkScheduleConflicts(
                scheduleSuggestion, 
                window.productionPlanner?.currentSchedule || []
            );
            
            return {
                estimatedDays,
                schedule: scheduleSuggestion,
                conflicts,
                hasConflicts: conflicts && conflicts.length > 0
            };
        } catch (error) {
            console.error('Sipariş analiz hatası:', error);
            return null;
        }
    }
}

// Servis örneğini oluştur
window.aiIntegration = new AIIntegrationService();

console.log('AI Entegrasyon Servisi yüklendi');