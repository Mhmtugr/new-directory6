/**
 * supplier-management.js
 * Tedarikçi yönetimi ve ilişkileri
 */

// Tedarikçi yönetimi modülü
window.SupplierManagementModule = (function() {
    // Özel değişkenler
    let supplierData = [];
    let supplierCategories = [];
    let supplierRatings = {};
    let activeFilters = {};
    let orderQueue = [];
    let missingMaterials = [];

    // Tüm tedarikçileri yükle
    async function loadSuppliers() {
        try {
            const response = await fetch('/api/suppliers');
            if (!response.ok) {
                throw new Error('Tedarikçiler yüklenemedi');
            }
            supplierData = await response.json();
            return supplierData;
        } catch (error) {
            console.error("Tedarikçileri yükleme hatası:", error);
            showNotification('error', 'Tedarikçiler yüklenemedi', error.message);
            
            // Fallback olarak demo verileri
            supplierData = getExampleSuppliers();
            return supplierData;
        }
    }

    // Tedarikçi kategorilerini yükle
    async function loadSupplierCategories() {
        try {
            const response = await fetch('/api/suppliers/categories');
            if (!response.ok) {
                throw new Error('Tedarikçi kategorileri yüklenemedi');
            }
            supplierCategories = await response.json();
            return supplierCategories;
        } catch (error) {
            console.error("Tedarikçi kategorileri yükleme hatası:", error);
            // Demo kategoriler
            supplierCategories = [
                { id: 'c1', name: 'Elektrik Malzemeleri' },
                { id: 'c2', name: 'Mekanik Parçalar' },
                { id: 'c3', name: 'Kablaj Malzemeleri' },
                { id: 'c4', name: 'Elektronik Komponentler' },
                { id: 'c5', name: 'Sarf Malzemeler' }
            ];
            return supplierCategories;
        }
    }

    // Eksik malzemeleri yükle
    async function loadMissingMaterials() {
        try {
            const response = await fetch('/api/inventory/missing');
            if (!response.ok) {
                throw new Error('Eksik malzemeler yüklenemedi');
            }
            missingMaterials = await response.json();
            
            // Siparişlere göre grupla
            groupMissingMaterialsByOrder();
            
            return missingMaterials;
        } catch (error) {
            console.error("Eksik malzemeleri yükleme hatası:", error);
            showNotification('error', 'Eksik malzemeler yüklenemedi', error.message);
            return [];
        }
    }

    // Eksik malzemeleri siparişlere göre grupla
    function groupMissingMaterialsByOrder() {
        orderQueue = [];
        
        // Her eksik malzeme için sipariş gruplarını oluştur
        missingMaterials.forEach(material => {
            // Sipariş zaten oluşturulmuş mu kontrol et
            let orderIndex = orderQueue.findIndex(order => order.orderId === material.orderId);
            
            if (orderIndex === -1) {
                // Yeni sipariş grubu oluştur
                orderQueue.push({
                    orderId: material.orderId,
                    orderNo: material.orderNo,
                    customer: material.customer,
                    deliveryDate: material.deliveryDate,
                    missingMaterials: [material],
                    totalMaterials: 1,
                    criticalCount: material.isCritical ? 1 : 0,
                    status: material.isCritical ? 'critical' : 'normal'
                });
            } else {
                // Mevcut sipariş grubuna ekle
                orderQueue[orderIndex].missingMaterials.push(material);
                orderQueue[orderIndex].totalMaterials++;
                
                if (material.isCritical) {
                    orderQueue[orderIndex].criticalCount++;
                    orderQueue[orderIndex].status = 'critical';
                }
            }
        });
        
        // Teslim tarihine ve kritik duruma göre sırala
        orderQueue.sort((a, b) => {
            // Önce kritik olanlar
            if (a.status === 'critical' && b.status !== 'critical') return -1;
            if (a.status !== 'critical' && b.status === 'critical') return 1;
            
            // Sonra teslim tarihine göre
            return new Date(a.deliveryDate) - new Date(b.deliveryDate);
        });
    }

    // Tedarikçi puanlamalarını yükle
    async function loadSupplierRatings() {
        try {
            const response = await fetch('/api/suppliers/ratings');
            if (!response.ok) {
                throw new Error('Tedarikçi puanlamaları yüklenemedi');
            }
            const ratings = await response.json();
            
            // ID'ye göre erişim için yeniden düzenle
            supplierRatings = {};
            ratings.forEach(rating => {
                supplierRatings[rating.supplierId] = rating;
            });
            
            return supplierRatings;
        } catch (error) {
            console.error("Tedarikçi puanlamaları yükleme hatası:", error);
            return {};
        }
    }

    // Yeni tedarikçi oluştur
    async function createSupplier(supplierData) {
        try {
            const response = await fetch('/api/suppliers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(supplierData)
            });
            
            if (!response.ok) {
                throw new Error('Tedarikçi oluşturulamadı');
            }
            
            const result = await response.json();
            showNotification('success', 'Tedarikçi Eklendi', 'Yeni tedarikçi başarıyla eklendi');
            
            // Listeyi güncelle
            await loadSuppliers();
            
            return result;
        } catch (error) {
            console.error("Tedarikçi oluşturma hatası:", error);
            showNotification('error', 'Tedarikçi Eklenemedi', error.message);
            throw error;
        }
    }

    // Tedarikçiyi güncelle
    async function updateSupplier(supplierId, supplierData) {
        try {
            const response = await fetch(`/api/suppliers/${supplierId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(supplierData)
            });
            
            if (!response.ok) {
                throw new Error('Tedarikçi güncellenemedi');
            }
            
            const result = await response.json();
            showNotification('success', 'Tedarikçi Güncellendi', 'Tedarikçi bilgileri başarıyla güncellendi');
            
            // Listeyi güncelle
            await loadSuppliers();
            
            return result;
        } catch (error) {
            console.error("Tedarikçi güncelleme hatası:", error);
            showNotification('error', 'Tedarikçi Güncellenemedi', error.message);
            throw error;
        }
    }

    // Tedarikçi performansını değerlendir
    async function rateSupplier(supplierId, ratingData) {
        try {
            const response = await fetch(`/api/suppliers/${supplierId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ratingData)
            });
            
            if (!response.ok) {
                throw new Error('Tedarikçi değerlendirmesi kaydedilemedi');
            }
            
            const result = await response.json();
            showNotification('success', 'Değerlendirme Kaydedildi', 'Tedarikçi değerlendirmesi başarıyla kaydedildi');
            
            // Değerlendirmeleri yeniden yükle
            await loadSupplierRatings();
            
            return result;
        } catch (error) {
            console.error("Tedarikçi değerlendirme hatası:", error);
            showNotification('error', 'Değerlendirme Kaydedilemedi', error.message);
            throw error;
        }
    }

    // Belirli malzeme için en uygun tedarikçileri bul
    async function findSuppliersForMaterial(materialCode, categoryId) {
        try {
            let url = `/api/suppliers/match?materialCode=${encodeURIComponent(materialCode)}`;
            if (categoryId) {
                url += `&categoryId=${encodeURIComponent(categoryId)}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Uygun tedarikçiler bulunamadı');
            }
            
            const matches = await response.json();
            return matches;
        } catch (error) {
            console.error("Tedarikçi eşleştirme hatası:", error);
            
            // Canlı veritabanından alamadıysak mevcut veriyi filter edelim
            return supplierData
                .filter(supplier => {
                    // Kategoriye göre filtrele
                    if (categoryId && supplier.categoryId !== categoryId) {
                        return false;
                    }
                    
                    // Malzeme kodunu içeren tedarikçileri seç (gerçekte daha karmaşık bir algoritma gerekir)
                    return supplier.suppliedMaterials && 
                           supplier.suppliedMaterials.some(m => 
                               m.materialCode.includes(materialCode) || 
                               m.description.toLowerCase().includes(materialCode.toLowerCase())
                           );
                })
                .map(supplier => ({
                    ...supplier,
                    match: 0.85, // Tahmini eşleşme oranı
                    estimatedDelivery: 7, // Tahmini teslimat süresi (gün)
                    lastOrderPrice: supplier.suppliedMaterials?.find(m => 
                        m.materialCode.includes(materialCode))?.lastPrice || 0
                }))
                .sort((a, b) => b.match - a.match);
        }
    }

    // Tedarikçiye satın alma talebi gönder
    async function sendPurchaseRequest(supplierId, items) {
        try {
            const response = await fetch(`/api/suppliers/${supplierId}/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items })
            });
            
            if (!response.ok) {
                throw new Error('Satın alma talebi gönderilemedi');
            }
            
            const result = await response.json();
            showNotification('success', 'Talep Gönderildi', 'Satın alma talebi başarıyla gönderildi');
            
            return result;
        } catch (error) {
            console.error("Satın alma talebi gönderme hatası:", error);
            showNotification('error', 'Talep Gönderilemedi', error.message);
            throw error;
        }
    }

    // Tedarikçi tablosunu oluştur
    function renderSuppliersTable(containerId, suppliers) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`${containerId} ID'li konteyner bulunamadı`);
            return;
        }
        
        // Tablo yoksa oluştur
        if (!container.querySelector('table')) {
            container.innerHTML = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Tedarikçi Adı</th>
                            <th>Kategori</th>
                            <th>İletişim</th>
                            <th>Performans</th>
                            <th>Teslimat Süresi (Ort.)</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
        }
        
        const tableBody = container.querySelector('tbody');
        
        // Tablo içeriğini temizle
        tableBody.innerHTML = '';
        
        // Tedarikçi yoksa mesaj göster
        if (!suppliers || suppliers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Tedarikçi bulunamadı</td></tr>';
            return;
        }
        
        // Tedarikçileri tabloya ekle
        suppliers.forEach(supplier => {
            // Kategori adını bul
            const category = supplierCategories.find(c => c.id === supplier.categoryId);
            const categoryName = category ? category.name : '-';
            
            // Performans puanını bul
            const rating = supplierRatings[supplier.id] || { 
                overallScore: '-', 
                deliveryScore: '-', 
                qualityScore: '-',
                avgDeliveryTime: '-'
            };
            
            // Performans skoru formatı
            let scoreClass = '';
            let scoreValue = rating.overallScore;
            if (scoreValue !== '-') {
                if (scoreValue >= 4) scoreClass = 'text-success';
                else if (scoreValue >= 3) scoreClass = 'text-warning';
                else scoreClass = 'text-danger';
                scoreValue = scoreValue.toFixed(1);
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="ms-2">
                            <h6 class="mb-0">${supplier.name}</h6>
                            <small class="text-muted">${supplier.code || ''}</small>
                        </div>
                    </div>
                </td>
                <td>${categoryName}</td>
                <td>
                    <div>${supplier.contactPerson || '-'}</div>
                    <small>${supplier.email || '-'}</small>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2 ${scoreClass}">${scoreValue}</span>
                        <div class="progress" style="width: 100px; height: 6px;">
                            <div class="progress-bar ${scoreClass.replace('text-', 'bg-')}" 
                                 style="width: ${scoreValue !== '-' ? (scoreValue / 5) * 100 : 0}%"></div>
                        </div>
                    </div>
                </td>
                <td>${rating.avgDeliveryTime !== '-' ? `${rating.avgDeliveryTime} gün` : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="SupplierManagementModule.showSupplierDetail('${supplier.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success me-1" onclick="SupplierManagementModule.showRequestForm('${supplier.id}')">
                        <i class="bi bi-cart-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="SupplierManagementModule.showRatingForm('${supplier.id}')">
                        <i class="bi bi-star"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    // Sipariş kuyruğunu göster
    function renderOrderQueue(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`${containerId} ID'li konteyner bulunamadı`);
            return;
        }
        
        // İçeriği temizle
        container.innerHTML = '';
        
        // Başlık ekle
        const header = document.createElement('div');
        header.className = 'queue-header';
        header.innerHTML = `
            <h4>Sipariş Kuyruğu</h4>
            <p class="text-muted">Eksik malzemesi olan ${orderQueue.length} sipariş bulunuyor</p>
        `;
        container.appendChild(header);
        
        // Sipariş listesi
        const orderList = document.createElement('div');
        orderList.className = 'order-queue-list';
        
        if (orderQueue.length === 0) {
            orderList.innerHTML = '<div class="alert alert-info">Tüm siparişlerin malzemeleri tamam</div>';
        } else {
            orderQueue.forEach(order => {
                const orderItem = document.createElement('div');
                orderItem.className = `order-queue-item ${order.status}`;
                
                // Teslim tarihi analizi
                const today = new Date();
                const deliveryDate = new Date(order.deliveryDate);
                const daysDiff = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
                
                let timeStatus = 'normal';
                let timeText = `${daysDiff} gün kaldı`;
                
                if (daysDiff < 0) {
                    timeStatus = 'overdue';
                    timeText = `${Math.abs(daysDiff)} gün gecikti`;
                } else if (daysDiff <= 7) {
                    timeStatus = 'critical';
                    timeText = `${daysDiff} gün kaldı`;
                }
                
                orderItem.innerHTML = `
                    <div class="order-queue-header">
                        <div class="order-info">
                            <h5>${order.orderNo}</h5>
                            <span>${order.customer}</span>
                        </div>
                        <div class="order-time ${timeStatus}">
                            ${timeText}
                        </div>
                    </div>
                    <div class="order-queue-body">
                        <div class="missing-info">
                            <span class="missing-count">${order.totalMaterials}</span>
                            <span class="missing-text">eksik malzeme</span>
                            ${order.criticalCount > 0 ? `<span class="critical-label">${order.criticalCount} kritik</span>` : ''}
                        </div>
                        <button class="btn btn-sm btn-primary view-missing" 
                                onclick="SupplierManagementModule.showOrderMaterials('${order.orderId}')">
                            Malzemeleri Gör
                        </button>
                    </div>
                `;
                
                orderList.appendChild(orderItem);
            });
        }
        
        container.appendChild(orderList);
    }

    // Sipariş eksik malzemelerini göster
    function showOrderMaterials(orderId) {
        const order = orderQueue.find(o => o.orderId === orderId);
        if (!order) {
            showNotification('error', 'Sipariş Bulunamadı', 'Seçilen sipariş bulunamadı');
            return;
        }
        
        // Modal oluştur
        const modalId = 'missing-materials-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Eksik Malzemeler: ${order.orderNo}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Malzeme Kodu</th>
                                        <th>Açıklama</th>
                                        <th>Miktar</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody id="missing-materials-table-body"></tbody>
                            </table>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" 
                                    onclick="SupplierManagementModule.requestAllMaterials('${orderId}')">
                                Tümünü Talep Et
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Modal içeriğini doldur
        const tableBody = document.getElementById('missing-materials-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';
            
            order.missingMaterials.forEach(material => {
                const row = document.createElement('tr');
                
                if (material.isCritical) {
                    row.className = 'table-danger';
                }
                
                row.innerHTML = `
                    <td>${material.materialCode}</td>
                    <td>${material.description}</td>
                    <td>${material.quantity} ${material.unit}</td>
                    <td>
                        <span class="badge bg-${material.isCritical ? 'danger' : 'warning'}">
                            ${material.isCritical ? 'Kritik' : 'Bekliyor'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" 
                                onclick="SupplierManagementModule.findSupplierForMaterial('${material.materialCode}')">
                            Tedarikçi Bul
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        }
        
        // Modalı göster
        new bootstrap.Modal(modal).show();
    }

    // Malzeme için tedarikçi bul
    async function findSupplierForMaterial(materialCode) {
        const modalId = 'find-suppliers-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Tedarikçi Bul: <span id="material-code-title"></span></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-3" id="supplier-loading">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Yükleniyor...</span>
                                </div>
                                <p>Tedarikçiler aranıyor...</p>
                            </div>
                            <div id="supplier-results" style="display: none;">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Tedarikçi</th>
                                            <th>Eşleşme</th>
                                            <th>Son Fiyat</th>
                                            <th>Tahmini Teslimat</th>
                                            <th>Performans</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody id="suppliers-for-material-body"></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Material kodu başlığını ayarla
        document.getElementById('material-code-title').textContent = materialCode;
        
        // Loading göster, sonuçları gizle
        document.getElementById('supplier-loading').style.display = 'block';
        document.getElementById('supplier-results').style.display = 'none';
        
        // Modalı göster
        new bootstrap.Modal(modal).show();
        
        // Tedarikçileri ara
        try {
            const suppliers = await findSuppliersForMaterial(materialCode);
            
            // Tablo içeriğini doldur
            const tableBody = document.getElementById('suppliers-for-material-body');
            tableBody.innerHTML = '';
            
            if (suppliers.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Uygun tedarikçi bulunamadı</td></tr>';
            } else {
                suppliers.forEach(supplier => {
                    // Performans puanını bul
                    const rating = supplierRatings[supplier.id] || { 
                        overallScore: '-', 
                        deliveryScore: '-',
                        qualityScore: '-'
                    };
                    
                    // Performans skoru formatı
                    let scoreClass = '';
                    let scoreValue = rating.overallScore;
                    if (scoreValue !== '-') {
                        if (scoreValue >= 4) scoreClass = 'text-success';
                        else if (scoreValue >= 3) scoreClass = 'text-warning';
                        else scoreClass = 'text-danger';
                        scoreValue = scoreValue.toFixed(1);
                    }
                    
                    // Eşleşme formatı
                    const match = supplier.match * 100;
                    let matchClass = '';
                    if (match >= 90) matchClass = 'text-success';
                    else if (match >= 70) matchClass = 'text-warning';
                    else matchClass = 'text-danger';
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="ms-2">
                                    <h6 class="mb-0">${supplier.name}</h6>
                                    <small class="text-muted">${supplier.code || ''}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <span class="${matchClass}">${match.toFixed(0)}%</span>
                            </div>
                        </td>
                        <td>${supplier.lastOrderPrice ? `₺${supplier.lastOrderPrice.toFixed(2)}` : '-'}</td>
                        <td>${supplier.estimatedDelivery} gün</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <span class="me-2 ${scoreClass}">${scoreValue}</span>
                                <div class="progress" style="width: 50px; height: 6px;">
                                    <div class="progress-bar ${scoreClass.replace('text-', 'bg-')}" 
                                         style="width: ${scoreValue !== '-' ? (scoreValue / 5) * 100 : 0}%"></div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-primary" 
                                    onclick="SupplierManagementModule.requestMaterial('${supplier.id}', '${materialCode}')">
                                Talep Et
                            </button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            }
            
            // Loading gizle, sonuçları göster
            document.getElementById('supplier-loading').style.display = 'none';
            document.getElementById('supplier-results').style.display = 'block';
        } catch (error) {
            console.error("Tedarikçi arama hatası:", error);
            
            // Loading gizle, sonuçları göster
            document.getElementById('supplier-loading').style.display = 'none';
            document.getElementById('supplier-results').style.display = 'block';
            
            // Hata mesajı göster
            const tableBody = document.getElementById('suppliers-for-material-body');
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Hata: ${error.message}</td></tr>`;
        }
    }

    // Demo tedarikçi verileri
    function getExampleSuppliers() {
        return [
            {
                id: 's1',
                code: 'SUP001',
                name: 'Elektrik Malzemeleri A.Ş.',
                categoryId: 'c1',
                contactPerson: 'Ahmet Yılmaz',
                email: 'info@elektrikmalzemeleri.com',
                phone: '+90 212 123 4567',
                address: 'İstanbul, Türkiye',
                suppliedMaterials: [
                    { materialCode: 'EM001', description: 'Orta Gerilim Devre Kesici', lastPrice: 12500 },
                    { materialCode: 'EM002', description: 'Koruma Rölesi', lastPrice: 5600 }
                ]
            },
            {
                id: 's2',
                code: 'SUP002',
                name: 'Mekanik Parçalar Ltd.',
                categoryId: 'c2',
                contactPerson: 'Mehmet Kaya',
                email: 'info@mekanikparcalar.com',
                phone: '+90 216 765 4321',
                address: 'Ankara, Türkiye',
                suppliedMaterials: [
                    { materialCode: 'MP001', description: 'Metal Kasalar', lastPrice: 3800 },
                    { materialCode: 'MP002', description: 'Bağlantı Elemanları', lastPrice: 450 }
                ]
            },
            {
                id: 's3',
                code: 'SUP003',
                name: 'Kablo Sistemleri',
                categoryId: 'c3',
                contactPerson: 'Ayşe Demir',
                email: 'info@kablosistemleri.com',
                phone: '+90 232 345 6789',
                address: 'İzmir, Türkiye',
                suppliedMaterials: [
                    { materialCode: 'KS001', description: 'Güç Kabloları', lastPrice: 750 },
                    { materialCode: 'KS002', description: 'Kontrol Kabloları', lastPrice: 420 }
                ]
            }
        ];
    }

    // Public API
    return {
        loadSuppliers,
        loadSupplierCategories,
        loadMissingMaterials,
        loadSupplierRatings,
        createSupplier,
        updateSupplier,
        rateSupplier,
        findSuppliersForMaterial,
        sendPurchaseRequest,
        renderSuppliersTable,
        renderOrderQueue,
        showOrderMaterials,
        findSupplierForMaterial,
        
        // Kullanıcı arayüzü fonksiyonları
        showSupplierDetail: function(supplierId) {
            console.log(`Tedarikçi detayı gösteriliyor: ${supplierId}`);
            // Modal gösterme kodu buraya gelecek
        },
        
        showRequestForm: function(supplierId) {
            console.log(`Satın alma talebi formu gösteriliyor: ${supplierId}`);
            // Modal gösterme kodu buraya gelecek
        },
        
        showRatingForm: function(supplierId) {
            console.log(`Değerlendirme formu gösteriliyor: ${supplierId}`);
            // Modal gösterme kodu buraya gelecek
        },
        
        requestMaterial: function(supplierId, materialCode) {
            console.log(`Malzeme talep ediliyor. Tedarikçi: ${supplierId}, Malzeme: ${materialCode}`);
            // Talep işlemi kodu buraya gelecek
        },
        
        requestAllMaterials: function(orderId) {
            console.log(`Tüm malzemeler talep ediliyor. Sipariş: ${orderId}`);
            // Toplu talep işlemi kodu buraya gelecek
        },
        
        // Uygulama başlangıcında çağrılacak
        initialize: async function() {
            try {
                // Initial data loading
                await Promise.all([
                    loadSuppliers(),
                    loadSupplierCategories(),
                    loadMissingMaterials(),
                    loadSupplierRatings()
                ]);
                
                // Listen for updates
                EventBus.subscribe('suppliers.updated', async () => {
                    await loadSuppliers();
                });
                
                EventBus.subscribe('materials.updated', async () => {
                    await loadMissingMaterials();
                });
                
                console.log("Supplier management module initialized");
                return true;
            } catch (error) {
                console.error("Supplier management initialization error:", error);
                return false;
            }
        }
    };
})();

// Modülü başlat
document.addEventListener('DOMContentLoaded', function() {
    window.SupplierManagementModule.initialize()
        .then(() => console.log("Tedarikçi yönetimi modülü başlatıldı"))
        .catch(err => console.error("Tedarikçi yönetimi modülü başlatılamadı:", err));
});