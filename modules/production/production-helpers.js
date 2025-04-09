/**
 * Üretim Yardımcı Fonksiyonları
 * 
 * Bu modül, üretim ve görev yönetimi için yardımcı fonksiyonlar içerir.
 */

// Görev ekle butonu için olay dinleyicisi ekleme
document.addEventListener('DOMContentLoaded', function() {
    // Add Task modal için kaydet butonu
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addNewTask);
    }

    // Görev listesini yenileme butonu
    const refreshTasksBtn = document.getElementById('refreshTasksBtn');
    if (refreshTasksBtn) {
        refreshTasksBtn.addEventListener('click', function() {
            if (window.taskManager) {
                window.taskManager.renderTaskList();
            }
        });
    }
    
    // Üretim sekmesine geçince görev listesini oto-yenile
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('click', (event) => {
            const targetTab = event.target.getAttribute('href');
            if (targetTab === '#production') {
                setTimeout(() => {
                    if (window.taskManager) {
                        window.taskManager.renderTaskList();
                    }
                }, 100);
            }
        });
    });
});

// Yeni görev ekleme fonksiyonu
function addNewTask() {
    // Form verilerini al
    const orderIdSelect = document.getElementById('taskOrderId');
    const stageSelect = document.getElementById('taskStage');
    const assignedToSelect = document.getElementById('taskAssignedTo');
    const departmentSelect = document.getElementById('taskDepartment');
    const plannedStartInput = document.getElementById('taskPlannedStart');
    const plannedEndInput = document.getElementById('taskPlannedEnd');
    const descriptionInput = document.getElementById('taskDescription');
    
    // Gerekli alanları kontrol et
    if (!orderIdSelect.value || !stageSelect.value || !assignedToSelect.value || 
        !departmentSelect.value || !plannedStartInput.value || !plannedEndInput.value) {
        alert('Lütfen tüm gerekli alanları doldurun!');
        return;
    }
    
    // Tarih kontrolü
    const plannedStart = new Date(plannedStartInput.value);
    const plannedEnd = new Date(plannedEndInput.value);
    if (plannedEnd <= plannedStart) {
        alert('Planlanan bitiş tarihi, başlangıç tarihinden sonra olmalıdır!');
        return;
    }
    
    // Görev objesi oluştur
    const taskData = {
        id: generateTaskId(),
        orderId: orderIdSelect.value,
        stage: stageSelect.value,
        stageName: stageSelect.options[stageSelect.selectedIndex].text,
        cellType: getCellTypeFromOrderId(orderIdSelect.value),
        customer: getCustomerFromOrderId(orderIdSelect.value),
        assignedTo: assignedToSelect.value,
        department: departmentSelect.value,
        plannedStart: plannedStartInput.value,
        plannedEnd: plannedEndInput.value,
        actualStart: null,
        actualEnd: null,
        status: 'planned',
        progress: 0,
        description: descriptionInput.value || '',
        delayReason: null,
        delayExplanation: null,
        requiredOvertimeHours: 0,
        overtimeApproved: false
    };
    
    console.log('Yeni görev ekleniyor:', taskData);
    
    // Görev yöneticisine ekle
    if (window.taskManager) {
        window.taskManager.tasks.push(taskData);
        window.taskManager.saveTasks();
        window.taskManager.renderTaskList();
        
        // EventBus ile bildir
        if (window.eventBus) {
            window.eventBus.emit('production:taskAdded', taskData);
        }
        
        // Başarı mesajı
        if (window.taskManager.showNotification) {
            window.taskManager.showNotification('Yeni görev başarıyla eklendi.', 'success');
        } else {
            alert('Görev başarıyla eklendi.');
        }
        
        // Modalı kapat
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        if (modal) {
            modal.hide();
        }
        
        // Formu temizle
        document.getElementById('addTaskForm').reset();
    } else {
        alert('Görev yönetim modülü başlatılamadı!');
    }
}

// Benzersiz görev ID'si oluştur
function generateTaskId() {
    return 'TASK-' + Math.floor(1000 + Math.random() * 9000).toString();
}

// Sipariş numarasından hücre tipi al
function getCellTypeFromOrderId(orderId) {
    const cellTypeMap = {
        '#0424-1251': 'RM 36 CB',
        '#0424-1245': 'RM 36 CB',
        '#0424-1239': 'RM 36 LB',
        '#0424-1235': 'RM 36 FL'
    };
    
    return cellTypeMap[orderId] || 'Bilinmiyor';
}

// Sipariş numarasından müşteri adı al
function getCustomerFromOrderId(orderId) {
    const customerMap = {
        '#0424-1251': 'AYEDAŞ',
        '#0424-1245': 'TEİAŞ',
        '#0424-1239': 'BEDAŞ',
        '#0424-1235': 'OSMANİYE ELEKTRİK'
    };
    
    return customerMap[orderId] || 'Bilinmiyor';
}

// Gecikme durumunu hesapla
function calculateTaskDelay(plannedEndDate) {
    if (!plannedEndDate) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugünün başlangıcını al
    
    const plannedEnd = new Date(plannedEndDate);
    plannedEnd.setHours(0, 0, 0, 0); // Planlanan tarihin başlangıcını al
    
    // Eğer planlanan tarih geçtiyse, gecikme var demektir
    if (today > plannedEnd) {
        // Gecikme gün sayısını hesapla
        const diffTime = Math.abs(today - plannedEnd);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    return 0; // Gecikme yok
}

// Üretim adımı ilgili departmanı al
function getDepartmentFromStage(stage) {
    const departmentMap = {
        electricDesign: 'Elektrik Tasarım',
        mechanicalDesign: 'Mekanik Tasarım',
        purchasing: 'Satın Alma',
        mechanicalProduction: 'Mekanik Üretim',
        innerAssembly: 'İç Montaj',
        cabling: 'Kablaj',
        generalAssembly: 'Genel Montaj',
        testing: 'Test'
    };
    
    return departmentMap[stage] || 'Bilinmiyor';
}

// Stage değiştikçe departman otomatik güncelle (form için)
function updateTaskDepartment() {
    const stageSelect = document.getElementById('taskStage');
    const departmentSelect = document.getElementById('taskDepartment');
    
    if (stageSelect && departmentSelect) {
        stageSelect.addEventListener('change', function() {
            const selectedStage = stageSelect.value;
            const relatedDepartment = getDepartmentFromStage(selectedStage);
            
            // İlgili departmanı seç
            for(let i=0; i < departmentSelect.options.length; i++) {
                if (departmentSelect.options[i].text === relatedDepartment) {
                    departmentSelect.selectedIndex = i;
                    break;
                }
            }
        });
    }
}

// DOM yüklendikten sonra stage-departman ilişkisini ayarla
document.addEventListener('DOMContentLoaded', function() {
    updateTaskDepartment();
});

console.log('Üretim yardımcı fonksiyonları yüklendi');
