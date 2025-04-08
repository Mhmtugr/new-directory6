/**
 * production-planning.js
 * Üretim planlama ve optimizasyon fonksiyonları
 */

// Üretim planlama modülü
window.ProductionPlanningModule = (function() {
    // Özel değişkenler
    let currentPlan = null;
    let productionData = [];
    let pendingOrders = [];
    let scheduledOrders = [];
    let materialsStatus = {};

    // Tüm bekleyen siparişleri yükle
    async function loadPendingOrders() {
        try {
            const response = await fetch('/api/orders/pending');
            if (!response.ok) {
                throw new Error('Bekleyen siparişler yüklenemedi');
            }
            pendingOrders = await response.json();
            return pendingOrders;
        } catch (error) {
            console.error("Bekleyen siparişleri yükleme hatası:", error);
            showNotification('error', 'Bekleyen siparişler yüklenemedi', error.message);
            return [];
        }
    }

    // Planlanmış siparişleri yükle
    async function loadScheduledOrders() {
        try {
            const response = await fetch('/api/production/scheduled');
            if (!response.ok) {
                throw new Error('Planlanmış siparişler yüklenemedi');
            }
            scheduledOrders = await response.json();
            return scheduledOrders;
        } catch (error) {
            console.error("Planlanmış siparişleri yükleme hatası:", error);
            showNotification('error', 'Planlanmış siparişler yüklenemedi', error.message);
            return [];
        }
    }

    // Malzeme durumunu kontrol et
    async function checkMaterialsStatus(orderId) {
        try {
            const response = await fetch(`/api/materials/status/${orderId}`);
            if (!response.ok) {
                throw new Error('Malzeme durumu kontrol edilemedi');
            }
            const data = await response.json();
            materialsStatus[orderId] = data;
            return data;
        } catch (error) {
            console.error("Malzeme durumu kontrol hatası:", error);
            showNotification('error', 'Malzeme durumu kontrol edilemedi', error.message);
            return null;
        }
    }

    // Yapay zeka ile üretim süresi tahmini
    async function predictProductionTime(orderDetails) {
        try {
            // Eğer yapay zeka modülü yüklüyse kullan
            if (window.AIIntegrationModule && window.AIIntegrationModule.predictProductionTime) {
                return await window.AIIntegrationModule.predictProductionTime(orderDetails);
            }
            
            // Değilse basit tahmin algoritması kullan
            const baseTime = 3; // Temel gün sayısı
            const cellCountFactor = orderDetails.cellCount * 0.5; // Hücre sayısına göre çarpan
            
            let complexity = 1.0;
            switch (orderDetails.cellType) {
                case 'CB': complexity = 1.2; break;
                case 'LB': complexity = 1.0; break;
                case 'FL': complexity = 1.3; break;
                case 'RMU': complexity = 1.5; break;
                default: complexity = 1.0;
            }
            
            const estimatedDays = baseTime + (cellCountFactor * complexity);
            
            return {
                estimatedDays: Math.round(estimatedDays),
                confidence: 0.7,
                details: {
                    baseTime,
                    cellCountFactor,
                    complexity,
                    raw: estimatedDays
                }
            };
        } catch (error) {
            console.error("Üretim süresi tahmini hatası:", error);
            return {
                estimatedDays: 7, // Varsayılan değer
                confidence: 0.5,
                error: error.message
            };
        }
    }

    // En uygun üretim planını oluştur
    async function generateOptimalPlan() {
        try {
            // Bekleyen siparişleri ve malzeme durumlarını yükle
            await Promise.all([
                loadPendingOrders(),
                loadScheduledOrders()
            ]);
            
            // Her sipariş için malzeme durumunu kontrol et
            const materialChecks = await Promise.all(
                pendingOrders.map(order => checkMaterialsStatus(order.id))
            );
            
            // Uygun siparişleri seç
            const eligibleOrders = pendingOrders.filter((order, index) => {
                const materials = materialsStatus[order.id];
                // Tüm malzemeler hazır olan veya siparişi açılan siparişler
                return materials && materials.availablePercentage >= 80;
            });
            
            // Teslim tarihi yaklaşan ve hazır olan siparişlere öncelik ver
            eligibleOrders.sort((a, b) => {
                // Malzeme hazırlık durumu
                const aMaterialsReady = materialsStatus[a.id].availablePercentage;
                const bMaterialsReady = materialsStatus[b.id].availablePercentage;
                
                // Hazırlık farkı büyükse öncelik ver
                if (Math.abs(aMaterialsReady - bMaterialsReady) > 20) {
                    return bMaterialsReady - aMaterialsReady;
                }
                
                // Teslim tarihlerine göre sırala
                const aDelivery = new Date(a.deliveryDate);
                const bDelivery = new Date(b.deliveryDate);
                return aDelivery - bDelivery;
            });
            
            // Üretim planı oluştur
            const plan = {
                generatedAt: new Date(),
                orders: [],
                timeline: [],
                workload: {}
            };
            
            // Her bir departman için iş yükünü izle
            const departments = ['design', 'assembly', 'wiring', 'testing'];
            departments.forEach(dept => {
                plan.workload[dept] = {
                    current: 0,
                    scheduled: []
                };
            });
            
            // Mevcut tarih
            let currentDate = new Date();
            
            // Siparişleri planla
            for (const order of eligibleOrders) {
                // Üretim süresini tahmin et
                const productionTime = await predictProductionTime(order);
                
                // Departman bazlı iş dağılımı
                const deptDistribution = {
                    design: 0.2,    // %20 tasarım
                    assembly: 0.4,  // %40 montaj
                    wiring: 0.3,    // %30 kablaj
                    testing: 0.1    // %10 test
                };
                
                // Başlangıç ve bitiş tarihlerini hesapla
                const startDate = new Date(currentDate);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + productionTime.estimatedDays);
                
                // Sipariş planını oluştur
                const orderPlan = {
                    orderId: order.id,
                    orderNo: order.orderNo,
                    customer: order.customer,
                    cellType: order.cellType,
                    cellCount: order.cellCount,
                    startDate: startDate,
                    endDate: endDate,
                    estimatedDays: productionTime.estimatedDays,
                    departmentSchedule: {}
                };
                
                // Departman planlaması
                let deptStart = new Date(startDate);
                for (const dept of departments) {
                    const deptDays = Math.ceil(productionTime.estimatedDays * deptDistribution[dept]);
                    const deptEnd = new Date(deptStart);
                    deptEnd.setDate(deptEnd.getDate() + deptDays);
                    
                    orderPlan.departmentSchedule[dept] = {
                        start: new Date(deptStart),
                        end: new Date(deptEnd),
                        days: deptDays
                    };
                    
                    deptStart = new Date(deptEnd);
                }
                
                // Plana ekle
                plan.orders.push(orderPlan);
                
                // Sonraki sipariş için başlangıç tarihi ayarla
                currentDate = new Date(endDate);
                currentDate.setDate(currentDate.getDate() + 1); // 1 günlük boşluk
            }
            
            // Zaman çizelgesi oluştur
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 60); // 60 günlük plan
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const day = {
                    date: new Date(d),
                    orders: plan.orders.filter(order => {
                        const start = new Date(order.startDate);
                        const end = new Date(order.endDate);
                        return d >= start && d <= end;
                    }).map(order => ({
                        orderId: order.orderId,
                        orderNo: order.orderNo,
                        departments: Object.keys(order.departmentSchedule).filter(dept => {
                            const deptStart = order.departmentSchedule[dept].start;
                            const deptEnd = order.departmentSchedule[dept].end;
                            return d >= deptStart && d <= deptEnd;
                        })
                    }))
                };
                
                plan.timeline.push(day);
            }
            
            return plan;
        } catch (error) {
            console.error("Üretim planı oluşturma hatası:", error);
            showNotification('error', 'Üretim planı oluşturulamadı', error.message);
            return null;
        }
    }

    // Üretim takvimi görünümünü oluştur
    function renderProductionCalendar(plan, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`${containerId} ID'li konteyner bulunamadı`);
            return;
        }
        
        // Takvimi temizle
        container.innerHTML = '';
        
        // Takvim başlığı
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
            <h3>Üretim Takvimi</h3>
            <p>Üretim Planı: ${new Date(plan.generatedAt).toLocaleDateString('tr-TR')}</p>
        `;
        container.appendChild(header);
        
        // Takvim grid'i oluştur
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        
        // Başlık satırı
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-row header-row';
        
        // İlk hücre (köşe hücresi)
        const cornerCell = document.createElement('div');
        cornerCell.className = 'calendar-cell corner-cell';
        headerRow.appendChild(cornerCell);
        
        // Tarih hücrelerini ekle (bir ay göster)
        const dates = plan.timeline.slice(0, 30); // İlk 30 gün
        
        dates.forEach(day => {
            const dateCell = document.createElement('div');
            dateCell.className = 'calendar-cell date-cell';
            const date = new Date(day.date);
            dateCell.textContent = date.getDate();
            
            // Hafta sonu kontrolü
            if (date.getDay() === 0 || date.getDay() === 6) {
                dateCell.classList.add('weekend');
            }
            
            // Bugün kontrolü
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                dateCell.classList.add('today');
            }
            
            headerRow.appendChild(dateCell);
        });
        
        calendarGrid.appendChild(headerRow);
        
        // Her bir sipariş için satır oluştur
        plan.orders.forEach(order => {
            const orderRow = document.createElement('div');
            orderRow.className = 'calendar-row order-row';
            
            // Sipariş bilgisi hücresi
            const orderCell = document.createElement('div');
            orderCell.className = 'calendar-cell order-info-cell';
            orderCell.innerHTML = `
                <div class="order-number">${order.orderNo}</div>
                <div class="order-customer">${order.customer}</div>
                <div class="order-type">${order.cellType} (${order.cellCount})</div>
            `;
            orderRow.appendChild(orderCell);
            
            // Her gün için hücre oluştur
            dates.forEach(day => {
                const date = new Date(day.date);
                const cell = document.createElement('div');
                cell.className = 'calendar-cell day-cell';
                
                // Sipariş bu tarihte aktif mi kontrol et
                const isActive = date >= new Date(order.startDate) && date <= new Date(order.endDate);
                
                if (isActive) {
                    cell.classList.add('active');
                    
                    // Bu günde hangi departmanlar çalışıyor
                    const activeDepts = Object.keys(order.departmentSchedule).filter(dept => {
                        const deptStart = new Date(order.departmentSchedule[dept].start);
                        const deptEnd = new Date(order.departmentSchedule[dept].end);
                        return date >= deptStart && date <= deptEnd;
                    });
                    
                    // Departman bilgisini hücreye ekle
                    if (activeDepts.length > 0) {
                        const deptColors = {
                            design: 'blue',
                            assembly: 'green',
                            wiring: 'orange',
                            testing: 'purple'
                        };
                        
                        activeDepts.forEach(dept => {
                            const deptMarker = document.createElement('div');
                            deptMarker.className = 'dept-marker';
                            deptMarker.style.backgroundColor = deptColors[dept];
                            deptMarker.setAttribute('title', dept);
                            cell.appendChild(deptMarker);
                        });
                    }
                }
                
                orderRow.appendChild(cell);
            });
            
            calendarGrid.appendChild(orderRow);
        });
        
        container.appendChild(calendarGrid);
        
        // Departman lejantı ekle
        const legend = document.createElement('div');
        legend.className = 'calendar-legend';
        legend.innerHTML = `
            <div class="legend-item"><span class="legend-color" style="background-color: blue;"></span> Tasarım</div>
            <div class="legend-item"><span class="legend-color" style="background-color: green;"></span> Montaj</div>
            <div class="legend-item"><span class="legend-color" style="background-color: orange;"></span> Kablaj</div>
            <div class="legend-item"><span class="legend-color" style="background-color: purple;"></span> Test</div>
        `;
        container.appendChild(legend);
    }

    // Gecikmeli siparişleri analiz et ve uyarı oluştur
    async function analyzeDelayedOrders() {
        try {
            const response = await fetch('/api/production/analysis/delays');
            if (!response.ok) {
                throw new Error('Gecikme analizi yapılamadı');
            }
            
            const analysis = await response.json();
            
            // Gecikme olanlara otomatik uyarı oluştur
            analysis.delayedOrders.forEach(order => {
                const delayInfo = `${order.orderNo} siparişi ${order.delayDays} gün gecikiyor. Departman: ${order.delayedDepartment}`;
                showNotification('warning', 'Sipariş Gecikmesi', delayInfo);
                
                // Ek mesai hesaplaması
                if (order.canRecoverWithOvertime) {
                    const overtimeInfo = `${order.orderNo} siparişindeki ${order.delayDays} günlük gecikme, ${order.requiredOvertimeHours} saat ek mesai ile telafi edilebilir.`;
                    showNotification('info', 'Ek Mesai Önerisi', overtimeInfo);
                }
            });
            
            return analysis;
        } catch (error) {
            console.error("Gecikme analizi hatası:", error);
            return null;
        }
    }

    // AI önerisi göster
    function showAIRecommendations(containerId) {
        // Yapay zeka modülü yüklü mü kontrol et
        if (!window.AIIntegrationModule) {
            console.warn("AI modülü yüklü değil, öneriler gösterilemiyor");
            return;
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`${containerId} ID'li konteyner bulunamadı`);
            return;
        }
        
        // AI'dan üretim önerilerini al
        window.AIIntegrationModule.getProductionRecommendations()
            .then(recommendations => {
                if (!recommendations || recommendations.length === 0) {
                    container.innerHTML = '<div class="alert alert-info">Şu anda herhangi bir AI önerisi bulunmuyor.</div>';
                    return;
                }
                
                let html = `
                    <div class="ai-recommendations">
                        <h3>Yapay Zeka Önerileri</h3>
                        <div class="recommendations-list">
                `;
                
                recommendations.forEach(rec => {
                    html += `
                        <div class="recommendation-item ${rec.priority}">
                            <div class="rec-header">
                                <h4>${rec.title}</h4>
                                <span class="badge bg-${rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'}">${rec.priority === 'high' ? 'Yüksek' : rec.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik</span>
                            </div>
                            <p>${rec.description}</p>
                            <div class="rec-actions">
                                <button class="btn btn-sm btn-primary apply-rec" data-rec-id="${rec.id}">Uygula</button>
                                <button class="btn btn-sm btn-outline-secondary dismiss-rec" data-rec-id="${rec.id}">Reddet</button>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
                
                container.innerHTML = html;
                
                // Butonlara olay dinleyicileri ekle
                container.querySelectorAll('.apply-rec').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const recId = btn.getAttribute('data-rec-id');
                        window.AIIntegrationModule.applyRecommendation(recId);
                    });
                });
                
                container.querySelectorAll('.dismiss-rec').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const recId = btn.getAttribute('data-rec-id');
                        window.AIIntegrationModule.dismissRecommendation(recId);
                        // İlgili öneri kartını kaldır
                        btn.closest('.recommendation-item').remove();
                    });
                });
            })
            .catch(error => {
                console.error("AI önerileri yüklenirken hata:", error);
                container.innerHTML = `<div class="alert alert-danger">AI önerileri yüklenirken hata: ${error.message}</div>`;
            });
    }

    // Public API
    return {
        loadPendingOrders,
        loadScheduledOrders,
        checkMaterialsStatus,
        predictProductionTime,
        generateOptimalPlan,
        renderProductionCalendar,
        analyzeDelayedOrders,
        showAIRecommendations,
        
        // Uygulama başlangıcında çağrılacak
        initialize: async function() {
            try {
                // Initial data loading
                await Promise.all([
                    loadPendingOrders(),
                    loadScheduledOrders()
                ]);
                
                // Listen for updates
                EventBus.subscribe('order.created', async (data) => {
                    await loadPendingOrders();
                });
                
                EventBus.subscribe('materials.updated', async (data) => {
                    if (data.orderId) {
                        await checkMaterialsStatus(data.orderId);
                    }
                });
                
                EventBus.subscribe('production.updated', async () => {
                    await loadScheduledOrders();
                });
                
                console.log("Production planning module initialized");
                return true;
            } catch (error) {
                console.error("Production planning initialization error:", error);
                return false;
            }
        }
    };
})();

// Modülü başlat
document.addEventListener('DOMContentLoaded', function() {
    window.ProductionPlanningModule.initialize()
        .then(() => console.log("Üretim planlama modülü başlatıldı"))
        .catch(err => console.error("Üretim planlama modülü başlatılamadı:", err));
});