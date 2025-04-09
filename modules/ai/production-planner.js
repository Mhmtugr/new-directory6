/**
 * Üretim Planlama Modülü
 * 
 * Bu modül, makine öğrenmesi tahminlerini kullanarak üretim planlaması yapar,
 * takvim ve Gantt şemalarını günceller, ve kullanıcı arayüzünü yönetir.
 */

class ProductionPlannerService {
    constructor() {
        this.calendar = null;
        this.currentSchedule = [];
        this.ganttData = [];
        this.initialized = false;
        
        // Renk sınıfları
        this.stageColors = {
            electricDesign: '#3498db',
            mechanicalDesign: '#9b59b6',
            purchasing: '#f39c12',
            mechanicalProduction: '#e74c3c',
            innerAssembly: '#16a085',
            cabling: '#2ecc71',
            generalAssembly: '#1abc9c',
            testing: '#3498db'
        };
        
        this.stageNames = {
            electricDesign: 'Elektrik Tasarım',
            mechanicalDesign: 'Mekanik Tasarım',
            purchasing: 'Satın Alma',
            mechanicalProduction: 'Mekanik Üretim',
            innerAssembly: 'İç Montaj',
            cabling: 'Kablaj',
            generalAssembly: 'Genel Montaj',
            testing: 'Test'
        };
    }
    
    /**
     * Modülü başlatır ve mevcut üretim planını yükler
     */
    async initialize() {
        try {
            console.log('Üretim planlayıcı başlatılıyor...');
            
            // Mevcut üretim planını yükle
            await this.loadCurrentSchedule();
            
            // Takvimi başlatın
            this.initializeCalendar();
            
            this.initialized = true;
            console.log('Üretim planlayıcı hazır');
            
            // Sipariş formunda tahmin özelliğini etkinleştir
            this.initializeOrderFormPrediction();
            
            return true;
        } catch (error) {
            console.error('Üretim planlayıcı başlatılamadı:', error);
            return false;
        }
    }
    
    /**
     * Mevcut üretim programını yükler
     * (Gerçek senaryoda API'den alınacak)
     */
    async loadCurrentSchedule() {
        try {
            // Simüle edilmiş veri - API'den alınacak
            const currentDate = new Date();
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            
            // Birkaç örnek üretim görevi oluştur 
            this.currentSchedule = [
                {
                    id: '#0424-1251',
                    title: '#0424-1251 Mekanik Üretim',
                    start: new Date(year, month, 1).toISOString(),
                    end: new Date(year, month, 5).toISOString(),
                    color: '#e74c3c',
                    extendedProps: {
                        cellType: 'RM 36 CB',
                        customer: 'AYEDAŞ',
                        stage: 'mechanicalProduction'
                    }
                },
                {
                    id: '#0424-1245',
                    title: '#0424-1245 Montaj',
                    start: new Date(year, month, 3).toISOString(),
                    end: new Date(year, month, 7).toISOString(),
                    color: '#f39c12',
                    extendedProps: {
                        cellType: 'RM 36 CB',
                        customer: 'TEİAŞ',
                        stage: 'innerAssembly'
                    }
                },
                {
                    id: '#0424-1239',
                    title: '#0424-1239 Test',
                    start: new Date(year, month, 8).toISOString(),
                    end: new Date(year, month, 10).toISOString(),
                    color: '#27ae60',
                    extendedProps: {
                        cellType: 'RM 36 LB',
                        customer: 'BEDAŞ',
                        stage: 'testing'
                    }
                }
            ];
            
            // Bu verileri FullCalendar formatından Gantt şema formatına dönüştür
            this.updateGanttData();
            
            console.log(`${this.currentSchedule.length} adet üretim görevi yüklendi`);
            return this.currentSchedule;
        } catch (error) {
            console.error('Üretim programı yüklenirken hata:', error);
            throw error;
        }
    }
    
    /**
     * FullCalendar bileşenini başlatır
     */
    initializeCalendar() {
        try {
            const calendarEl = document.getElementById('productionCalendar');
            
            if (!calendarEl) {
                console.warn('productionCalendar elementi bulunamadı');
                return false;
            }
            
            if (typeof FullCalendar === 'undefined') {
                console.error('FullCalendar kütüphanesi yüklenemedi');
                return false;
            }
            
            // Takvimi yapılandır
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridWeek',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,resourceTimelineMonth'
                },
                events: this.currentSchedule,
                editable: true,
                selectable: true,
                eventClick: (info) => {
                    this.handleEventClick(info);
                },
                eventDrop: (info) => {
                    this.handleEventDrop(info);
                },
                eventResize: (info) => {
                    this.handleEventResize(info);
                },
                select: (info) => {
                    this.handleDateSelect(info);
                },
                eventDidMount: (info) => {
                    // Tooltip ekle
                    if (info.event.extendedProps) {
                        const props = info.event.extendedProps;
                        const tooltip = `
                            <div>
                                <strong>${info.event.id || 'Yeni Görev'}</strong><br>
                                ${props.cellType || ''} - ${props.customer || ''}<br>
                                ${this.stageNames[props.stage] || props.stage || ''}
                            </div>
                        `;
                        
                        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                            new bootstrap.Tooltip(info.el, {
                                title: tooltip,
                                html: true,
                                placement: 'top',
                                customClass: 'production-calendar-tooltip'
                            });
                        }
                    }
                }
            });
            
            this.calendar.render();
            console.log('Üretim takvimi başlatıldı');
            return true;
        } catch (error) {
            console.error('Takvim başlatılırken hata:', error);
            return false;
        }
    }
    
    /**
     * Sipariş formundaki alanları dinleyerek otomatik tahmin gösterir
     */
    initializeOrderFormPrediction() {
        // Sipariş formundaki ilgili alanları seç
        const formElements = [
            document.getElementById('cellType'),
            document.getElementById('voltage'),
            document.getElementById('current'),
            document.getElementById('customDesignYes'),
            document.getElementById('customDesignNo'),
            // Diğer ilgili alanlar...
        ];
        
        // Tahmin sonuç alanı - yoksa oluştur
        let predictionResultElement = document.getElementById('productionEstimateResult');
        if (!predictionResultElement) {
            const targetContainer = document.querySelector('#newOrderModal .modal-body form');
            
            if (targetContainer) {
                // Önce bir satır ekle
                const hrElement = document.createElement('hr');
                targetContainer.appendChild(hrElement);
                
                // Tahmin bölümü
                const predictionSection = document.createElement('div');
                predictionSection.className = 'mb-3';
                predictionSection.innerHTML = `
                    <h5 class="mb-3">Üretim Tahmini (Yapay Zeka)</h5>
                    <div class="alert alert-info" id="productionEstimateResult">
                        Tahmin için lütfen formu doldurun.
                    </div>
                    <div id="productionTimelinePreview"></div>
                `;
                
                targetContainer.appendChild(predictionSection);
                predictionResultElement = document.getElementById('productionEstimateResult');
            }
        }
        
        // Her bir form alanı değiştiğinde tahmini güncelle
        formElements.forEach(element => {
            if (element) {
                element.addEventListener('change', () => {
                    this.updateOrderFormPrediction();
                });
            }
        });
        
        // İlk yükleme için tahmini bir kez çalıştır
        setTimeout(() => {
            this.updateOrderFormPrediction();
        }, 1000);
    }
    
    /**
     * Form değerlerine göre yeni sipariş için tahmin yapar ve gösterir
     */
    updateOrderFormPrediction() {
        // Gerekli form alanlarını al
        const cellTypeElement = document.getElementById('cellType');
        const voltageElement = document.getElementById('voltage');
        const currentElement = document.getElementById('current');
        const customDesignYesElement = document.getElementById('customDesignYes');
        
        // Sonuç gösterme alanı
        const predictionResultElement = document.getElementById('productionEstimateResult');
        const timelinePreviewElement = document.getElementById('productionTimelinePreview');
        
        if (!predictionResultElement || !cellTypeElement) {
            return;
        }
        
        // Form yeterince dolduruldu mu kontrol et
        if (cellTypeElement.value === 'Seçiniz') {
            predictionResultElement.innerHTML = `
                <i class="bi bi-info-circle"></i> 
                Tahmin için lütfen en azından hücre tipini seçin.
            `;
            return;
        }
        
        try {
            // Formdan verileri al
            const orderDetails = {
                cellType: cellTypeElement.value,
                voltage: voltageElement ? voltageElement.value : '36kV',
                current: currentElement ? currentElement.value : '630A',
                customDesign: customDesignYesElement ? customDesignYesElement.checked : false,
                relayCoding: true, // Form alanı eklenirse burası değişecek
                hasEnergyAnalyzer: document.getElementById('energyAnalyzer')?.value ? true : false
            };
            
            // ML servisinden tahmin al
            if (!window.productionML) {
                predictionResultElement.innerHTML = `
                    <i class="bi bi-exclamation-triangle"></i> 
                    Yapay zeka modülü henüz yüklenemedi. Lütfen tekrar deneyin.
                `;
                return;
            }
            
            const estimatedDays = window.productionML.predictProductionDays(orderDetails);
            
            // Üretim programını da öner
            const currentSchedule = this.currentSchedule.map(event => ({
                id: event.id,
                start: event.start,
                end: event.end,
                title: event.title
            }));
            
            const scheduleSuggestion = window.productionML.suggestProductionSchedule(
                orderDetails, 
                currentSchedule
            );
            
            // Sonucu göster
            predictionResultElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-robot"></i> 
                        <strong>Tahmini üretim süresi:</strong> ${estimatedDays} gün
                    </div>
                    <div>
                        <span class="badge bg-primary">${orderDetails.cellType}</span>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-md-6">
                        <strong>Önerilen başlangıç:</strong> ${this.formatDate(scheduleSuggestion.suggestedStartDate)}
                    </div>
                    <div class="col-md-6">
                        <strong>Önerilen bitiş:</strong> ${this.formatDate(scheduleSuggestion.suggestedEndDate)}
                    </div>
                </div>
            `;
            
            // Zaman çizelgesi önizlemesi göster
            if (timelinePreviewElement) {
                let timelineHTML = `
                    <h6 class="mt-3 mb-2">Üretim Adımları Zaman Çizelgesi</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Aşama</th>
                                    <th>Başlangıç</th>
                                    <th>Bitiş</th>
                                    <th>Süre</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                scheduleSuggestion.stagesTimeline.forEach(stage => {
                    timelineHTML += `
                        <tr>
                            <td>${this.stageNames[stage.stage] || stage.stage}</td>
                            <td>${this.formatDate(stage.start)}</td>
                            <td>${this.formatDate(stage.end)}</td>
                            <td>${stage.duration} gün</td>
                        </tr>
                    `;
                });
                
                timelineHTML += `
                            </tbody>
                        </table>
                    </div>
                `;
                
                timelinePreviewElement.innerHTML = timelineHTML;
            }
            
        } catch (error) {
            console.error('Tahmin hesaplanırken hata:', error);
            predictionResultElement.innerHTML = `
                <i class="bi bi-exclamation-triangle"></i> 
                Üretim tahmini hesaplanırken bir hata oluştu.
            `;
        }
    }
    
    /**
     * ISO tarih formatını insan tarafından okunabilir formata dönüştürür
     */
    formatDate(isoDate) {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    }
    
    /**
     * Siparişi üretime ekle ve program oluştur
     */
    addOrderToProduction(orderDetails) {
        try {
            // Sipariş için ML servisinden üretim tahmini al
            if (!window.productionML) {
                console.error('Üretim ML servisi bulunamadı');
                return null;
            }
            
            const schedule = window.productionML.suggestProductionSchedule(
                orderDetails, 
                this.currentSchedule
            );
            
            if (!schedule) {
                console.error('Üretim programı oluşturulamadı');
                return null;
            }
            
            // Yeni siparişin her adımını programa ekle
            const productionTasks = schedule.stagesTimeline.map(stage => {
                return {
                    id: `${orderDetails.id}-${stage.stage}`,
                    title: `${orderDetails.id} ${this.stageNames[stage.stage] || stage.stage}`,
                    start: stage.start,
                    end: stage.end,
                    color: this.stageColors[stage.stage] || '#3498db',
                    extendedProps: {
                        cellType: orderDetails.cellType,
                        customer: orderDetails.customer,
                        stage: stage.stage,
                        orderId: orderDetails.id
                    }
                };
            });
            
            // Programa ekle
            this.currentSchedule = [...this.currentSchedule, ...productionTasks];
            
            // Takvimi güncelle
            if (this.calendar) {
                productionTasks.forEach(task => {
                    this.calendar.addEvent(task);
                });
            }
            
            // Gantt şemasını güncelle
            this.updateGanttData();
            this.updateGanttUI();
            
            // Event bus üzerinden bildiri gönder
            if (window.eventBus) {
                window.eventBus.emit('production:scheduled', {
                    orderId: orderDetails.id,
                    schedule: schedule,
                    tasks: productionTasks
                });
            }
            
            console.log(`Sipariş ${orderDetails.id} üretime eklendi`);
            
            return {
                schedule,
                tasks: productionTasks
            };
        } catch (error) {
            console.error('Sipariş üretime eklenirken hata:', error);
            return null;
        }
    }
    
    /**
     * Takvim olayları için olay işleyicileri
     */
    handleEventClick(info) {
        console.log('Üretim görevi seçildi:', info.event);
        
        // Modal göster veya detay paneli aç
        const eventId = info.event.id;
        const title = info.event.title;
        const extendedProps = info.event.extendedProps;
        
        // Event Bus üzerinden diğer bileşenlere bildirim gönder
        if (window.eventBus) {
            window.eventBus.emit('production:taskSelected', {
                id: eventId,
                title,
                start: info.event.start,
                end: info.event.end,
                ...extendedProps
            });
        }
    }
    
    handleEventDrop(info) {
        const eventId = info.event.id;
        const newStart = info.event.start;
        const newEnd = info.event.end;
        
        console.log(`Üretim görevi taşındı: ${eventId}`, newStart, newEnd);
        
        // Event Bus üzerinden diğer bileşenlere bildirim gönder
        if (window.eventBus) {
            window.eventBus.emit('production:taskUpdated', {
                id: eventId,
                start: newStart,
                end: newEnd,
                type: 'move'
            });
        }
        
        // Gantt şemasını güncelle
        this.updateGanttData();
        this.updateGanttUI();
    }
    
    handleEventResize(info) {
        const eventId = info.event.id;
        const newEnd = info.event.end;
        
        console.log(`Üretim görevi yeniden boyutlandırıldı: ${eventId}`, newEnd);
        
        // Event Bus üzerinden diğer bileşenlere bildirim gönder
        if (window.eventBus) {
            window.eventBus.emit('production:taskUpdated', {
                id: eventId,
                end: newEnd,
                type: 'resize'
            });
        }
        
        // Gantt şemasını güncelle
        this.updateGanttData();
        this.updateGanttUI();
    }
    
    handleDateSelect(info) {
        console.log('Tarih seçildi:', info.start, info.end);
        
        // Yeni görev oluşturma modalı aç
        if (window.eventBus) {
            window.eventBus.emit('production:dateSelected', {
                start: info.start,
                end: info.end
            });
        }
    }
    
    /**
     * Gantt şema verilerini günceller
     */
    updateGanttData() {
        this.ganttData = this.currentSchedule.map(event => {
            // Tarihleri JS Date nesnelerine dönüştür
            const start = new Date(event.start);
            const end = new Date(event.end);
            
            return {
                id: event.id,
                title: event.title,
                start: start,
                end: end,
                left: this.calculateDayOffset(start),
                width: this.calculateDayWidth(start, end),
                color: event.color,
                extendedProps: event.extendedProps
            };
        });
    }
    
    /**
     * Gantt şemasındaki sol konum hesaplama (hangi günde başlayacağını belirler)
     */
    calculateDayOffset(date) {
        // Haftanın ilk gününden kaç gün sonra olduğunu hesapla
        const today = new Date();
        const dayOfWeek = date.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
        return dayOfWeek * 30; // Her gün 30px genişliğinde
    }
    
    /**
     * Gantt şemasındaki genişlik hesaplama (kaç gün sürdüğünü belirler)
     */
    calculateDayWidth(start, end) {
        // İki tarih arasındaki gün farkını hesapla
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * 30; // Her gün 30px genişliğinde
    }
    
    /**
     * UI'daki Gantt şemasını günceller
     */
    updateGanttUI() {
        const ganttContainer = document.querySelector('.gantt-container');
        if (!ganttContainer) return;
        
        // Gantt başlığını al veya oluştur
        let ganttHeader = ganttContainer.querySelector('.gantt-header');
        if (!ganttHeader) {
            ganttHeader = document.createElement('div');
            ganttHeader.className = 'gantt-header d-flex mb-2';
            ganttContainer.appendChild(ganttHeader);
        }
        
        // Haftalık görünüm için başlık oluştur
        const today = new Date();
        const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
        
        ganttHeader.innerHTML = `
            <div style="width: 120px;"></div>
            <div class="d-flex flex-grow-1">
                ${dayNames.map(day => `<div class="gantt-day text-center" style="width: 30px;">${day}</div>`).join('')}
            </div>
        `;
        
        // Mevcut satırları temizle
        const existingRows = ganttContainer.querySelectorAll('.gantt-row:not(.gantt-header)');
        existingRows.forEach(row => row.remove());
        
        // Her görev için bir satır oluştur
        this.ganttData.forEach(task => {
            const ganttRow = document.createElement('div');
            ganttRow.className = 'gantt-row mb-2';
            ganttRow.innerHTML = `
                <div style="width: 120px; font-size: 12px;">${task.id}</div>
                <div class="d-flex flex-grow-1 position-relative">
                    <div class="gantt-bar" style="left: ${task.left}px; width: ${task.width}px; background-color: ${task.color};">
                        ${this.stageNames[task.extendedProps?.stage] || task.extendedProps?.stage || ''}
                    </div>
                </div>
            `;
            ganttContainer.appendChild(ganttRow);
        });
    }
}

// Singleton servis oluştur
const productionPlanner = new ProductionPlannerService();

// Global olarak erişilebilir yap
window.productionPlanner = productionPlanner;

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    // Gecikmeli başlat - diğer bileşenlerin yüklenmesini bekle
    setTimeout(() => {
        productionPlanner.initialize();
    }, 1000);
});

// EventBus entegrasyonu
if (window.eventBus) {
    // Yeni sipariş ekleme olayını dinle
    window.eventBus.on('order:new', (orderData) => {
        if (productionPlanner.initialized) {
            const schedule = productionPlanner.addOrderToProduction(orderData);
            console.log(`Yeni sipariş için üretim planı oluşturuldu`, schedule);
        }
    });
}

console.log('Üretim Planlama Servisi hazırlanıyor...');
