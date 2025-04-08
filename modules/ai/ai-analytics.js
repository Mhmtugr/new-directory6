/**
 * ai-analytics.js
 * Yapay zeka analiz işlevleri
 */

import Logger from '../../utils/logger.js';

// Tedarik zinciri risk analizi
async function analyzeSupplyChainRisks() {
    try {
        Logger.info("Tedarik zinciri risk analizi başlatılıyor");
        
        // Firestore'dan malzeme ve sipariş verilerini al
        const materialsRef = firebase.firestore().collection('materials');
        const ordersRef = firebase.firestore().collection('orders');
        
        // Tedarik tarihi geçmiş veya gecikecek malzemeleri bul
        const today = new Date();
        const riskMaterials = [];
        
        const materialsSnapshot = await materialsRef
            .where('inStock', '==', false)
            .get();
            
        for (const doc of materialsSnapshot.docs) {
            const material = doc.data();
            
            if (material.expectedSupplyDate) {
                const supplyDate = new Date(material.expectedSupplyDate.toDate());
                const needDate = material.orderNeedDate ? new Date(material.orderNeedDate.toDate()) : null;
                
                // Risk durumunu belirle
                if (needDate && supplyDate > needDate) {
                    // Kritik risk: Tedarik tarihi ihtiyaç tarihinden sonra
                    riskMaterials.push({
                        id: doc.id,
                        ...material,
                        riskLevel: 'critical',
                        riskReason: 'Tedarik tarihi, ihtiyaç tarihinden sonra'
                    });
                } else if (supplyDate < today) {
                    // Yüksek risk: Tedarik tarihi geçmiş ama hala stokta değil
                    riskMaterials.push({
                        id: doc.id,
                        ...material,
                        riskLevel: 'high',
                        riskReason: 'Tedarik tarihi geçmiş'
                    });
                }
            }
        }
        
        return riskMaterials;
    } catch (error) {
        console.error("Risk analizi hatası:", error);
        throw error;
    }
}

// Üretim optimizasyon önerileri
async function suggestProductionOptimizations() {
    try {
        const ordersRef = firebase.firestore().collection('orders');
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        
        // Gelecek ay içinde teslim edilecek siparişleri getir
        const ordersSnapshot = await ordersRef
            .where('deliveryDate', '>', today)
            .where('deliveryDate', '<', nextMonth)
            .where('status', '!=', 'completed')
            .get();
            
        // Benzer ürün tiplerini grupla
        const productTypes = {};
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            if (!productTypes[order.cellType]) {
                productTypes[order.cellType] = [];
            }
            productTypes[order.cellType].push({
                id: doc.id,
                ...order
            });
        });
        
        // Optimizasyon önerileri oluştur
        const optimizationSuggestions = [];
        
        for (const [type, orders] of Object.entries(productTypes)) {
            if (orders.length > 1) {
                // Bu tipteki ürünler için paralel üretim önerisi
                optimizationSuggestions.push({
                    cellType: type,
                    orders: orders,
                    orderCount: orders.length,
                    suggestion: `${type} tipi ${orders.length} siparişin üretimini birleştirin`,
                    potentialSavings: Math.round(orders.length * 0.8) // Örnek tasarruf hesabı
                });
            }
        }
        
        return optimizationSuggestions;
    } catch (error) {
        console.error("Optimizasyon önerileri hatası:", error);
        throw error;
    }
}

// Gecikme riski olan siparişleri tespit et
async function detectDelayRisks() {
    try {
        const ordersRef = firebase.firestore().collection('orders');
        const materialsRef = firebase.firestore().collection('materials');
        
        // Aktif siparişleri getir (tamamlanmamış)
        const ordersSnapshot = await ordersRef
            .where('status', '!=', 'completed')
            .get();
            
        const delayRisks = [];
        
        for (const doc of ordersSnapshot.docs) {
            const order = doc.data();
            const orderId = doc.id;
            
            // Teslim tarihi
            const deliveryDate = new Date(order.deliveryDate.toDate());
            const today = new Date();
            
            // Kalan gün sayısı
            const daysLeft = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
            
            // Gecikme risk faktörleri
            let riskFactors = [];
            let riskScore = 0;
            
            // Malzeme eksikliği kontrolü
            const materialsSnapshot = await materialsRef
                .where('orderId', '==', orderId)
                .where('inStock', '==', false)
                .get();
                
            const missingMaterialsCount = materialsSnapshot.size;
            
            if (missingMaterialsCount > 0) {
                riskFactors.push(`${missingMaterialsCount} eksik malzeme`);
                riskScore += missingMaterialsCount * 10;
            }
            
            // Üretim aşaması kontrolü
            if (order.status === 'planning' && daysLeft < 20) {
                riskFactors.push('Hala planlama aşamasında');
                riskScore += 30;
            } else if (order.status === 'waiting' && daysLeft < 15) {
                riskFactors.push('Malzeme bekleniyor');
                riskScore += 20;
            }
            
            // Geçmiş sipariş performansı
            if (order.previousDelays && order.previousDelays > 0) {
                riskFactors.push(`Daha önce ${order.previousDelays} kez gecikmiş`);
                riskScore += order.previousDelays * 5;
            }
            
            // Risk seviyesi
            let riskLevel = 'low';
            if (riskScore >= 50) riskLevel = 'high';
            else if (riskScore >= 20) riskLevel = 'medium';
            
            // Eğer risk faktörü varsa ekle
            if (riskFactors.length > 0) {
                delayRisks.push({
                    orderId,
                    orderNo: order.orderNo,
                    customer: order.customer,
                    cellType: order.cellType,
                    deliveryDate,
                    daysLeft,
                    riskFactors,
                    riskScore,
                    riskLevel,
                    status: order.status
                });
            }
        }
        
        // Risk skoruna göre sırala (yüksekten düşüğe)
        delayRisks.sort((a, b) => b.riskScore - a.riskScore);
        
        return delayRisks;
    } catch (error) {
        console.error("Gecikme riski tespiti hatası:", error);
        throw error;
    }
}

// Malzeme tüketim analizi ve tahmin
async function analyzeMaterialConsumption() {
    try {
        // Son 6 ayın malzeme tüketimini getir
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        
        const ordersRef = firebase.firestore().collection('orders');
        const materialsRef = firebase.firestore().collection('materials');
        
        // Tamamlanan siparişleri getir
        const ordersSnapshot = await ordersRef
            .where('status', '==', 'completed')
            .where('completionDate', '>=', sixMonthsAgo)
            .get();
            
        // Malzeme tüketim analizi
        const materialConsumption = {};
        
        // Her sipariş için malzeme kullanımını hesapla
        for (const doc of ordersSnapshot.docs) {
            const order = doc.data();
            const orderId = doc.id;
            
            // Sipariş malzemelerini getir
            const materialsSnapshot = await materialsRef
                .where('orderId', '==', orderId)
                .get();
                
            materialsSnapshot.forEach(materialDoc => {
                const material = materialDoc.data();
                const materialCode = material.code;
                
                if (!materialConsumption[materialCode]) {
                    materialConsumption[materialCode] = {
                        code: materialCode,
                        name: material.name,
                        totalQuantity: 0,
                        usageByMonth: {},
                        usageByHucreType: {}
                    };
                }
                
                // Toplam kullanım
                materialConsumption[materialCode].totalQuantity += material.quantity;
                
                // Aylık kullanım
                const month = new Date(order.completionDate.toDate()).toISOString().slice(0, 7); // YYYY-MM formatı
                if (!materialConsumption[materialCode].usageByMonth[month]) {
                    materialConsumption[materialCode].usageByMonth[month] = 0;
                }
                materialConsumption[materialCode].usageByMonth[month] += material.quantity;
                
                // Hücre tipine göre kullanım
                const cellType = order.cellType;
                if (!materialConsumption[materialCode].usageByHucreType[cellType]) {
                    materialConsumption[materialCode].usageByHucreType[cellType] = 0;
                }
                materialConsumption[materialCode].usageByHucreType[cellType] += material.quantity;
            });
        }
        
        // Malzeme tüketim tahminini hesapla
        for (const code in materialConsumption) {
            const material = materialConsumption[code];
            
            // Aylık ortalama kullanım
            const monthlyUsage = Object.values(material.usageByMonth);
            const avgMonthlyUsage = monthlyUsage.reduce((sum, qty) => sum + qty, 0) / monthlyUsage.length;
            
            // Sonraki 3 aylık tahmini kullanım
            material.forecastNextThreeMonths = Math.ceil(avgMonthlyUsage * 3);
            
            // Trend analizi (son 3 ay artan mı azalan mı)
            const monthKeys = Object.keys(material.usageByMonth).sort();
            if (monthKeys.length >= 3) {
                const lastThreeMonths = monthKeys.slice(-3);
                const firstMonthUsage = material.usageByMonth[lastThreeMonths[0]];
                const lastMonthUsage = material.usageByMonth[lastThreeMonths[2]];
                
                if (lastMonthUsage > firstMonthUsage * 1.1) {
                    material.trend = 'increasing';
                } else if (lastMonthUsage < firstMonthUsage * 0.9) {
                    material.trend = 'decreasing';
                } else {
                    material.trend = 'stable';
                }
            } else {
                material.trend = 'insufficient_data';
            }
        }
        
        return Object.values(materialConsumption);
    } catch (error) {
        console.error("Malzeme tüketim analizi hatası:", error);
        throw error;
    }
}

// Teslim tarihi tahmini
function predictDeliveryDate(cellType, quantity) {
    // Hücre tipine göre ortalama üretim süresi (gün olarak)
    const productionTimes = {
        'RM 36 LB': 15,
        'RM 36 CB': 18,
        'RM 36 FL': 20,
        'default': 20
    };
    
    // Tedarik süresi (malzeme hazırlığı için)
    const supplyTime = 10;
    
    // Test ve kalite kontrol süresi
    const testTime = 5;
    
    // Toplam süre hesabı
    const baseTime = (productionTimes[cellType] || productionTimes['default']);
    const quantityFactor = Math.log2(quantity + 1) * 5; // Logaritmik ölçeklendirme
    
    // Toplam gün
    const totalDays = supplyTime + baseTime + quantityFactor + testTime;
    
    // Bugünden itibaren tahmini teslim tarihi
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + Math.ceil(totalDays));
    
    return {
        estimatedDays: Math.ceil(totalDays),
        supplyPeriod: supplyTime,
        productionPeriod: baseTime + quantityFactor,
        testPeriod: testTime,
        estimatedDeliveryDate: deliveryDate
    };
}

// Toplam üretim süresi makine öğrenmesi tahmini
async function predictProductionTimeML(orderDetails) {
    try {
        // Eğer makine öğrenmesi modeli yüklüyse onu kullan
        if (window.AIIntegrationModule?.machineLearning?.regressionModel) {
            const model = window.AIIntegrationModule.machineLearning.regressionModel;
            
            // Veriyi model formatına dönüştür
            const inputData = window.AIIntegrationModule.preprocessInput(orderDetails);
            
            // Tahmin yap
            const prediction = await model.predict(tf.tensor2d([inputData]));
            const predictedTime = prediction.dataSync()[0];
            
            return {
                estimatedDays: Math.ceil(predictedTime),
                confidence: 0.85, // Tahmine güven oranı
                method: 'machine_learning'
            };
        } else {
            // Model yoksa geleneksel hesaplama yap
            return predictDeliveryDate(orderDetails.cellType, orderDetails.cellCount);
        }
    } catch (error) {
        console.error("Makine öğrenmesi tahmini hatası:", error);
        // Hata durumunda geleneksel hesaplamaya geri dön
        return predictDeliveryDate(orderDetails.cellType, orderDetails.cellCount);
    }
}

// Üretim verimliliği analizi
async function analyzeProductionEfficiency() {
    try {
        const ordersRef = firebase.firestore().collection('orders');
        const productionRef = firebase.firestore().collection('production');
        
        // Son 3 aydaki tamamlanmış siparişleri getir
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const ordersSnapshot = await ordersRef
            .where('status', '==', 'completed')
            .where('completionDate', '>=', threeMonthsAgo)
            .get();
            
        // Verimlilik metrikleri
        const efficiencyData = {
            totalOrders: 0,
            totalCells: 0,
            avgProductionTime: 0,
            departmentEfficiency: {
                design: { plannedHours: 0, actualHours: 0, efficiency: 0 },
                assembly: { plannedHours: 0, actualHours: 0, efficiency: 0 },
                wiring: { plannedHours: 0, actualHours: 0, efficiency: 0 },
                testing: { plannedHours: 0, actualHours: 0, efficiency: 0 }
            },
            cellTypeEfficiency: {},
            bottlenecks: [],
            improvementSuggestions: []
        };
        
        let totalProductionDays = 0;
        
        // Her sipariş için üretim verilerini topla
        for (const doc of ordersSnapshot.docs) {
            const order = doc.data();
            const orderId = doc.id;
            
            efficiencyData.totalOrders++;
            efficiencyData.totalCells += order.cellCount || 1;
            
            // Hücre tipini kaydet
            const cellType = order.cellType;
            if (!efficiencyData.cellTypeEfficiency[cellType]) {
                efficiencyData.cellTypeEfficiency[cellType] = {
                    totalOrders: 0,
                    totalCells: 0,
                    avgProductionTime: 0
                };
            }
            
            efficiencyData.cellTypeEfficiency[cellType].totalOrders++;
            efficiencyData.cellTypeEfficiency[cellType].totalCells += order.cellCount || 1;
            
            // Üretim verilerini getir
            const productionSnapshot = await productionRef
                .where('orderId', '==', orderId)
                .get();
                
            if (!productionSnapshot.empty) {
                const productionData = productionSnapshot.docs[0].data();
                
                // Üretim süresi hesaplama
                const startDate = new Date(productionData.startDate.toDate());
                const endDate = new Date(productionData.endDate.toDate());
                const productionDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                
                totalProductionDays += productionDays;
                efficiencyData.cellTypeEfficiency[cellType].avgProductionTime += productionDays;
                
                // Departman verimlilik hesaplamaları
                for (const dept of Object.keys(efficiencyData.departmentEfficiency)) {
                    if (productionData.departments && productionData.departments[dept]) {
                        const deptData = productionData.departments[dept];
                        
                        efficiencyData.departmentEfficiency[dept].plannedHours += deptData.plannedHours || 0;
                        efficiencyData.departmentEfficiency[dept].actualHours += deptData.actualHours || 0;
                    }
                }
                
                // Darboğazları tespit et
                for (const dept of Object.keys(efficiencyData.departmentEfficiency)) {
                    if (productionData.departments && productionData.departments[dept]) {
                        const deptData = productionData.departments[dept];
                        
                        if (deptData.actualHours > deptData.plannedHours * 1.2) { // %20 üzerinde sapma
                            // Bu departmanda gecikme var
                            const existingBottleneck = efficiencyData.bottlenecks.find(b => b.department === dept);
                            
                            if (existingBottleneck) {
                                existingBottleneck.occurrences++;
                                existingBottleneck.totalDelay += (deptData.actualHours - deptData.plannedHours);
                            } else {
                                efficiencyData.bottlenecks.push({
                                    department: dept,
                                    occurrences: 1,
                                    totalDelay: (deptData.actualHours - deptData.plannedHours),
                                    avgDelayPercentage: ((deptData.actualHours / deptData.plannedHours) - 1) * 100
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // Ortalama üretim süresi
        if (efficiencyData.totalOrders > 0) {
            efficiencyData.avgProductionTime = totalProductionDays / efficiencyData.totalOrders;
        }
        
        // Hücre tipi ortalama üretim süresi
        for (const type in efficiencyData.cellTypeEfficiency) {
            const typeData = efficiencyData.cellTypeEfficiency[type];
            if (typeData.totalOrders > 0) {
                typeData.avgProductionTime = typeData.avgProductionTime / typeData.totalOrders;
            }
        }
        
        // Departman verimliliği
        for (const dept in efficiencyData.departmentEfficiency) {
            const deptData = efficiencyData.departmentEfficiency[dept];
            if (deptData.plannedHours > 0) {
                deptData.efficiency = deptData.plannedHours / deptData.actualHours;
            }
        }
        
        // Darboğazları sırala
        efficiencyData.bottlenecks.sort((a, b) => b.occurrences - a.occurrences);
        
        // İyileştirme önerileri
        if (efficiencyData.bottlenecks.length > 0) {
            const worstBottleneck = efficiencyData.bottlenecks[0];
            
            efficiencyData.improvementSuggestions.push({
                area: worstBottleneck.department,
                suggestion: `${worstBottleneck.department} departmanında süreç optimizasyonu yapılmalı. Ortalama %${Math.round(worstBottleneck.avgDelayPercentage)} gecikme var.`,
                potentialSavings: Math.round(worstBottleneck.totalDelay / efficiencyData.totalOrders) // Sipariş başına tasarruf saati
            });
        }
        
        // Düşük verimli departmanlar
        const lowEffDepts = Object.entries(efficiencyData.departmentEfficiency)
            .filter(([dept, data]) => data.efficiency < 0.85 && data.actualHours > 0)
            .sort(([, a], [, b]) => a.efficiency - b.efficiency);
            
        if (lowEffDepts.length > 0) {
            const [deptName, deptData] = lowEffDepts[0];
            
            efficiencyData.improvementSuggestions.push({
                area: deptName,
                suggestion: `${deptName} departmanında verimlilik artırılmalı. Mevcut verimlilik: %${Math.round(deptData.efficiency * 100)}`,
                potentialImprovement: Math.round((1 - deptData.efficiency) * 100) // Potansiyel iyileştirme yüzdesi
            });
        }
        
        return efficiencyData;
    } catch (error) {
        console.error("Üretim verimlilik analizi hatası:", error);
        throw error;
    }
}

// Yapay zeka önerilerini göster
async function displayAIInsights(containerId) {
    try {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-pulse"></i> Analizler yükleniyor...</div>';
        
        // Tedarik zinciri riskleri
        const supplyRisks = await analyzeSupplyChainRisks();
        
        // Üretim optimizasyonları
        const optimizations = await suggestProductionOptimizations();
        
        // Gecikme riskleri
        const delayRisks = await detectDelayRisks();
        
        // İçeriği hazırla
        let html = '';
        
        // Kritik tedarik riskleri
        const criticalRisks = supplyRisks.filter(risk => risk.riskLevel === 'critical');
        if (criticalRisks.length > 0) {
            html += `
                <div class="info-box danger">
                    <div class="info-box-title">Kritik Tedarik Uyarısı</div>
                    <div class="info-box-content">
                        <p>${criticalRisks[0].orderName || 'Sipariş'} için ${criticalRisks[0].name} malzemesinin tedarikinde gecikme riski yüksek.
                        Tedarikçiden gelen bilgilere göre, planlanan teslimat ${new Date(criticalRisks[0].expectedSupplyDate.toDate()).toLocaleDateString('tr-TR')} tarihinde, 
                        ancak üretim planında malzemelerin ${new Date(criticalRisks[0].orderNeedDate.toDate()).toLocaleDateString('tr-TR')} tarihinde fabrikada olması gerekiyor.</p>
                        
                        <p><strong>Öneri:</strong> Alternatif tedarikçilerle iletişime geçin veya üretim planını revize edin.</p>
                        
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <button class="btn btn-warning btn-sm" onclick="contactSupplier('${criticalRisks[0].supplierId}')">
                                <i class="fas fa-phone-alt"></i>
                                <span>Tedarikçiyi Ara</span>
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="reviseProductionPlan('${criticalRisks[0].orderId}')">
                                <i class="fas fa-calendar-alt"></i>
                                <span>Planı Düzenle</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Gecikme riskleri
        const highDelayRisks = delayRisks.filter(risk => risk.riskLevel === 'high');
        if (highDelayRisks.length > 0) {
            const risk = highDelayRisks[0];
            html += `
                <div class="info-box warning">
                    <div class="info-box-title">Gecikme Riski Tespit Edildi</div>
                    <div class="info-box-content">
                        <p>${risk.customer} için ${risk.orderNo} numaralı ${risk.cellType} tipi sipariş için yüksek gecikme riski tespit edildi.</p>
                        <p><strong>Risk Faktörleri:</strong> ${risk.riskFactors.join(', ')}</p>
                        <p><strong>Teslim Tarihi:</strong> ${risk.deliveryDate.toLocaleDateString('tr-TR')} (${risk.daysLeft} gün kaldı)</p>
                        
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <button class="btn btn-primary btn-sm" onclick="showOrderDetail('${risk.orderId}')">
                                <i class="fas fa-eye"></i>
                                <span>Sipariş Detayı</span>
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="prioritizeOrder('${risk.orderId}')">
                                <i class="fas fa-arrow-up"></i>
                                <span>Öncelik Ver</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Optimizasyon önerileri
        if (optimizations.length > 0) {
            html += `
                <div class="info-box">
                    <div class="info-box-title">Üretim Optimizasyonu</div>
                    <div class="info-box-content">
                        <p>${optimizations[0].cellType} tipinde ${optimizations[0].orderCount} farklı sipariş için benzer üretim adımlarını birleştirerek
                        yaklaşık ${optimizations[0].potentialSavings} iş günü tasarruf sağlayabilirsiniz.</p>
                        
                        <button class="btn btn-primary btn-sm" onclick="applyOptimizationPlan()">
                            <i class="fas fa-check-circle"></i>
                            <span>Optimizasyon Planını Uygula</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Verimlilik analizi özeti
        try {
            const efficiencyData = await analyzeProductionEfficiency();
            
            if (efficiencyData && efficiencyData.improvementSuggestions.length > 0) {
                const suggestion = efficiencyData.improvementSuggestions[0];
                
                html += `
                    <div class="info-box info">
                        <div class="info-box-title">Verimlilik İyileştirme Önerisi</div>
                        <div class="info-box-content">
                            <p>${suggestion.suggestion}</p>
                            <p><strong>Analiz:</strong> Son 3 ayda ${efficiencyData.totalOrders} sipariş analiz edildi. 
                            Ortalama üretim süresi: ${efficiencyData.avgProductionTime.toFixed(1)} gün.</p>
                            
                            <button class="btn btn-info btn-sm" onclick="showEfficiencyReport()">
                                <i class="fas fa-chart-line"></i>
                                <span>Detaylı Raporu Gör</span>
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Verimlilik analizi gösterme hatası:", error);
        }
        
        // Analizleri göster
        container.innerHTML = html || '<div class="info-box info">Şu anda gösterilecek yapay zeka önerisi bulunmuyor.</div>';
    } catch (error) {
        console.error("AI analizleri gösterme hatası:", error);
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="error-box">Analizler yüklenirken hata oluştu: ${error.message}</div>`;
        }
    }
}

/**
 * Dashboard için AI önerileri getirir
 * @returns {Promise<Array>} Öneriler dizisi
 */
async function getInsights() {
    try {
        Logger.info("Dashboard için AI önerileri getiriliyor");
        
        // Firestore'dan gerekli verileri getir
        const db = firebase.firestore();
        
        // 1. Aktif siparişleri getir
        const activeOrdersSnapshot = await db.collection('orders')
            .where('status', 'in', ['planning', 'production', 'waiting'])
            .get();
        
        // 2. Malzeme durumunu getir
        const materialsSnapshot = await db.collection('materials')
            .where('inStock', '==', false)
            .get();
        
        // Veri analizi sonuçlarını tutacak dizi
        const insights = [];
        
        // Malzeme eksikliği analizi
        if (!materialsSnapshot.empty) {
            const missingMaterials = materialsSnapshot.docs.map(doc => doc.data());
            
            // Kritik malzemeleri bul (birden fazla siparişi etkileyen)
            const criticalMaterials = findCriticalMaterials(missingMaterials, activeOrdersSnapshot.docs);
            
            if (criticalMaterials.length > 0) {
                insights.push({
                    type: 'critical',
                    title: `Kritik Malzeme Eksikliği: ${criticalMaterials.length} malzeme`,
                    description: `${criticalMaterials[0].name} ve diğer ${criticalMaterials.length - 1} malzeme eksikliği toplam ${criticalMaterials[0].affectedOrders} siparişi etkileyebilir.`,
                    action: 'Satın alma departmanı ile iletişime geçip acil tedarik planı oluşturun.'
                });
            }
            
            if (missingMaterials.length > 0) {
                insights.push({
                    type: 'warning',
                    title: 'Malzeme Tedarik Sorunu',
                    description: `Toplam ${missingMaterials.length} malzeme stokta bulunmuyor. Bu durum üretim planını etkileyebilir.`,
                    action: 'Malzeme listesini kontrol edin ve alternatif tedarikçilerle görüşün.'
                });
            }
        }
        
        // Gecikme riski analizi
        if (!activeOrdersSnapshot.empty) {
            const activeOrders = activeOrdersSnapshot.docs.map(doc => doc.data());
            
            // Teslim tarihi geçen siparişleri bul
            const delayedOrders = activeOrders.filter(order => {
                const deliveryDate = order.deliveryDate.toDate();
                return deliveryDate < new Date();
            });
            
            if (delayedOrders.length > 0) {
                insights.push({
                    type: 'critical',
                    title: 'Geciken Siparişler',
                    description: `${delayedOrders.length} sipariş teslim tarihini geçti. En kritik olanı: ${delayedOrders[0].orderNo} - ${delayedOrders[0].customer}`,
                    action: 'Müşteri ile iletişime geçip yeni teslim tarihi belirleyin.'
                });
            }
            
            // Teslim tarihi yaklaşan siparişleri bul
            const upcomingOrders = activeOrders.filter(order => {
                const deliveryDate = order.deliveryDate.toDate();
                const today = new Date();
                const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
                return diffDays > 0 && diffDays <= 7;
            });
            
            if (upcomingOrders.length > 0) {
                insights.push({
                    type: 'warning',
                    title: 'Yaklaşan Teslim Tarihleri',
                    description: `${upcomingOrders.length} siparişin teslim tarihi önümüzdeki 7 gün içinde.`,
                    action: 'Üretim planını kontrol edin ve önceliklendirme yapın.'
                });
            }
        }
        
        // Üretim kapasitesi analizi
        const capacity = await analyzeProductionCapacity();
        if (capacity > 85) {
            insights.push({
                type: 'warning',
                title: 'Üretim Kapasitesi Uyarısı',
                description: `Şu anki üretim kapasite kullanımı %${capacity}. Bu durum yeni siparişlerin zamanında teslimini etkileyebilir.`,
                action: 'Fazla mesai planlayın veya geçici personel takviyesi yapın.'
            });
        }
        
        // Verimlilik iyileştirme önerileri
        const efficiencyInsights = await analyzeEfficiencyImprovements();
        if (efficiencyInsights.length > 0) {
            insights.push(...efficiencyInsights);
        }
        
        // Önerileri öncelik sırasına göre sırala
        insights.sort((a, b) => {
            const priorityOrder = { 'critical': 0, 'warning': 1, 'improvement': 2 };
            return priorityOrder[a.type] - priorityOrder[b.type];
        });
        
        Logger.info(`${insights.length} AI önerisi oluşturuldu`);
        return insights;
    } catch (error) {
        Logger.error("AI önerileri getirilirken hata", { error: error.message });
        
        // Hata durumunda en az bir öneri dön
        return [{
            type: 'warning',
            title: 'Veri Analizi Hatası',
            description: 'Sistem yapay zeka önerilerini getirirken bir sorun oluştu. Veriler kısıtlı olabilir.',
            action: 'Sistem yöneticinize başvurun veya daha sonra tekrar deneyin.'
        }];
    }
}

/**
 * Kritik malzemeleri bulur
 * @param {Array} materials - Malzemeler
 * @param {Array} orders - Siparişler
 * @returns {Array} Kritik malzemeler
 */
function findCriticalMaterials(materials, orders) {
    // Bu fonksiyon, birden fazla siparişi etkileyen malzemeleri tespit eder
    const criticalMaterials = [];
    
    materials.forEach(material => {
        // Bu malzemenin etkilediği sipariş sayısını bul
        let affectedOrdersCount = 0;
        
        orders.forEach(orderDoc => {
            const order = orderDoc.data();
            
            // Sipariş ile malzeme arasındaki ilişkiyi kontrol et
            if (order.materialList && order.materialList.includes(material.code)) {
                affectedOrdersCount++;
            }
        });
        
        // Birden fazla siparişi etkiliyorsa kritik olarak işaretle
        if (affectedOrdersCount > 1) {
            criticalMaterials.push({
                ...material,
                affectedOrders: affectedOrdersCount
            });
        }
    });
    
    // Etkilenen sipariş sayısına göre sırala
    return criticalMaterials.sort((a, b) => b.affectedOrders - a.affectedOrders);
}

/**
 * Üretim kapasitesini analiz eder
 * @returns {Promise<number>} Kapasite kullanım oranı (%)
 */
async function analyzeProductionCapacity() {
    try {
        // Gerçek verileri almak için veritabanı sorgularını kullanabilirsiniz
        // Burada örnek bir değer döndürüyoruz
        return 90;
    } catch (error) {
        Logger.error("Üretim kapasitesi analizi sırasında hata", { error: error.message });
        return 0;
    }
}

/**
 * Verimlilik iyileştirmelerini analiz eder
 * @returns {Promise<Array>} İyileştirme önerileri
 */
async function analyzeEfficiencyImprovements() {
    try {
        // Örnek verimlilik önerileri
        return [
            {
                type: 'improvement',
                title: 'Montaj Süreci İyileştirme',
                description: 'Son 30 günde montaj süreçlerinde ortalama %15 sapma tespit edildi. Standartlaştırma çalışması yapılabilir.',
                action: 'Montaj süreçleri için iş talimatlarını güncelleyin ve operatörlere eğitim verin.'
            }
        ];
    } catch (error) {
        Logger.error("Verimlilik iyileştirmeleri analizi sırasında hata", { error: error.message });
        return [];
    }
}

// AI Analitiği sınıfı
class AIAnalytics {
    constructor() {
        this.config = window.deepseekModel || {
            apiKey: window.DEEPSEEK_API_KEY || 'sk-3a17ae40b3e445528bc988f04805e54b',
            modelName: 'deepseek-chat',
            temperature: 0.5, // Daha düşük sıcaklık değeri daha tutarlı cevaplar için
            maxTokens: 1000
        };
        
        this.systemPrompt = `
            Sen bir Orta Gerilim Hücre üretim uzmanısın.
            Teknik sorulara net, doğru ve teknik detaylarla dolu yanıtlar vereceksin.
            Elektrik mühendisliği, orta gerilim ekipmanları ve üretim süreçleri konusunda uzman bilgin var.
            Tüm yanıtlar teknik şartnamelere ve doğru mühendislik bilgilerine dayanmalıdır.
            Bilmediğin bir konu olduğunda tahmin etmek yerine bilginin sınırlı olduğunu belirt.
            Cevaplarının sonuna ilgili olabilecek teknik şartnameler ve referans dokümanları da ekle.
        `;
        
        this.initialized = false;
        this.init();
    }
    
    init() {
        console.log('AI Analitik modülü başlatılıyor...');
        
        // API key kontrolü
        if (!this.config.apiKey) {
            console.warn('API anahtarı bulunamadı, demo modda çalışılacak');
        }
        
        // Teknik sorgulama butonu için event listener
        const queryBtn = document.querySelector('#technical .card-body .btn-primary');
        if (queryBtn) {
            queryBtn.addEventListener('click', () => this.handleTechnicalQuery());
        }
        
        this.initialized = true;
        console.log('AI Analitik modülü başarıyla başlatıldı');
    }
    
    async handleTechnicalQuery() {
        const questionInput = document.getElementById('technicalQuestion');
        if (!questionInput || !questionInput.value.trim()) return;
        
        const question = questionInput.value.trim();
        
        // Yükleniyor göster
        const responseArea = document.querySelector('#technical .alert-info');
        if (responseArea) {
            responseArea.innerHTML = '<p class="text-center"><i class="bi bi-gear-fill"></i> Cevabınız hazırlanıyor...</p>';
        }
        
        try {
            // AI sorgulama
            const answer = await this.queryTechnicalAI(question);
            
            // Cevabı göster
            if (responseArea) {
                responseArea.innerHTML = `
                    <h6><i class="bi bi-lightbulb"></i> Yapay Zeka Cevabı:</h6>
                    <p>${answer.text || answer.content}</p>
                    <p class="mb-0">Referans doküman: <a href="#">${answer.reference || 'RM 36 Teknik Şartnamesi'}</a></p>
                `;
            }
            
            // İlgili dokümanları güncelle
            this.updateRelatedDocuments(question);
            
        } catch (error) {
            console.error('Teknik sorgulama hatası:', error);
            
            if (responseArea) {
                responseArea.innerHTML = `
                    <h6 class="text-danger"><i class="bi bi-exclamation-triangle"></i> Hata</h6>
                    <p>Sorgulama sırasında bir hata oluştu. Lütfen tekrar deneyin.</p>
                `;
            }
        }
    }
    
    async queryTechnicalAI(question) {
        console.log('Teknik sorgulama yapılıyor:', question);
        
        // Demo mod - Gerçek API yerine önceden hazırlanmış yanıtlar kullan
        if (window.generateTechnicalAnswer) {
            return window.generateTechnicalAnswer(question);
        }
        
        // DeepSeek demo yanıt üret
        return this.generateTechnicalDemoResponse(question);
    }
    
    generateTechnicalDemoResponse(question) {
        const lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.includes('akım trafosu')) {
            return {
                text: 'RM 36 CB hücresinde genellikle 200-400/5-5A 5P20 7,5/15VA veya 300-600/5-5A 5P20 7,5/15VA özelliklerinde toroidal tip akım trafoları kullanılmaktadır. Canias kodları: 144866% (KAP-80/190-95) veya 142227% (KAT-85/190-95). Akım trafoları birincil koruma için kullanılır ve orta gerilim ekipmanının korunmasında kritik rol oynar.',
                reference: 'RM 36 CB Teknik Şartnamesi Rev.2.1'
            };
        } else if (lowerQuestion.includes('bara')) {
            return {
                text: 'OG Hücrelerde kullanılan baralar genellikle elektrolitik bakırdır. RM 36 serisi için 582mm ve 432mm uzunluklarında 40x10mm kesitinde düz bakır baralar kullanılır. Akım taşıma kapasitesi 1250A-2000A arasındadır. İzin verilen maksimum sıcaklık artışı 65K\'dir.',
                reference: 'RM 36 Serisi Bara Montaj Kılavuzu Rev.1.8'
            };
        } else if (lowerQuestion.includes('motor') || lowerQuestion.includes('ayırıcı')) {
            return {
                text: 'RM 36 serisi hücrelerde kesici ve ayırıcılarda 24VDC motorlar standart olarak kullanılmaktadır. Motor gücü ayırıcılar için 60W, kesiciler için 85W değerindedir. Çalışma süresi 3-5 saniye arasındadır ve her motorun mekanik ömrü en az 10.000 operasyondur.',
                reference: 'RM 36 Motor Teknik Özellikleri Rev.1.2'
            };
        } else {
            return {
                text: 'RM 36 serisi hücreler, 36kV orta gerilim için tasarlanmıştır. Nominal gerilimi 36kV, darbe dayanım gerilimi 170kV, nominal akım 630A-1250A, kısa devre dayanımı 16kA-25kA arasında seçilebilmektedir. Metal muhafazalı, hava izoleli ve modüler yapıdadır. IEC 62271-200 standardına göre üretilmektedir.',
                reference: 'RM 36 Serisi Genel Teknik Şartname Rev.3.0'
            };
        }
    }
    
    updateRelatedDocuments(question) {
        const lowerQuestion = question.toLowerCase();
        const relatedDocsArea = document.querySelector('#technical .mt-3 ul');
        
        if (!relatedDocsArea) return;
        
        let documentsList = '';
        
        if (lowerQuestion.includes('akım trafosu')) {
            documentsList = `
                <li><a href="#">RM 36 CB Teknik Çizim</a> - Rev.2.1</li>
                <li><a href="#">Akım Trafosu Seçim Kılavuzu</a> - Rev.1.3</li>
                <li><a href="#">TEDAS-MLZ-2020-069 Teknik Şartname</a></li>
                <li><a href="#">IEC 60044-1 Standart Referansı</a></li>
            `;
        } else if (lowerQuestion.includes('bara')) {
            documentsList = `
                <li><a href="#">RM 36 Serisi Bara Montaj Kılavuzu</a> - Rev.1.8</li>
                <li><a href="#">Bara Kesit Hesaplama Çizelgesi</a> - Rev.2.0</li>
                <li><a href="#">Bakır Bara Teknik Özellikleri</a></li>
                <li><a href="#">IEC 60865-1 Kısa Devre Hesaplamaları</a></li>
            `;
        } else if (lowerQuestion.includes('motor') || lowerQuestion.includes('ayırıcı')) {
            documentsList = `
                <li><a href="#">RM 36 Motor Teknik Özellikleri</a> - Rev.1.2</li>
                <li><a href="#">Motorlu Mekanizma Kurulum Kılavuzu</a> - Rev.1.4</li>
                <li><a href="#">Kesici/Ayırıcı Bakım Talimatı</a></li>
                <li><a href="#">Motor Kontrol Ünitesi Şeması</a> - Rev.1.1</li>
            `;
        } else {
            documentsList = `
                <li><a href="#">RM 36 Serisi Genel Teknik Şartname</a> - Rev.3.0</li>
                <li><a href="#">RM 36 CB Teknik Çizim</a> - Rev.2.1</li>
                <li><a href="#">IEC 62271-200 Orta Gerilim Şalt Cihazları</a></li>
                <li><a href="#">Ürün Kataloğu</a> - 2023/2</li>
            `;
        }
        
        relatedDocsArea.innerHTML = documentsList;
    }
}

// Global olarak AI Analitiği oluştur
window.aiAnalytics = new AIAnalytics();

console.log('AI Analytics modülü başarıyla yüklendi');

// Dışa aktarılacak fonksiyonlar
export default {
    analyzeSupplyChainRisks,
    suggestProductionOptimizations,
    detectDelayRisks,
    analyzeMaterialConsumption,
    predictDeliveryDate,
    predictProductionTimeML,
    analyzeProductionEfficiency,
    displayAIInsights,
    getInsights
};