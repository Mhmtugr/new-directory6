class ProductionTaskManager {
    constructor() {
        this.tasks = [];
        this.shiftSettings = {
            regularHours: 8,
            maxOvertimeHours: 4
        };
        this.initialized = false;
    }

    /**
     * Görev tamamlama işlemi
     */
    completeTask(data) {
        const task = this.getTaskById(data.id);
        if (!task) return false;

        // Görevi tamamlandı olarak güncelle
        task.status = 'completed';
        task.progress = 100;
        task.actualEnd = data.actualEnd || new Date().toISOString().split('T')[0];
        
        // Görevleri kaydet
        this.saveTasks();
        
        // Görünümü güncelle
        this.renderTaskList();
        
        // EventBus ile bildir
        if (window.eventBus) {
            window.eventBus.emit('task:completed', task);
        }
        
        // Başarı mesajı göster
        this.showNotification(`Görev ${task.id} başarıyla tamamlandı.`, 'success');
        
        return true;
    }

    /**
     * ID'ye göre görevi al
     */
    getTaskById(id) {
        return this.tasks.find(task => task.id === id);
    }

    /**
     * Görevleri yerel depolamaya kaydet
     * Gerçek uygulamada bu bir API çağrısı olacaktır
     */
    saveTasks() {
        try {
            localStorage.setItem('productionTasks', JSON.stringify(this.tasks));
            return true;
        } catch (error) {
            console.error('Görevler kaydedilirken hata:', error);
            return false;
        }
    }

    /**
     * Bildirim göster
     */
    showNotification(message, type = 'info') {
        if (typeof bootstrap !== 'undefined' && typeof bootstrap.Toast !== 'undefined') {
            // Toast konteynerini bul veya oluştur
            let toastContainer = document.querySelector('.toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
                document.body.appendChild(toastContainer);
            }
            
            const toastId = `toast-${Date.now()}`;
            const toast = document.createElement('div');
            toast.className = `toast align-items-center text-white bg-${type}`;
            toast.id = toastId;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            `;
            
            toastContainer.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            
            toast.addEventListener('hidden.bs.toast', () => {
                toast.remove();
            });
        } else {
            alert(message);
        }
    }

    /**
     * Durum badge'i döndür
     */
    getStatusBadge(status) {
        const statusMap = {
            planned: '<span class="badge bg-info">Planlandı</span>',
            inProgress: '<span class="badge bg-warning">Devam Ediyor</span>',
            delayed: '<span class="badge bg-danger">Gecikti</span>',
            completed: '<span class="badge bg-success">Tamamlandı</span>',
            cancelled: '<span class="badge bg-secondary">İptal Edildi</span>'
        };
        
        return statusMap[status] || '<span class="badge bg-secondary">Bilinmiyor</span>';
    }

    /**
     * İlerleme çubuğu sınıfını döndür
     */
    getProgressBarClass(status) {
        const classMap = {
            planned: 'bg-info',
            inProgress: 'bg-warning',
            delayed: 'bg-danger',
            completed: 'bg-success',
            cancelled: 'bg-secondary'
        };
        
        return classMap[status] || 'bg-secondary';
    }

    /**
     * Tarih formatla (ISO -> DD.MM.YYYY)
     */
    formatDate(isoDate) {
        if (!isoDate) return '-';
        const date = new Date(isoDate);
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    }

    /**
     * Gecikme günlerini hesapla
     */
    calculateDelay(task) {
        if (!task) return 0;
        
        // Eğer görev tamamlandıysa gerçek bitiş tarihine göre hesapla
        if (task.status === 'completed' && task.actualEnd && task.plannedEnd) {
            const actual = new Date(task.actualEnd);
            const planned = new Date(task.plannedEnd);
            const diffDays = Math.round((actual - planned) / (1000 * 60 * 60 * 24));
            return Math.max(0, diffDays); // Negatif değilse, yani erken bittiyse 0 dön
        }
        
        // Eğer devam ediyorsa ve planlanan bitiş tarihi geçtiyse
        if ((task.status === 'inProgress' || task.status === 'delayed') && task.plannedEnd) {
            const today = new Date();
            const planned = new Date(task.plannedEnd);
            today.setHours(0, 0, 0, 0); // Bugünün başlangıcına ayarla
            planned.setHours(0, 0, 0, 0); // Planlanan tarihin başlangıcına ayarla
            
            // Eğer bugün planlanan tarihten sonraysa, aradaki farkı hesapla
            if (today > planned) {
                const diffDays = Math.round((today - planned) / (1000 * 60 * 60 * 24));
                return diffDays;
            }
        }
        
        return 0;
    }

    /**
     * Görevin zamanında tamamlanıp tamamlanmadığını kontrol et
     */
    isCompletedOnTime(task) {
        if (!task || task.status !== 'completed' || !task.actualEnd || !task.plannedEnd) return false;
        
        const actual = new Date(task.actualEnd);
        const planned = new Date(task.plannedEnd);
        return actual <= planned;
    }

    /**
     * Termin tarihine gecikme etkisini hesapla
     */
    calculateTerminEffect(task) {
        if (!task) return 0;
        
        // Eğer görev zamanında tamamlandı veya planlananı bitmemişse etkisi yok
        if (task.status === 'completed' && this.isCompletedOnTime(task)) return 0;
        if (task.status === 'planned' || task.status === 'inProgress' && new Date(task.plannedEnd) >= new Date()) return 0;
        
        // Gecikme gün sayısını al
        const delayDays = this.calculateDelay(task);
        
        // Ek mesai ile telafi miktarını hesapla
        const recoveredDays = task.requiredOvertimeHours > 0 
            ? this.calculateRecoveredDelayDays(task.requiredOvertimeHours)
            : 0;
        
        // Net etki
        const netEffect = Math.max(0, delayDays - recoveredDays);
        
        // İlerleyen aşamaların etkisini hesaba kat
        // Paralel işler varsa gecikme etkisi azalabilir (basitleştirilmiş hesaplama)
        const parallelWorkFactor = 0.8; // Paralel işlerin etkisi ile %20 azaltma
        
        // Örnek: Montaj aşamasında gecikme test sürecini doğrudan etkiler
        // Tasarım aşamasında gecikme sonraki tüm adımları etkiler
        const stageEffectMap = {
            electricDesign: 1.0, // Elektrik tasarımı gecikmesi en büyük etkiye sahip
            mechanicalDesign: 1.0, // Mekanik tasarım gecikmesi en büyük etkiye sahip
            purchasing: 0.9, // Satın alma gecikmesi önemli ama paralel iş yapılabilir
            mechanicalProduction: 0.8, // Mekanik üretim gecikmesi önemli
            innerAssembly: 0.7, // İç montaj gecikmesi
            cabling: 0.7, // Kablaj gecikmesi
            generalAssembly: 0.6, // Genel montaj gecikmesi
            testing: 0.4  // Test gecikmesi sadece termin tarihini etkiler
        };
        
        const stageFactor = stageEffectMap[task.stage] || 0.5; // Bilinmeyen aşama için 0.5 varsayılan değer
        
        // Termin etkisi = Net gecikme gün sayısı * Aşama faktörü * Paralel iş faktörü
        const estimatedEffect = Math.ceil(netEffect * stageFactor * parallelWorkFactor);
        
        return estimatedEffect;
    }

    /**
     * Ek mesai ile kaç gün telafi edileceğini hesapla
     */
    calculateRecoveredDelayDays(overtimeHours) {
        if (!overtimeHours || overtimeHours <= 0) return 0;
        
        // Varsayımlar:
        // - Normal günlük mesai 8 saat 
        // - Ek mesai ile 4 saat daha çalışılabilir (toplam 12 saat)
        // - 8 saatlik normal mesaide iş gücü verimi %100
        // - Ek mesaide verim %75 (yorgunluk faktörü)
        
        const regularHours = this.shiftSettings.regularHours; // 8 saat
        const dailyOvertimeHours = this.shiftSettings.maxOvertimeHours; // 4 saat
        const overtimeEfficiency = 0.75; // Ek mesai verimi
        
        // Ek mesai saatleri / (Günlük ek mesai * verim) = Kurtarılan gün sayısı
        // Örn: 16 saat ek mesai / (4 saat/gün * 0.75) = 5.33 gün -> 5 gün (aşağıya yuvarla)
        const recoveredDays = Math.floor(overtimeHours / (dailyOvertimeHours * overtimeEfficiency));
        
        return recoveredDays;
    }
    
    /**
     * Gecikme için gerekli ek mesaiyi tahmin et
     */
    estimateRequiredOvertime(task) {
        if (!task) return 0;
        
        const delay = this.calculateDelay(task);
        if (delay <= 0) return 0;
        
        // Gecikmeyi kapatmak için gereken tahmini ek mesai
        // Varsayımlar:
        // - 1 günlük normal mesai 8 saat
        // - Ek mesaide verim %75 (yorgunluk faktörü)
        
        const regularHours = this.shiftSettings.regularHours;
        const overtimeEfficiency = 0.75;
        
        // Gerekli ek mesai = Gecikme (gün) * Günlük normal mesai / Ek mesai verimi
        // Örn: 3 gün gecikme * 8 saat / 0.75 = 32 saat ek mesai
        const requiredOvertimeHours = Math.ceil(delay * regularHours / overtimeEfficiency);
        
        // Mevcut iş bitiş oranına göre düzeltme yap
        // Eğer iş %70 bittiyse, teorik olarak geri kalan işin bitmesi için gereken mesai:
        const remainingWorkPercentage = (100 - (task.progress || 0)) / 100;
        const adjustedOvertime = Math.ceil(requiredOvertimeHours * remainingWorkPercentage);
        
        return adjustedOvertime;
    }
    
    /**
     * Yeni bitiş tarihini hesapla
     */
    calculateNewEndDate(dateStr, addDays) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + addDays);
        return date.toISOString().split('T')[0];
    }
}

// Singleton örneği oluştur
const taskManager = new ProductionTaskManager();

// Global erişim sağla
window.taskManager = taskManager;

// EventBus entegrasyonu 
if (window.eventBus) {
    console.log('Task Manager EventBus entegrasyonu yapılıyor');
    
    // Yeni görev ekleme olayını dinle
    window.eventBus.on('production:taskAdded', (taskData) => {
        if (taskManager.initialized) {
            taskManager.addTask(taskData);
        }
    });
    
    // Görev güncelleme olayını dinle
    window.eventBus.on('production:taskUpdated', (taskData) => {
        if (taskManager.initialized) {
            taskManager.updateTask(taskData);
        }
    });
}

console.log('Üretim Görev Yönetim Modülü yüklendi...');