/**
 * Üretim Süresi Tahmin Modülü
 * 
 * Bu modül, geçmiş üretim verilerini kullanarak makine öğrenimi ile
 * yeni siparişlerin tahmini üretim sürelerini hesaplar ve en uygun üretim
 * planlamasını oluşturur.
 */

class ProductionMLService {
    constructor() {
        this.trainingData = [];
        this.modelTrained = false;
        this.defaultProductionTimes = {
            'RM 36 CB': {
                base: 14, // Gün cinsinden temel üretim süresi
                electricDesign: 2,
                mechanicalDesign: 3,
                purchasing: 3,
                mechanicalProduction: 4,
                innerAssembly: 3,
                cabling: 4,
                generalAssembly: 3,
                testing: 2
            },
            'RM 36 LB': {
                base: 12,
                electricDesign: 2,
                mechanicalDesign: 2,
                purchasing: 3,
                mechanicalProduction: 3,
                innerAssembly: 3,
                cabling: 3,
                generalAssembly: 2,
                testing: 2
            },
            'RM 36 FL': {
                base: 10,
                electricDesign: 1,
                mechanicalDesign: 2,
                purchasing: 2,
                mechanicalProduction: 3,
                innerAssembly: 2,
                cabling: 2,
                generalAssembly: 2,
                testing: 1
            },
            'RMU': {
                base: 16,
                electricDesign: 3,
                mechanicalDesign: 3,
                purchasing: 4,
                mechanicalProduction: 4,
                innerAssembly: 3,
                cabling: 5,
                generalAssembly: 3,
                testing: 2
            }
        };
        
        this.loadHistoricalData();
    }

    /**
     * Geçmiş üretim verilerini yükler
     */
    async loadHistoricalData() {
        try {
            // Gerçek uygulamada bu veriler API'den alınacaktır
            // Şimdilik örnek veriler oluşturuyoruz
            console.log('Üretim verileri yükleniyor...');
            
            // Simüle edilmiş geçmiş veriler
            this.trainingData = this.generateHistoricalData();
            
            console.log(`${this.trainingData.length} adet geçmiş üretim verisi yüklendi`);
            
            // Modeli eğit
            this.trainModel();
            
        } catch (error) {
            console.error('Üretim verileri yüklenirken hata:', error);
        }
    }
    
    /**
     * Örnek tarihsel veri oluşturur (gerçek sistemde API'den alınacak)
     */
    generateHistoricalData() {
        const data = [];
        const cellTypes = ['RM 36 CB', 'RM 36 LB', 'RM 36 FL', 'RMU'];
        const voltages = ['36kV', '24kV', '12kV'];
        const currents = ['630A', '1250A', '2000A', '4000A'];
        
        // Son 2 yıl için veri oluştur
        const today = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(today.getFullYear() - 2);
        
        // Her hücre tipi için 25-35 arası veri oluştur
        cellTypes.forEach(cellType => {
            const recordCount = Math.floor(Math.random() * 10) + 25; // 25-35 arası kayıt
            
            for (let i = 0; i < recordCount; i++) {
                // Rastgele tarih oluştur (son 2 yıl içinde)
                const orderDate = new Date(twoYearsAgo.getTime() + Math.random() * (today.getTime() - twoYearsAgo.getTime()));
                
                // Rastgele teknik özellikler seç
                const voltage = voltages[Math.floor(Math.random() * voltages.length)];
                const current = currents[Math.floor(Math.random() * currents.length)];
                
                // Rastgele müşteri seç
                const customers = ['AYEDAŞ', 'BEDAŞ', 'TEİAŞ', 'ENERJİSA', 'OSMANİYE ELEKTRİK'];
                const customer = customers[Math.floor(Math.random() * customers.length)];
                
                // Temel üretim süresini al
                const baseTime = this.defaultProductionTimes[cellType].base;
                
                // Ek özellikler ve varyasyonlara göre üretim süresini ayarla
                let actualProductionTime = baseTime;
                
                // Gerilim etkisi
                if (voltage === '36kV') actualProductionTime *= 1.1;
                else if (voltage === '12kV') actualProductionTime *= 0.9;
                
                // Akım etkisi
                if (current === '4000A') actualProductionTime *= 1.2;
                else if (current === '2000A') actualProductionTime *= 1.1;
                else if (current === '630A') actualProductionTime *= 0.9;
                
                // Rastgele varyasyon ekle (%20 sapma)
                const randomVariation = 0.8 + (Math.random() * 0.4); // 0.8 ile 1.2 arasında
                actualProductionTime *= randomVariation;
                
                // Tamamlanma için rastgele tarih oluştur
                const completionDate = new Date(orderDate);
                completionDate.setDate(completionDate.getDate() + Math.round(actualProductionTime));
                
                // Veri noktası oluştur
                data.push({
                    orderDate: orderDate.toISOString().split('T')[0],
                    completionDate: completionDate.toISOString().split('T')[0],
                    cellType,
                    voltage,
                    current,
                    customer,
                    actualProductionDays: Math.round(actualProductionTime),
                    customDesign: Math.random() > 0.7, // %30 ihtimalle özel tasarım
                    relayCoding: Math.random() > 0.5, // %50 ihtimalle röle kodlama gerekti
                    hasEnergyAnalyzer: Math.random() > 0.4 // %60 ihtimalle enerji analizörü var
                });
            }
        });
        
        // Verileri tarih sırasına göre sırala
        data.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
        
        return data;
    }
    
    /**
     * Makine öğrenimi modelini eğitir
     */
    trainModel() {
        if (this.trainingData.length === 0) {
            console.warn('Eğitim verisi olmadan model eğitilemez');
            return false;
        }
        
        console.log('Üretim süresi tahmin modeli eğitiliyor...');
        
        // Burada basit bir regresyon modeli kullanıyoruz
        // Gerçek bir uygulamada TensorFlow.js veya başka bir ML kütüphanesi kullanılabilir
        
        // Her hücre tipi için ortalama ve standart sapma hesapla
        this.modelStats = {};
        
        // Hücre tipine göre verileri grupla
        const groupedData = {};
        this.trainingData.forEach(item => {
            if (!groupedData[item.cellType]) {
                groupedData[item.cellType] = [];
            }
            groupedData[item.cellType].push(item);
        });
        
        // Her grup için istatistikleri hesapla
        Object.keys(groupedData).forEach(cellType => {
            const dataPoints = groupedData[cellType];
            
            // Ortalama üretim süresi
            const sum = dataPoints.reduce((acc, curr) => acc + curr.actualProductionDays, 0);
            const mean = sum / dataPoints.length;
            
            // Standart sapma
            const squareDiffs = dataPoints.map(item => {
                const diff = item.actualProductionDays - mean;
                return diff * diff;
            });
            const avgSquareDiff = squareDiffs.reduce((acc, curr) => acc + curr, 0) / squareDiffs.length;
            const stdDev = Math.sqrt(avgSquareDiff);
            
            // Faktör etkileri öğren
            const voltageEffect = this.calculateFeatureEffect(dataPoints, 'voltage');
            const currentEffect = this.calculateFeatureEffect(dataPoints, 'current');
            const customDesignEffect = this.calculateBooleanFeatureEffect(dataPoints, 'customDesign');
            const relayEffect = this.calculateBooleanFeatureEffect(dataPoints, 'relayCoding');
            const analyzerEffect = this.calculateBooleanFeatureEffect(dataPoints, 'hasEnergyAnalyzer');
            
            // Öğrenilen model parametrelerini sakla
            this.modelStats[cellType] = {
                mean,
                stdDev,
                voltageEffect,
                currentEffect,
                customDesignEffect,
                relayEffect,
                analyzerEffect,
                sampleSize: dataPoints.length
            };
        });
        
        this.modelTrained = true;
        console.log('Model eğitimi tamamlandı:', this.modelStats);
        
        // Modele dayalı örnek tahmin testi
        const testPrediction = this.predictProductionDays({
            cellType: 'RM 36 CB',
            voltage: '36kV',
            current: '1250A',
            customDesign: false,
            relayCoding: true,
            hasEnergyAnalyzer: true
        });
        console.log('Test tahmini (RM 36 CB):', testPrediction);
        
        return true;
    }
    
    /**
     * Özellik bazında etki faktörünü hesaplar
     */
    calculateFeatureEffect(dataPoints, featureName) {
        const uniqueValues = [...new Set(dataPoints.map(item => item[featureName]))];
        const effects = {};
        
        // Her değer için ortalama üretim süresini hesapla
        uniqueValues.forEach(value => {
            const filteredPoints = dataPoints.filter(item => item[featureName] === value);
            const avgDays = filteredPoints.reduce((acc, curr) => acc + curr.actualProductionDays, 0) / filteredPoints.length;
            effects[value] = avgDays;
        });
        
        // Etkileri normalleştir
        const baseline = Object.values(effects).reduce((a, b) => a + b, 0) / uniqueValues.length;
        
        const normalizedEffects = {};
        Object.keys(effects).forEach(key => {
            normalizedEffects[key] = effects[key] / baseline;
        });
        
        return normalizedEffects;
    }
    
    /**
     * Boolean özellikler için etki hesaplar
     */
    calculateBooleanFeatureEffect(dataPoints, featureName) {
        const withFeature = dataPoints.filter(item => item[featureName] === true);
        const withoutFeature = dataPoints.filter(item => item[featureName] === false);
        
        if (withFeature.length === 0 || withoutFeature.length === 0) {
            return { effect: 1.0 };
        }
        
        const avgWithFeature = withFeature.reduce((acc, curr) => acc + curr.actualProductionDays, 0) / withFeature.length;
        const avgWithoutFeature = withoutFeature.reduce((acc, curr) => acc + curr.actualProductionDays, 0) / withoutFeature.length;
        
        return {
            effect: avgWithFeature / avgWithoutFeature
        };
    }
    
    /**
     * Yeni bir sipariş için üretim süresi tahmini yapar
     */
    predictProductionDays(orderDetails) {
        if (!this.modelTrained) {
            console.warn('Model henüz eğitilmedi, varsayılan değerler kullanılıyor');
            return this.defaultProductionTimes[orderDetails.cellType]?.base || 14;
        }
        
        const { cellType } = orderDetails;
        
        // Hücre tipi için model istatistiklerini al
        const stats = this.modelStats[cellType];
        if (!stats) {
            console.warn(`${cellType} için yeterli veri yok, varsayılan değer kullanılıyor`);
            return this.defaultProductionTimes[cellType]?.base || 14;
        }
        
        // Temel tahmin
        let prediction = stats.mean;
        
        // Faktör etkilerini uygula
        if (stats.voltageEffect && stats.voltageEffect[orderDetails.voltage]) {
            prediction *= stats.voltageEffect[orderDetails.voltage];
        }
        
        if (stats.currentEffect && stats.currentEffect[orderDetails.current]) {
            prediction *= stats.currentEffect[orderDetails.current];
        }
        
        // Boolean özellikler için etkileri uygula
        if (orderDetails.customDesign && stats.customDesignEffect) {
            prediction *= stats.customDesignEffect.effect;
        }
        
        if (orderDetails.relayCoding && stats.relayEffect) {
            prediction *= stats.relayEffect.effect;
        }
        
        if (orderDetails.hasEnergyAnalyzer && stats.analyzerEffect) {
            prediction *= stats.analyzerEffect.effect;
        }
        
        // Son değerlendirme ve yuvarlama
        return Math.round(prediction);
    }
    
    /**
     * Hücre tipine göre üretim adımlarını ve sürelerini döndürür
     */
    getProductionStageTimeline(cellType) {
        const defaultTimes = this.defaultProductionTimes[cellType] || this.defaultProductionTimes['RM 36 CB'];
        
        return {
            electricDesign: defaultTimes.electricDesign,
            mechanicalDesign: defaultTimes.mechanicalDesign,
            purchasing: defaultTimes.purchasing,
            mechanicalProduction: defaultTimes.mechanicalProduction,
            innerAssembly: defaultTimes.innerAssembly,
            cabling: defaultTimes.cabling,
            generalAssembly: defaultTimes.generalAssembly,
            testing: defaultTimes.testing
        };
    }
    
    /**
     * Mevcut üretim planını ve yeni siparişin gereksinimlerini dikkate alarak
     * en uygun üretim zaman aralığı önerir
     */
    suggestProductionSchedule(orderDetails, productionSchedule = []) {
        const today = new Date();
        const estimatedDays = this.predictProductionDays(orderDetails);
        
        // Üretim adımlarının zaman çizelgesini al
        const stageTimeline = this.getProductionStageTimeline(orderDetails.cellType);
        
        // Mevcut yükü hesapla - tarih bazında kapasite kullanımı
        const capacityUsage = {};
        productionSchedule.forEach(item => {
            const start = new Date(item.start);
            const end = new Date(item.end);
            
            // Her gün için kapasite kullanımını artır
            for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
                const dateStr = day.toISOString().split('T')[0];
                capacityUsage[dateStr] = (capacityUsage[dateStr] || 0) + 1;
            }
        });
        
        // En erken başlangıç tarihi (bugünden itibaren)
        let earliestStart = new Date(today);
        earliestStart.setDate(earliestStart.getDate() + 1); // Yarından başla
        
        // Kapasite sınırı (günlük maksimum proje sayısı)
        const CAPACITY_LIMIT = 3;
        
        // En iyi başlangıç tarihini bul
        let bestStartDate = new Date(earliestStart);
        let lowestCapacity = Number.MAX_SAFE_INTEGER;
        let triedDays = 0;
        const MAX_DAYS_TO_TRY = 60; // En fazla 60 gün ileri bak
        
        // En düşük kapasiteli başlangıç tarihini bul
        while (triedDays < MAX_DAYS_TO_TRY) {
            const currentStart = new Date(earliestStart);
            currentStart.setDate(currentStart.getDate() + triedDays);
            
            // Bu başlangıç tarihinde tüm süre boyunca ortalama kapasite kullanımı
            let totalCapacity = 0;
            let daysOverCapacity = 0;
            
            for (let day = 0; day < estimatedDays; day++) {
                const checkDate = new Date(currentStart);
                checkDate.setDate(checkDate.getDate() + day);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                const currentCapacity = capacityUsage[dateStr] || 0;
                totalCapacity += currentCapacity;
                
                // Kapasite sınırını aşan günleri say
                if (currentCapacity >= CAPACITY_LIMIT) {
                    daysOverCapacity++;
                }
            }
            
            // Ortalama kapasite kullanımını hesapla
            const avgCapacity = totalCapacity / estimatedDays;
            
            // Daha iyi bir başlangıç tarihi mi?
            if (daysOverCapacity === 0 && avgCapacity < lowestCapacity) {
                lowestCapacity = avgCapacity;
                bestStartDate = new Date(currentStart);
                
                // Eğer kapasite kullanımı idealse daha fazla arama
                if (avgCapacity < 0.5) {
                    break;
                }
            }
            
            triedDays++;
        }
        
        // Bitiş tarihini hesapla
        const estimatedEndDate = new Date(bestStartDate);
        estimatedEndDate.setDate(estimatedEndDate.getDate() + estimatedDays);
        
        // Adım adım üretim planını oluştur
        const productionPlan = [];
        let currentDate = new Date(bestStartDate);
        
        // Her üretim adımı için
        Object.entries(stageTimeline).forEach(([stage, duration]) => {
            const stageStart = new Date(currentDate);
            const stageEnd = new Date(currentDate);
            stageEnd.setDate(stageEnd.getDate() + duration - 1);
            
            productionPlan.push({
                stage,
                start: stageStart.toISOString().split('T')[0],
                end: stageEnd.toISOString().split('T')[0],
                duration
            });
            
            currentDate.setDate(currentDate.getDate() + duration);
        });
        
        return {
            estimatedDays,
            suggestedStartDate: bestStartDate.toISOString().split('T')[0],
            suggestedEndDate: estimatedEndDate.toISOString().split('T')[0],
            averageCapacity: lowestCapacity,
            stagesTimeline: productionPlan
        };
    }
    
    /**
     * Mevcut üretim programındaki çakışmaları kontrol eder
     */
    checkScheduleConflicts(suggestedSchedule, existingSchedule) {
        const conflicts = [];
        const start = new Date(suggestedSchedule.suggestedStartDate);
        const end = new Date(suggestedSchedule.suggestedEndDate);
        
        existingSchedule.forEach(item => {
            const itemStart = new Date(item.start);
            const itemEnd = new Date(item.end);
            
            // Çakışma kontrolü
            if ((start <= itemEnd && end >= itemStart)) {
                conflicts.push({
                    orderId: item.id,
                    title: item.title,
                    conflictDays: Math.min(
                        Math.round((end - itemStart) / (1000 * 60 * 60 * 24)),
                        Math.round((itemEnd - start) / (1000 * 60 * 60 * 24))
                    ),
                    start: itemStart.toISOString().split('T')[0],
                    end: itemEnd.toISOString().split('T')[0]
                });
            }
        });
        
        return conflicts;
    }
    
    /**
     * Yeni bir üretim süresi tahmini yapıldığında geribildirim alır
     * ve modelin doğruluk oranını artırmak için öğrenmesini sağlar
     */
    provideFeedback(orderDetails, actualProductionDays) {
        // Tahmin ile gerçek değer arasındaki farkı hesapla
        const prediction = this.predictProductionDays(orderDetails);
        const error = actualProductionDays - prediction;
        
        console.log(`Tahmin: ${prediction} gün, Gerçek: ${actualProductionDays} gün, Hata: ${error} gün`);
        
        // Yeni veriyi eğitim setine ekle
        const newDataPoint = {
            ...orderDetails,
            actualProductionDays,
            feedbackDate: new Date().toISOString().split('T')[0]
        };
        
        this.trainingData.push(newDataPoint);
        
        // Belirli bir eşiğe ulaşınca modeli yeniden eğit
        if (this.trainingData.length % 10 === 0) {
            console.log('Yeterli yeni veri toplandı, model yeniden eğitiliyor...');
            this.trainModel();
        }
        
        return {
            previousPrediction: prediction,
            actualDays: actualProductionDays,
            error,
            improvement: Math.abs(error) < Math.abs(prediction * 0.2) // %20'den az hata olursa iyileşme var
        };
    }
}

// Singleton servis oluştur
const productionML = new ProductionMLService();

// Global olarak erişilebilir yap
window.productionML = productionML;

// Event Bus entegrasyonu
if (window.eventBus) {
    // Yeni sipariş ekleme olayını dinle
    window.eventBus.on('order:new', (orderData) => {
        const estimatedDays = productionML.predictProductionDays(orderData);
        console.log(`Yeni sipariş için tahmini üretim süresi: ${estimatedDays} gün`);
    });
    
    // Üretim tamamlandığında geribildirim al
    window.eventBus.on('production:completed', (data) => {
        if (data.orderDetails && data.actualDays) {
            productionML.provideFeedback(data.orderDetails, data.actualDays);
        }
    });
}

console.log('Üretim ML Servisi başlatıldı');
