/**
 * order-form.js
 * Sipariş formu işlevleri
 */

// Sayfa yüklendiğinde çalışacak
document.addEventListener('DOMContentLoaded', function() {
    // Form gönderildiğinde
    document.getElementById('orderForm').addEventListener('submit', function(e) {
        e.preventDefault();
        submitOrderForm();
    });

    // İlk hücre ve projeyi ekle
    addCell();
    addProject();
    
    // Bugünün tarihini form değerlerine ekle
    const today = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="orderDate"]').value = today;
});

// Formdan veri toplama fonksiyonu
function collectFormData() {
    const form = document.getElementById('orderForm');
    const formData = new FormData(form);
    
    // JSON nesnesine dönüştür
    const data = {
        // Genel bilgiler
        orderNo: formData.get('orderNo'),
        orderDate: formData.get('orderDate'),
        customerInfo: {
            name: formData.get('customerName'),
            documentNo: formData.get('documentNo'),
            projectName: formData.get('projectName'),
            contractNo: formData.get('contractNo')
        },
        deliveryInfo: {
            deliveryType: formData.get('deliveryType'),
            paymentMethod: formData.get('paymentMethod'),
            caniasProjectNo: formData.get('caniasProjectNo'),
            caniasDocumentNo: formData.get('caniasDocumentNo')
        },
        // Hücreler ve projeler aşağıda doldurulacak
        cells: [],
        projects: [],
        additionalInfo: {
            references: formData.get('referenceDocuments'),
            labelInfo: formData.get('labelInfo'),
            specialDesign: formData.get('specialDesign') === 'on',
            lockingRequired: formData.get('lockingRequired') === 'on',
            comments: formData.get('comments')
        }
    };
    
    // Hücreleri ekle
    const cellItems = document.querySelectorAll('#cellsContainer .cell-item');
    cellItems.forEach((cell, index) => {
        // Temel hücre verileri
        const cellData = {
            id: index + 1,
            facilityName: formData.get(`cells[${index}][facilityName]`),
            acceptanceDate: formData.get(`cells[${index}][acceptanceDate]`),
            deliveryDate: formData.get(`cells[${index}][deliveryDate]`),
            quantity: parseInt(formData.get(`cells[${index}][quantity]`)) || 1,
            productTypeCode: formData.get(`cells[${index}][productTypeCode]`),
            technicalValues: formData.get(`cells[${index}][technicalValues]`),
            serialNumber: formData.get(`cells[${index}][serialNumber]`),
            cellRowCode: formData.get(`cells[${index}][cellRowCode]`),
            isSeconde: formData.get(`cells[${index}][isSeconde]`) === 'on',
            projectNumber: formData.get(`cells[${index}][projectNumber]`),
            
            // Teknik detaylar
            currentTransformer: formData.get(`cells[${index}][currentTransformer]`),
            voltageTransformer: formData.get(`cells[${index}][voltageTransformer]`),
            breakerMotorCoil: {
                motor: formData.get(`cells[${index}][breakerMotor]`),
                coil: formData.get(`cells[${index}][breakerCoil]`)
            },
            disconnectorMotorCoil: {
                motor: formData.get(`cells[${index}][disconnectorMotor]`),
                coil: formData.get(`cells[${index}][disconnectorCoil]`)
            },
            relay: {
                model: formData.get(`cells[${index}][relayModel]`),
                caniasCode: formData.get(`cells[${index}][relayCode]`)
            },
            energyAnalyzer: {
                model: formData.get(`cells[${index}][energyAnalyzer]`),
                caniasCode: formData.get(`cells[${index}][analyzerCode]`)
            },
            agd: {
                model: formData.get(`cells[${index}][agdModel]`),
                caniasCode: formData.get(`cells[${index}][agdCode]`)
            },
            ukd: formData.get(`cells[${index}][ukd]`),
            counter: {
                model: formData.get(`cells[${index}][counterModel]`),
                caniasCode: formData.get(`cells[${index}][counterCode]`)
            },
            breakerFuse: {
                brand: formData.get(`cells[${index}][breakerFuse]`),
                type: ''
            },
            voltageIndicator: formData.get(`cells[${index}][voltageIndicator]`),
            dcSupply: formData.get(`cells[${index}][dcSupply]`),
            cableTermination: {
                model: formData.get(`cells[${index}][cableTermination]`),
                caniasCode: formData.get(`cells[${index}][cableCode]`)
            },
            arrangementBars: {
                model: formData.get(`cells[${index}][arrangementBars]`),
                caniasCode: formData.get(`cells[${index}][barsCode]`)
            },
            closingDetail: formData.get(`cells[${index}][closingDetail]`),
            connectorPart: formData.get(`cells[${index}][connectorPart]`),
            otherFeatures: formData.get(`cells[${index}][otherFeatures]`)
        };
        
        data.cells.push(cellData);
    });
    
    // Projeleri ekle
    const projectItems = document.querySelectorAll('#projectsContainer .project-item');
    projectItems.forEach((project, index) => {
        const projectData = {
            id: index + 1,
            name: formData.get(`projects[${index}][name]`),
            cellArrangement: formData.get(`projects[${index}][cellArrangement]`),
            bars: {
                type1: {
                    count: parseInt(formData.get(`projects[${index}][bars][type1][count]`)) || 0,
                    size: formData.get(`projects[${index}][bars][type1][size]`),
                    caniasCode: formData.get(`projects[${index}][bars][type1][caniasCode]`)
                },
                type2: {
                    count: parseInt(formData.get(`projects[${index}][bars][type2][count]`)) || 0,
                    size: formData.get(`projects[${index}][bars][type2][size]`),
                    caniasCode: formData.get(`projects[${index}][bars][type2][caniasCode]`)
                }
            },
            closingDetails: formData.get(`projects[${index}][closingDetails]`)
        };
        
        data.projects.push(projectData);
    });
    
    return data;
}

// Yeni hücre ekle
function addCell() {
    const container = document.getElementById('cellsContainer');
    const template = document.getElementById('cellTemplate');
    const cellCount = container.querySelectorAll('.cell-item').length;
    
    // Template'ten yeni hücre oluştur
    const cellHTML = template.innerHTML;
    const div = document.createElement('div');
    div.innerHTML = cellHTML;
    
    // Hücre indeksi ve alan isimlerini güncelle
    div.querySelectorAll('.cellIndex').forEach(el => {
        el.textContent = cellCount + 1;
    });
    
    // Input ve diğer elemanların name özelliklerini güncelle
    div.querySelectorAll('[name*="cells[0]"]').forEach(el => {
        el.name = el.name.replace('cells[0]', `cells[${cellCount}]`);
    });
    
    // ID'leri güncelle
    div.querySelectorAll('[id*="sekonde-0"]').forEach(el => {
        el.id = el.id.replace('sekonde-0', `sekonde-${cellCount}`);
    });
    div.querySelectorAll('label[for*="sekonde-0"]').forEach(el => {
        el.setAttribute('for', el.getAttribute('for').replace('sekonde-0', `sekonde-${cellCount}`));
    });
    
    // Container'a ekle
    container.appendChild(div.querySelector('.cell-item'));
}

// Hücre sil
function removeCell(button) {
    const container = document.getElementById('cellsContainer');
    const cell = button.closest('.cell-item');
    container.removeChild(cell);
    
    // Kalan hücrelerin indekslerini güncelle
    const cells = container.querySelectorAll('.cell-item');
    cells.forEach((cell, index) => {
        cell.querySelectorAll('.cellIndex').forEach(el => {
            el.textContent = index + 1;
        });
        
        cell.querySelectorAll('[name*="cells["]').forEach(el => {
            const nameParts = el.name.split('[');
            const endPart = nameParts.slice(2).join('[');
            el.name = `cells[${index}][${endPart}`;
        });
        
        cell.querySelectorAll('[id*="sekonde-"]').forEach(el => {
            el.id = `sekonde-${index}`;
        });
        cell.querySelectorAll('label[for*="sekonde-"]').forEach(el => {
            el.setAttribute('for', `sekonde-${index}`);
        });
    });
}

// Yeni proje ekle
function addProject() {
    const container = document.getElementById('projectsContainer');
    const template = document.getElementById('projectTemplate');
    const projectCount = container.querySelectorAll('.project-item').length;
    
    // Template'ten yeni proje oluştur
    const projectHTML = template.innerHTML;
    const div = document.createElement('div');
    div.innerHTML = projectHTML;
    
    // Proje indeksi ve alan isimlerini güncelle
    div.querySelectorAll('.projectIndex').forEach(el => {
        el.textContent = projectCount + 1;
    });
    
    // Input ve diğer elemanların name özelliklerini güncelle
    div.querySelectorAll('[name*="projects[0]"]').forEach(el => {
        el.name = el.name.replace('projects[0]', `projects[${projectCount}]`);
    });
    
    // Proje adını güncelle
    const projectNameInput = div.querySelector('input[name*="name"]');
    if (projectNameInput) {
        projectNameInput.value = `PROJE-${projectCount + 1}`;
    }
    
    // Container'a ekle
    container.appendChild(div.querySelector('.project-item'));
}

// Proje sil
function removeProject(button) {
    const container = document.getElementById('projectsContainer');
    const project = button.closest('.project-item');
    container.removeChild(project);
    
    // Kalan projelerin indekslerini güncelle
    const projects = container.querySelectorAll('.project-item');
    projects.forEach((project, index) => {
        project.querySelectorAll('.projectIndex').forEach(el => {
            el.textContent = index + 1;
        });
        
        project.querySelectorAll('[name*="projects["]').forEach(el => {
            const nameParts = el.name.split('[');
            const endPart = nameParts.slice(2).join('[');
            el.name = `projects[${index}][${endPart}`;
        });
        
        // Proje adını güncelle (eğer standart proje adı kullanılıyorsa)
        const projectNameInput = project.querySelector('input[name*="name"]');
        if (projectNameInput && projectNameInput.value.startsWith('PROJE-')) {
            projectNameInput.value = `PROJE-${index + 1}`;
        }
    });
}

// Sipariş verilerini kaydet
function saveOrder() {
    const orderData = collectFormData();
    console.log('Sipariş verileri:', orderData);
    
    // Gönderilecek API URL'i
    const apiUrl = '/api/orders';
    
    // AJAX isteği ile verileri gönder
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Sipariş kaydedilemedi');
        }
        return response.json();
    })
    .then(data => {
        console.log('Sipariş başarıyla kaydedildi:', data);
        showToast('Sipariş başarıyla kaydedildi', 'success');
        
        // Başarılı kayıt sonrası yönlendirme
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    })
    .catch(error => {
        console.error('Sipariş kaydetme hatası:', error);
        showToast('Sipariş kaydedilirken bir hata oluştu: ' + error.message, 'error');
        
        // Demo modu için başarılı olduğunu varsayalım
        if (window.location.href.includes('demo=true')) {
            showToast('Demo modu: Sipariş başarıyla kaydedildi (simülasyon)', 'success');
            localStorage.setItem('lastOrderData', JSON.stringify(orderData));
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    });
}

// Taslak olarak kaydet
function saveAsDraft() {
    const orderData = collectFormData();
    
    // localStorage'a kaydet
    localStorage.setItem('orderFormDraft', JSON.stringify(orderData));
    
    showToast('Sipariş taslak olarak kaydedildi', 'success');
}

// Sayfa yüklendiğinde taslak varsa yükle
function loadDraft() {
    const draftData = localStorage.getItem('orderFormDraft');
    if (draftData) {
        const data = JSON.parse(draftData);
        
        // Form alanlarını doldur
        // Burada draftData'dan form alanlarına veri dolduran kod gelecek
        // Bu kısım çok uzun olduğu için şimdilik atlanmıştır
        
        showToast('Taslak sipariş yüklendi', 'info');
    }
}

// Yapay zeka önerileri için
function suggestProductType(input, targetField) {
    if (input.length < 2) return;
    
    // Örnek öneri listesi
    const suggestions = [
        { code: 'RM 36 LB', description: '36kV 630A 16kA Yük Ayırıcılı Giriş Hücresi' },
        { code: 'RM 36 CB', description: '36kV 630A 16kA Kesicili ÇIKIŞ Hücresi' },
        { code: 'RM 36 FL', description: '36kV 200A 16kA Sigortalı Yük Ayırıcılı TR.Koruma Hücresi' }
    ];
    
    // Girilen metne göre filtreleme
    const matches = suggestions.filter(s => 
        s.code.toLowerCase().includes(input.toLowerCase()) || 
        s.description.toLowerCase().includes(input.toLowerCase())
    );
    
    // Öneri kutusunu göster
    showSuggestions(matches, targetField);
}

// Önerileri göster
function showSuggestions(suggestions, targetField) {
    // Bu fonksiyon, önerileri bir popup şeklinde gösterecek
    // ve kullanıcının seçim yapmasını sağlayacak
    // Basitlik için şimdilik console'a yazdırıyoruz
    console.log('Öneriler:', suggestions);
}

/**
 * Sipariş formunu gönderir
 */
async function submitOrderForm() {
    try {
        // Form verilerini doğrula
        if (!validateOrderForm()) {
            return false;
        }
        
        // Form verilerini topla
        const orderData = collectOrderFormData();
        
        // Sipariş formunu devre dışı bırak (işlem sırasında)
        toggleOrderFormElements(true);
        
        // Sipariş ekleme işlemi
        if (typeof addNewOrder === 'function') {
            const result = await addNewOrder(orderData);
            
            if (result.success) {
                // Sipariş başarıyla eklendi, formun sıfırlanması veya kapanması gibi işlemler
                console.log('Sipariş başarıyla eklendi:', result.orderId);
            } else {
                console.error('Sipariş eklenirken hata:', result.error);
            }
        } else {
            console.error('addNewOrder fonksiyonu bulunamadı');
            document.getElementById('order-form-status').innerHTML = `
                <div class="alert alert-danger">
                    <strong>Hata!</strong> Sipariş ekleme fonksiyonu bulunamadı.
                </div>
            `;
        }
        
        // Formu tekrar etkinleştir
        toggleOrderFormElements(false);
        
        return false; // Formun normal submit işlemini engelle
    } catch (error) {
        console.error('Sipariş formu gönderme hatası:', error);
        document.getElementById('order-form-status').innerHTML = `
            <div class="alert alert-danger">
                <strong>Hata!</strong> Sipariş formu gönderilirken bir sorun oluştu: ${error.message}
            </div>
        `;
        toggleOrderFormElements(false);
        return false;
    }
}

/**
 * Sipariş formu alanlarını toplar
 * @returns {Object} Sipariş verileri
 */
function collectOrderFormData() {
    const orderForm = document.getElementById('order-form');
    
    const orderData = {
        orderNo: orderForm.elements['order-no'].value.trim(),
        customer: orderForm.elements['customer-name'].value.trim(),
        cellType: orderForm.elements['cell-type'].value,
        quantity: parseInt(orderForm.elements['quantity'].value) || 1,
        deliveryDate: new Date(orderForm.elements['delivery-date'].value),
        priority: parseInt(orderForm.elements['priority'].value) || 3,
        notes: orderForm.elements['notes'].value.trim(),
        
        // Teknik detaylar
        specifications: {
            voltage: parseInt(orderForm.elements['voltage'].value) || 36,
            current: parseInt(orderForm.elements['current'].value) || 630,
            relayType: orderForm.elements['relay-type'].value,
            controlVoltage: parseInt(orderForm.elements['control-voltage'].value) || 24
        },
        
        // Ek alanlar
        contactPerson: orderForm.elements['contact-person'].value.trim(),
        contactEmail: orderForm.elements['contact-email'].value.trim(),
        contactPhone: orderForm.elements['contact-phone'].value.trim(),
        
        // Meta veriler
        createdBy: firebase.auth().currentUser ? firebase.auth().currentUser.email : 'anonim',
        createdAt: new Date()
    };
    
    return orderData;
}

/**
 * Sipariş formunu doğrular
 * @returns {boolean} Form geçerli mi
 */
function validateOrderForm() {
    const orderForm = document.getElementById('order-form');
    const orderNo = orderForm.elements['order-no'].value.trim();
    const customerName = orderForm.elements['customer-name'].value.trim();
    const cellType = orderForm.elements['cell-type'].value;
    const quantity = orderForm.elements['quantity'].value;
    const deliveryDate = orderForm.elements['delivery-date'].value;
    
    let isValid = true;
    let errorMessages = [];
    
    // Zorunlu alanları kontrol et
    if (!orderNo) {
        isValid = false;
        errorMessages.push('Sipariş numarası zorunludur');
        orderForm.elements['order-no'].classList.add('is-invalid');
    } else {
        orderForm.elements['order-no'].classList.remove('is-invalid');
    }
    
    if (!customerName) {
        isValid = false;
        errorMessages.push('Müşteri adı zorunludur');
        orderForm.elements['customer-name'].classList.add('is-invalid');
    } else {
        orderForm.elements['customer-name'].classList.remove('is-invalid');
    }
    
    if (!cellType) {
        isValid = false;
        errorMessages.push('Hücre tipi seçilmelidir');
        orderForm.elements['cell-type'].classList.add('is-invalid');
    } else {
        orderForm.elements['cell-type'].classList.remove('is-invalid');
    }
    
    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
        isValid = false;
        errorMessages.push('Miktar geçerli bir sayı olmalıdır (>0)');
        orderForm.elements['quantity'].classList.add('is-invalid');
    } else {
        orderForm.elements['quantity'].classList.remove('is-invalid');
    }
    
    if (!deliveryDate) {
        isValid = false;
        errorMessages.push('Teslim tarihi seçilmelidir');
        orderForm.elements['delivery-date'].classList.add('is-invalid');
    } else {
        // Teslim tarihi bugünden önce olmamalı
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(deliveryDate);
        
        if (inputDate < today) {
            isValid = false;
            errorMessages.push('Teslim tarihi bugünden önce olamaz');
            orderForm.elements['delivery-date'].classList.add('is-invalid');
        } else {
            orderForm.elements['delivery-date'].classList.remove('is-invalid');
        }
    }
    
    // Hata mesajlarını göster
    const statusElement = document.getElementById('order-form-status');
    if (!isValid) {
        statusElement.innerHTML = `
            <div class="alert alert-danger">
                <strong>Hata!</strong> Lütfen formdaki hataları düzeltin:
                <ul>
                    ${errorMessages.map(msg => `<li>${msg}</li>`).join('')}
                </ul>
            </div>
        `;
    } else {
        statusElement.innerHTML = '';
    }
    
    return isValid;
}

/**
 * Form elementlerini etkinleştirir/devre dışı bırakır
 * @param {boolean} disabled - Devre dışı bırakılsın mı
 */
function toggleOrderFormElements(disabled) {
    const orderForm = document.getElementById('order-form');
    const elements = orderForm.elements;
    
    for (let i = 0; i < elements.length; i++) {
        elements[i].disabled = disabled;
    }
    
    const submitButton = document.getElementById('submit-order-button');
    if (submitButton) {
        if (disabled) {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
            submitButton.disabled = true;
        } else {
            submitButton.innerHTML = '<i class="fas fa-save"></i> Siparişi Kaydet';
            submitButton.disabled = false;
        }
    }
}

/**
 * Yeni sipariş oluşturma formunu görüntüler
 */
function showOrderCreationForm() {
    document.getElementById('active-orders-container').style.display = 'none';
    document.getElementById('order-form-container').style.display = 'block';
    
    // Form alanlarını sıfırla
    clearOrderForm();
    
    // Varsayılan teslim tarihini ayarla (bugünden 30 gün sonrası)
    const defaultDeliveryDate = new Date();
    defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 30);
    
    const deliveryDateField = document.getElementById('order-form').elements['delivery-date'];
    if (deliveryDateField) {
        deliveryDateField.valueAsDate = defaultDeliveryDate;
    }
}

/**
 * Sipariş formunu temizler
 */
function clearOrderForm() {
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.reset();
        
        // Form doğrulama işaretlerini temizle
        const invalidElements = orderForm.querySelectorAll('.is-invalid');
        invalidElements.forEach(element => {
            element.classList.remove('is-invalid');
        });
        
        // Durum mesajını temizle
        document.getElementById('order-form-status').innerHTML = '';
    }
}