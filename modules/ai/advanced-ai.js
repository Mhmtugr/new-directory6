/**
 * Üretim verilerini zaman çerçevesine göre filtrele
 * @param {Array} production - Üretim listesi
 * @param {string} timeframe - Zaman çerçevesi
 * @returns {Array} Filtrelenmiş üretim verileri
 */
function filterProductionByTimeframe(production, timeframe) {
    const now = new Date();
    
    switch (timeframe) {
        case 'day':
            return production.filter(p => {
                if (!p.startDate && !p.endDate) return false;
                
                const startDate = p.startDate ? new Date(p.startDate?.toDate ? p.startDate.toDate() : p.startDate) : null;
                const endDate = p.endDate ? new Date(p.endDate?.toDate ? p.endDate.toDate() : p.endDate) : null;
                
                return (startDate && startDate.toDateString() === now.toDateString()) || 
                       (endDate && endDate.toDateString() === now.toDateString()) ||
                       (startDate && endDate && startDate <= now && endDate >= now);
            });
            
        case 'week':
            const oneWeekLater = new Date(now);
            oneWeekLater.setDate(now.getDate() + 7);
            
            return production.filter(p => {
                if (!p.startDate && !p.endDate) return false;
                
                const startDate = p.startDate ? new Date(p.startDate?.toDate ? p.startDate.toDate() : p.startDate) : null;
                const endDate = p.endDate ? new Date(p.endDate?.toDate ? p.endDate.toDate() : p.endDate) : null;
                
                return (startDate && startDate >= now && startDate <= oneWeekLater) || 
                       (endDate && endDate >= now && endDate <= oneWeekLater) ||
                       (startDate && endDate && startDate <= now && endDate >= oneWeekLater);
            });
            
        case 'month':
            const oneMonthLater = new Date(now);
            oneMonthLater.setMonth(now.getMonth() + 1);
            
            return production.filter(p => {
                if (!p.startDate && !p.endDate) return false;
                
                const startDate = p.startDate ? new Date(p.startDate?.toDate ? p.startDate.toDate() : p.startDate) : null;
                const endDate = p.endDate ? new Date(p.endDate?.toDate ? p.endDate.toDate() : p.endDate) : null;
                
                return (startDate && startDate >= now && startDate <= oneMonthLater) || 
                       (endDate && endDate >= now && endDate <= oneMonthLater) ||
                       (startDate && endDate && startDate <= now && endDate >= oneMonthLater);
            });
            
        default:
            return production;
    }
}

/**
 * Demo sipariş verileri
 * @returns {Array} Demo sipariş verileri
 */
function getDemoOrders() {
    // Tarihler
    const today = new Date();
    const past15Days = new Date(today);
    past15Days.setDate(today.getDate() - 15);
    
    const past30Days = new Date(today);
    past30Days.setDate(today.getDate() - 30);
    
    const future15Days = new Date(today);
    future15Days.setDate(today.getDate() + 15);
    
    const future30Days = new Date(today);
    future30Days.setDate(today.getDate() + 30);
    
    return [
        {
            id: 'order-1',
            orderNo: '24-03-A001',
            customer: 'AYEDAŞ',
            cellType: 'RM 36 LB',
            cellCount: 3,
            missingMaterials: 0,
            orderDate: past30Days,
            deliveryDate: future15Days,
            status: 'production',
            hasWarning: true
        },
        {
            id: 'order-2',
            orderNo: '24-03-B002',
            customer: 'BAŞKENT EDAŞ',
            cellType: 'RM 36 FL',
            cellCount: 5,
            missingMaterials: 2,
            orderDate: past30Days,
            deliveryDate: past15Days, // Gecikmiş teslimat
            status: 'waiting',
            hasMaterialIssue: true
        },
        {
            id: 'order-3',
            orderNo: '24-03-C003',
            customer: 'ENERJİSA',
            cellType: 'RM 36 CB',
            cellCount: 4,
            missingMaterials: 0,
            orderDate: past30Days,
            deliveryDate: future30Days,
            status: 'ready'
        },
        {
            id: 'order-4',
            orderNo: '24-04-D004',
            customer: 'TOROSLAR EDAŞ',
            cellType: 'RM 36 LB',
            cellCount: 8,
            missingMaterials: 0,
            orderDate: past15Days,
            deliveryDate: future30Days,
            status: 'planning'
        },
        {
            id: 'order-5',
            orderNo: '24-04-E005',
            customer: 'AYEDAŞ',
            cellType: 'RM 36 CB',
            cellCount: 6,
            missingMaterials: 0,
            orderDate: past15Days,
            deliveryDate: future30Days,
            status: 'planning'
        }
    ];
}

/**
 * Demo malzeme verileri
 * @returns {Array} Demo malzeme verileri
 */
function getDemoMaterials() {
    // Tarihler
    const today = new Date();
    const future7Days = new Date(today);
    future7Days.setDate(today.getDate() + 7);
    
    const future14Days = new Date(today);
    future14Days.setDate(today.getDate() + 14);
    
    const future2Days = new Date(today);
    future2Days.setDate(today.getDate() + 2);
    
    const past2Days = new Date(today);
    past2Days.setDate(today.getDate() - 2);
    
    return [
        {
            id: 'material-1',
            name: 'Koruma Rölesi',
            code: 'Siemens 7SR1003-1JA20-2DA0+ZY20',
            stock: 5,
            minStock: 2,
            supplier: 'Siemens',
            inStock: true
        },
        {
            id: 'material-2',
            name: 'Kesici',
            code: 'ESİTAŞ KAP-80/190-115',
            stock: 3,
            minStock: 1,
            supplier: 'Esitaş',
            inStock: true
        },
        {
            id: 'material-3',
            name: 'Kablo Başlıkları',
            code: 'M480TB/G-027-95.300UN5',
            stock: 0,
            minStock: 5,
            supplier: 'Euromold',
            inStock: false,
            orderNo: '24-03-B002',
            orderId: 'order-2',
            expectedSupplyDate: future7Days,
            orderNeedDate: past2Days // Kritik gecikme: Tedarik tarihi ihtiyaç tarihinden sonra
        },
        {
            id: 'material-4',
            name: 'Gerilim Gösterge',
            code: 'OVI+S (10nf)',
            stock: 0,
            minStock: 3,
            supplier: 'Elektra',
            inStock: false,
            orderNo: '24-03-B002',
            orderId: 'order-2',
            expectedSupplyDate: future2Days,
            orderNeedDate: future7Days
        },
        {
            id: 'material-5',
            name: 'Ayırıcı Motor',
            code: 'M: 24 VDC B: 24 VDC',
            stock: 10,
            minStock: 4,
            supplier: 'Siemens',
            inStock: true
        }
    ];
}

/**
 * Demo üretim verileri
 * @returns {Array} Demo üretim verileri
 */
function getDemoProduction() {
    // Tarihler
    const today = new Date();
    const past7Days = new Date(today);
    past7Days.setDate(today.getDate() - 7);
    
    const past14Days = new Date(today);
    past14Days.setDate(today.getDate() - 14);
    
    const future7Days = new Date(today);
    future7Days.setDate(today.getDate() + 7);
    
    const future14Days = new Date(today);
    future14Days.setDate(today.getDate() + 14);
    
    const future21Days = new Date(today);
    future21Days.setDate(today.getDate() + 21);
    
    return [
        {
            id: 'production-1',
            orderNo: '24-03-A001',
            orderId: 'order-1',
            startDate: past7Days,
            endDate: future7Days,
            status: 'active',
            progress: 60,
            isDelayed: false,
            stages: [
                {
                    name: 'Malzeme Hazırlık',
                    status: 'completed',
                    startDate: past7Days,
                    endDate: past7Days
                },
                {
                    name: 'Kablo Montajı',
                    status: 'completed',
                    startDate: past7Days,
                    endDate: today
                },
                {
                    name: 'Panel Montajı',
                    status: 'active',
                    startDate: today,
                    endDate: future7Days
                },
                {
                    name: 'Test',
                    status: 'waiting',
                    startDate: future7Days,
                    endDate: future7Days
                }
            ]
        },
        {
            id: 'production-2',
            orderNo: '24-03-B002',
            orderId: 'order-2',
            startDate: past14Days,
            endDate: past7Days, // Bitiş tarihi geçmiş
            status: 'active',
            progress: 45,
            isDelayed: true, // Gecikmeli üretim
            delayReason: 'Malzeme tedarik gecikmesi',
            stages: [
                {
                    name: 'Malzeme Hazırlık',
                    status: 'delayed',
                    startDate: past14Days,
                    endDate: past7Days
                },
                {
                    name: 'Kablo Montajı',
                    status: 'active',
                    startDate: past7Days,
                    endDate: today
                },
                {
                    name: 'Panel Montajı',
                    status: 'waiting',
                    startDate: null,
                    endDate: null
                },
                {
                    name: 'Test',
                    status: 'waiting',
                    startDate: null,
                    endDate: null
                }
            ]
        },
        {
            id: 'production-3',
            orderNo: '24-03-C003',
            orderId: 'order-3',
            startDate: future7Days,
            endDate: future21Days,
            status: 'waiting',
            progress: 0,
            isDelayed: false
        }
    ];
}

/**
 * Demo müşteri verileri
 * @returns {Array} Demo müşteri verileri
 */
function getDemoCustomers() {
    return [
        {
            id: 'customer-1',
            name: 'AYEDAŞ',
            contact: 'Ahmet Yılmaz',
            email: 'ahmet@ayedas.com.tr',
            phone: '0212 555 11 22'
        },
        {
            id: 'customer-2',
            name: 'ENERJİSA',
            contact: 'Mehmet Kaya',
            email: 'mehmet@enerjisa.com.tr',
            phone: '0216 333 44 55'
        },
        {
            id: 'customer-3',
            name: 'BAŞKENT EDAŞ',
            contact: 'Ayşe Demir',
            email: 'ayse@baskentedas.com.tr',
            phone: '0312 444 77 88'
        },
        {
            id: 'customer-4',
            name: 'TOROSLAR EDAŞ',
            contact: 'Fatma Şahin',
            email: 'fatma@toroslar.com.tr',
            phone: '0322 666 99 00'
        }
    ];
}

// Ana işlevleri dışa aktar
window.initAIAssistant = initAIAssistant;
window.toggleAIAssistant = toggleAIAssistant;
window.sendAIQuery = sendAIQuery;
window.refreshAssistantDataCache = refreshAssistantDataCache;

// Sayfa yüklendiğinde asistanı başlat
document.addEventListener('DOMContentLoaded', function() {
    // Asistanı başlat
    if (typeof initAIAssistant === 'function') {
        setTimeout(() => {
            initAIAssistant();
        }, 1000);
    }
});

// Orijinal chatbot fonksiyonunu geçersiz kıl
window.sendChatMessage = sendAIQuery;

/**
 * advanced-ai.js
 * Gelişmiş Yapay Zeka ve NLP destekli asistan işlevleri
 */

// AI Asistanı için global durum değişkenleri
const aiAssistantState = {
    isProcessing: false,
    lastQuery: null,
    context: {},
    conversation: [],
    dataCache: {
        orders: null,
        materials: null,
        production: null,
        customers: null
    },
    lastUpdate: null
};

/**
 * Chatbot'u başlat ve gerekli verileri yükle
 */
function initAIAssistant() {
    console.log("Yapay Zeka Asistanı başlatılıyor...");
    
    // Chatbot arayüzünü iyileştir
    enhanceChatbotUI();
    
    // İlk veri önbelleğini oluştur
    refreshAssistantDataCache();
    
    // Chatbot penceresini göster/gizle olayını bağla
    const chatbotTrigger = document.querySelector('.chatbot-trigger');
    if (chatbotTrigger) {
        chatbotTrigger.addEventListener('click', toggleAIAssistant);
    }
    
    // Chatbot mesaj gönderme olayını bağla
    const chatbotSend = document.querySelector('.chatbot-send');
    if (chatbotSend) {
        chatbotSend.addEventListener('click', sendAIQuery);
    }
    
    // Enter tuşu ile mesaj gönderme
    const chatbotInput = document.getElementById('chatbot-input');
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendAIQuery();
            }
        });
    }
    
    // Chatbot penceresini kapatma olayını bağla
    const chatbotClose = document.querySelector('.chatbot-close');
    if (chatbotClose) {
        chatbotClose.addEventListener('click', toggleAIAssistant);
    }
    
    // Karşılama mesajını göster
    setTimeout(() => {
        displayWelcomeMessage();
    }, 500);
    
    // Veri değişikliklerini dinle
    listenToDataChanges();
    
    console.log("Yapay Zeka Asistanı başlatıldı");
}

/**
 * Chatbot arayüzünü iyileştir ve bilgi göstergesi ekle
 */
function enhanceChatbotUI() {
    // Chatbot penceresine bilgi göstergesi ekle
    const chatbotWindow = document.getElementById('chatbot-window');
    if (!chatbotWindow) return;
    
    // AI Yeteneği göstergesi
    const aiCapabilityBadge = document.createElement('div');
    aiCapabilityBadge.className = 'ai-capability-badge';
    aiCapabilityBadge.style.position = 'absolute';
    aiCapabilityBadge.style.top = '10px';
    aiCapabilityBadge.style.right = '40px';
    aiCapabilityBadge.style.backgroundColor = '#1e40af';
    aiCapabilityBadge.style.color = 'white';
    aiCapabilityBadge.style.fontSize = '10px';
    aiCapabilityBadge.style.padding = '2px 6px';
    aiCapabilityBadge.style.borderRadius = '10px';
    aiCapabilityBadge.textContent = 'Yapay Zeka';
    
    const chatbotHeader = chatbotWindow.querySelector('.chatbot-header');
    if (chatbotHeader) {
        chatbotHeader.style.position = 'relative';
        chatbotHeader.appendChild(aiCapabilityBadge);
        
        // Asistan başlığını güncelle
        const chatbotTitle = chatbotHeader.querySelector('.chatbot-title span');
        if (chatbotTitle) {
            chatbotTitle.textContent = 'Akıllı Asistan';
        }
    }
    
    // Öneri kümeleri ekleyin
    const chatbotBody = document.getElementById('chatbot-body');
    if (chatbotBody) {
        chatbotBody.style.paddingBottom = '65px'; // Öneriler için yer açın
    }
    
    // Öneriler bölümü
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'ai-suggestions';
    suggestionsContainer.style.position = 'absolute';
    suggestionsContainer.style.bottom = '65px';
    suggestionsContainer.style.left = '0';
    suggestionsContainer.style.right = '0';
    suggestionsContainer.style.padding = '10px 15px';
    suggestionsContainer.style.backgroundColor = '#f8fafc';
    suggestionsContainer.style.borderTop = '1px solid #e2e8f0';
    suggestionsContainer.style.display = 'flex';
    suggestionsContainer.style.flexWrap = 'wrap';
    suggestionsContainer.style.gap = '8px';
    suggestionsContainer.style.overflowX = 'auto';
    suggestionsContainer.style.whiteSpace = 'nowrap';
    suggestionsContainer.style.maxHeight = '60px';
    
    // Örnek öneriler
    const suggestions = [
        'Aktif siparişler',
        'Malzeme durumu',
        'Geciken işler',
        'Üretim planı',
        'Aylık rapor'
    ];
    
    suggestions.forEach(suggestion => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip';
        chip.textContent = suggestion;
        chip.style.backgroundColor = '#e2e8f0';
        chip.style.color = '#1e40af';
        chip.style.border = 'none';
        chip.style.borderRadius = '16px';
        chip.style.padding = '6px 12px';
        chip.style.fontSize = '12px';
        chip.style.cursor = 'pointer';
        chip.style.whiteSpace = 'nowrap';
        
        chip.addEventListener('click', () => {
            document.getElementById('chatbot-input').value = suggestion;
            sendAIQuery();
        });
        
        suggestionsContainer.appendChild(chip);
    });
    
    chatbotWindow.appendChild(suggestionsContainer);
    
    // Giriş metni alanını genişletin ve içeriğine göre büyüyüp küçülmesini sağlayın
    const chatbotInput = document.getElementById('chatbot-input');
    if (chatbotInput) {
        chatbotInput.style.minHeight = '24px';
        chatbotInput.style.maxHeight = '80px';
        chatbotInput.style.resize = 'none';
        chatbotInput.placeholder = 'Sipariş durumu, üretim planı, malzeme vb. sorgulayın...';
        
        // Metin alanını bir textarea'ya dönüştürün
        const textarea = document.createElement('textarea');
        textarea.id = 'chatbot-input';
        textarea.className = 'chatbot-input';
        textarea.placeholder = 'Sipariş durumu, üretim planı, malzeme vb. sorgulayın...';
        textarea.style.flex = '1';
        textarea.style.minHeight = '24px';
        textarea.style.maxHeight = '80px';
        textarea.style.resize = 'none';
        textarea.style.padding = '0.75rem 1rem';
        textarea.style.border = '1px solid var(--border)';
        textarea.style.borderRadius = '0.375rem';
        textarea.style.fontSize = '0.875rem';
        textarea.style.overflow = 'auto';
        
        // Otomatik boyutlandırma için olay dinleyicisi
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(80, this.scrollHeight) + 'px';
        });
        
        // Enter ile gönderme (Shift+Enter ile yeni satır)
        textarea.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIQuery();
            }
        });
        
        // Eski input alanını değiştirin
        chatbotInput.parentNode.replaceChild(textarea, chatbotInput);
    }
}

/**
 * Hoş geldin mesajını göster
 */
function displayWelcomeMessage() {
    const chatBody = document.getElementById('chatbot-body');
    if (!chatBody) return;
    
    // Eski mesajları temizle
    chatBody.innerHTML = '';
    
    // Karşılama mesajı
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'chat-message bot';
    welcomeMessage.innerHTML = `
        <p>Merhaba! Ben ElektroTrack'in yapay zeka destekli asistanıyım. Size şu konularda yardımcı olabilirim:</p>
        <ul style="margin-top: 8px; margin-left: 20px; list-style-type: disc;">
            <li>Sipariş durumları ve detayları</li>
            <li>Malzeme tedarik takibi</li>
            <li>Üretim planlaması ve gecikme riskleri</li>
            <li>Raporlama ve analizler</li>
            <li>Optimizasyon önerileri</li>
        </ul>
        <p style="margin-top: 8px;">Sorularınızı doğal dilde sorabilirsiniz. Örneğin: <em>"24-03-B002 siparişinin durumu nedir?"</em> veya <em>"Bu ay teslim edilecek siparişler hangileri?"</em></p>
    `;
    
    chatBody.appendChild(welcomeMessage);
    
    // Örnek önerileri güncelle
    updateSuggestions([
        'Aktif siparişler neler?',
        'Malzeme eksikleri',
        'Geciken işler hangileri?',
        'Bu ay teslim edilecekler',
        'Üretim optimizasyonu'
    ]);
}

/**
 * Öneri çiplerini güncelle
 * @param {Array} suggestions - Öneri metinleri dizisi
 */
function updateSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('ai-suggestions');
    if (!suggestionsContainer) return;
    
    // Mevcut önerileri temizle
    suggestionsContainer.innerHTML = '';
    
    // Yeni önerileri ekle
    suggestions.forEach(suggestion => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip';
        chip.textContent = suggestion;
        chip.style.backgroundColor = '#e2e8f0';
        chip.style.color = '#1e40af';
        chip.style.border = 'none';
        chip.style.borderRadius = '16px';
        chip.style.padding = '6px 12px';
        chip.style.fontSize = '12px';
        chip.style.cursor = 'pointer';
        chip.style.whiteSpace = 'nowrap';
        
        chip.addEventListener('click', () => {
            document.getElementById('chatbot-input').value = suggestion;
            sendAIQuery();
        });
        
        suggestionsContainer.appendChild(chip);
    });
}

/**
 * Veri değişikliklerini dinle
 */
function listenToDataChanges() {
    // Sayfa değişikliği olayını dinle
    document.addEventListener('pageChanged', function(event) {
        // Veri önbelleğini yenile
        refreshAssistantDataCache();
    });
    
    // Dashboard verilerini güncelleme olayını dinle
    document.addEventListener('dashboardDataUpdated', function(event) {
        refreshAssistantDataCache();
    });
    
    // Sipariş verisi değişikliği olayını dinle
    document.addEventListener('orderDataChanged', function(event) {
        // Sipariş verilerini yenile
        loadOrdersData().then(orders => {
            aiAssistantState.dataCache.orders = orders;
        });
    });
    
    // Malzeme verisi değişikliği olayını dinle
    document.addEventListener('materialsDataChanged', function(event) {
        // Malzeme verilerini yenile
        loadMaterialsData().then(materials => {
            aiAssistantState.dataCache.materials = materials;
        });
    });
}

/**
 * AI Asistanı için tüm veri önbelleğini yenile
 */
async function refreshAssistantDataCache() {
    console.log("AI Asistanı veri önbelleği yenileniyor...");
    
    try {
        // Paralel veri yükleme
        const [orders, materials, production, customers] = await Promise.all([
            loadOrdersData(),
            loadMaterialsData(),
            loadProductionData(),
            loadCustomersData()
        ]);
        
        // Verileri önbelleğe kaydet
        aiAssistantState.dataCache = {
            orders,
            materials,
            production,
            customers
        };
        
        // Son güncelleme zamanını kaydet
        aiAssistantState.lastUpdate = new Date();
        
        console.log("AI Asistanı veri önbelleği güncellendi:", 
            orders?.length || 0, "sipariş,", 
            materials?.length || 0, "malzeme");
            
        // Veri güncellendiğini bildir
        document.dispatchEvent(new CustomEvent('aiDataCacheUpdated'));
        
        return aiAssistantState.dataCache;
    } catch (error) {
        console.error("AI Asistanı veri önbelleği yenilenemedi:", error);
        return null;
    }
}

/**
 * Sipariş verilerini yükle
 * @returns {Promise<Array>} Sipariş verileri
 */
async function loadOrdersData() {
    try {
        // Firebase Firestore varsa
        if (firebase && firebase.firestore) {
            const ordersRef = firebase.firestore().collection('orders');
            const snapshot = await ordersRef.get();
            
            if (snapshot.empty) {
                return getDemoOrders();
            }
            
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return orders;
        } else {
            // Firebase yoksa demo verilerini kullan
            return getDemoOrders();
        }
    } catch (error) {
        console.error("Sipariş verileri yüklenemedi:", error);
        return getDemoOrders();
    }
}

/**
 * Malzeme verilerini yükle
 * @returns {Promise<Array>} Malzeme verileri
 */
async function loadMaterialsData() {
    try {
        // Firebase Firestore varsa
        if (firebase && firebase.firestore) {
            const materialsRef = firebase.firestore().collection('materials');
            const snapshot = await materialsRef.get();
            
            if (snapshot.empty) {
                return getDemoMaterials();
            }
            
            const materials = [];
            snapshot.forEach(doc => {
                materials.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return materials;
        } else {
            // Firebase yoksa demo verilerini kullan
            return getDemoMaterials();
        }
    } catch (error) {
        console.error("Malzeme verileri yüklenemedi:", error);
        return getDemoMaterials();
    }
}

/**
 * Üretim verilerini yükle
 * @returns {Promise<Object>} Üretim verileri
 */
async function loadProductionData() {
    try {
        // Firebase Firestore varsa
        if (firebase && firebase.firestore) {
            const productionRef = firebase.firestore().collection('production');
            const snapshot = await productionRef.get();
            
            if (snapshot.empty) {
                return getDemoProduction();
            }
            
            const production = [];
            snapshot.forEach(doc => {
                production.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return production;
        } else {
            // Firebase yoksa demo verilerini kullan
            return getDemoProduction();
        }
    } catch (error) {
        console.error("Üretim verileri yüklenemedi:", error);
        return getDemoProduction();
    }
}

/**
 * Müşteri verilerini yükle
 * @returns {Promise<Array>} Müşteri verileri
 */
async function loadCustomersData() {
    try {
        // Firebase Firestore varsa
        if (firebase && firebase.firestore) {
            const customersRef = firebase.firestore().collection('customers');
            const snapshot = await customersRef.get();
            
            if (snapshot.empty) {
                return getDemoCustomers();
            }
            
            const customers = [];
            snapshot.forEach(doc => {
                customers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return customers;
        } else {
            // Firebase yoksa demo verilerini kullan
            return getDemoCustomers();
        }
    } catch (error) {
        console.error("Müşteri verileri yüklenemedi:", error);
        return getDemoCustomers();
    }
}

/**
 * AI Asistanı penceresini göster/gizle
 */
function toggleAIAssistant() {
    const chatbotWindow = document.getElementById('chatbot-window');
    if (chatbotWindow) {
        // Şu anki durumunu tersine çevir
        const isVisible = chatbotWindow.style.display === 'flex';
        
        if (isVisible) {
            // Chatbot penceresini gizle
            chatbotWindow.style.display = 'none';
        } else {
            // Chatbot penceresini göster
            chatbotWindow.style.display = 'flex';
            
            // Veri önbelleğini yenile (gerekliyse)
            if (!aiAssistantState.lastUpdate || 
                (new Date() - aiAssistantState.lastUpdate) > 5 * 60 * 1000) { // 5 dakikadan eski ise
                refreshAssistantDataCache();
            }
            
            // Input alanına odaklan
            document.getElementById('chatbot-input')?.focus();
        }
    }
}

/**
 * AI asistanına sorgu gönder
 */
async function sendAIQuery() {
    const chatInput = document.getElementById('chatbot-input');
    if (!chatInput) return;
    
    const query = chatInput.value.trim();
    if (!query) return;
    
    // İşlem durumunu güncelle
    aiAssistantState.isProcessing = true;
    aiAssistantState.lastQuery = query;
    
    // Kullanıcı mesajını ekle
    const chatBody = document.getElementById('chatbot-body');
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'chat-message user';
    userMessageElement.textContent = query;
    chatBody.appendChild(userMessageElement);
    
    // Input alanını temizle
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Scroll down
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Yükleniyor mesajı göster
    const loadingElement = document.createElement('div');
    loadingElement.className = 'chat-message bot';
    loadingElement.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatBody.appendChild(loadingElement);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    try {
        // Sorgu işleme
        const response = await processAIQuery(query);
        
        // Yükleniyor mesajını kaldır
        chatBody.removeChild(loadingElement);
        
        // Yanıtı ekle
        const botMessageElement = document.createElement('div');
        botMessageElement.className = 'chat-message bot';
        
        // HTML içeriği varsa doğrudan yerleştir, yoksa metin olarak ekle
        if (response.includes('<') && response.includes('>')) {
            botMessageElement.innerHTML = response;
        } else {
            botMessageElement.textContent = response;
        }
        
        chatBody.appendChild(botMessageElement);
        
        // Konuşmaya ekle
        aiAssistantState.conversation.push({
            role: 'user',
            content: query
        }, {
            role: 'assistant',
            content: response
        });
        
        // Önerileri güncelle
        updateSuggestionsBasedOnQuery(query);
    } catch (error) {
        console.error("AI sorgu işleme hatası:", error);
        
        // Yükleniyor mesajını kaldır
        chatBody.removeChild(loadingElement);
        
        // Hata mesajı ekle
        const errorElement = document.createElement('div');
        errorElement.className = 'chat-message bot';
        errorElement.textContent = 'Üzgünüm, sorunuzu işlerken bir hata oluştu. Lütfen tekrar deneyin.';
        chatBody.appendChild(errorElement);
    } finally {
        // İşlem durumunu güncelle
        aiAssistantState.isProcessing = false;
        
        // Scroll down
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

/**
 * AI sorgusunu işle ve yanıt oluştur
 * @param {string} query - Kullanıcı sorgusu
 * @returns {Promise<string>} AI yanıtı
 */
async function processAIQuery(query) {
    console.log("İşleniyor:", query);
    
    // Veri önbelleği dolu mu kontrol et
    if (!aiAssistantState.dataCache.orders || 
        !aiAssistantState.dataCache.materials) {
        await refreshAssistantDataCache();
    }
    
    // Sorgu anahtar kelimeleri ve konusu analizi
    const queryInfo = analyzeQuery(query);
    console.log("Sorgu analizi:", queryInfo);
    
    // Yanıt oluştur
    let response = '';
    
    switch (queryInfo.topic) {
        case 'order':
            response = await generateOrderResponse(query, queryInfo);
            break;
        case 'material':
            response = await generateMaterialResponse(query, queryInfo);
            break;
        case 'production':
            response = await generateProductionResponse(query, queryInfo);
            break;
        case 'report':
            response = await generateReportResponse(query, queryInfo);
            break;
        case 'optimization':
            response = await generateOptimizationResponse(query, queryInfo);
            break;
        case 'general':
        default:
            response = await generateGeneralResponse(query, queryInfo);
    }
    
    // Demo sistemlerde işleme gecikmesi simülasyonu (500-1500ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return response;
}

/**
 * Gelişmiş Yapay Zeka Modülü
 * Sistemdeki ileri düzey AI özelliklerini sağlar
 */

// Logger oluştur
const log = window.logger ? window.logger('AdvancedAI') : console;

// AI asistanı sınıfı
class AIAssistant {
    constructor() {
        this.config = window.appConfig?.ai || {};
        this.initialized = false;
        this.context = [];
        
        this.init();
    }
    
    init() {
        log.info('Gelişmiş AI Asistanı başlatılıyor...');
        this.initialized = true;
    }
    
    async processQuery(query, context = {}) {
        if (!this.initialized) {
            log.warn('AI Asistanı henüz başlatılmadı');
            return { error: 'AI Asistanı henüz başlatılmadı' };
        }
        
        try {
            log.info('Sorgu işleniyor:', query);
            
            // Demo yanıt oluştur
            return await this.generateDemoResponse(query, context);
        } catch (error) {
            log.error('Sorgu işlenirken hata oluştu', error);
            return { error: 'Sorgu işlenirken bir hata oluştu' };
        }
    }
    
    async generateDemoResponse(query, context) {
        // Demo yanıtlar için gecikme ekle
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const lowerQuery = query.toLowerCase();
        
        // Sorgu tipine göre yanıt
        if (lowerQuery.includes('merhaba') || lowerQuery.includes('selam')) {
            return { 
                type: 'text',
                content: 'Merhaba! Size nasıl yardımcı olabilirim?',
                confidence: 0.95
            };
        } 
        else if (lowerQuery.includes('sipariş') && lowerQuery.includes('durum')) {
            return {
                type: 'orderStatus',
                content: 'Aktif siparişlerinizin durumu:',
                data: [
                    { id: '#0424-1251', customer: 'AYEDAŞ', status: 'Gecikiyor', progress: 65 },
                    { id: '#0424-1245', customer: 'TEİAŞ', status: 'Devam Ediyor', progress: 45 }
                ],
                confidence: 0.85
            };
        }
        else if (lowerQuery.includes('malzeme') && lowerQuery.includes('stok')) {
            return {
                type: 'materialStatus',
                content: 'Kritik stok durumunda olan malzemeler:',
                data: [
                    { code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', stock: 2, required: 8 },
                    { code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', stock: 3, required: 5 }
                ],
                confidence: 0.9
            };
        }
        else if (lowerQuery.includes('rm 36')) {
            return {
                type: 'technicalInfo',
                content: 'RM 36 hücre tipleri hakkında teknik bilgiler:',
                data: {
                    types: ['RM 36 CB', 'RM 36 LB', 'RM 36 FL'],
                    voltage: '36kV',
                    current: '630A-1250A',
                    shortCircuit: '16kA-25kA'
                },
                confidence: 0.85
            };
        }
        else {
            return {
                type: 'text',
                content: 'Üzgünüm, bu konuda henüz yeterli bilgim yok. Daha spesifik bir soru sorabilir misiniz?',
                confidence: 0.6
            };
        }
    }
    
    analyzeProduction(data) {
        log.info('Üretim verileri analiz ediliyor', data);
        
        // Demo analiz sonuçları
        const results = {
            insights: [
                'Son 30 günde üretim verimliliği %5 arttı',
                'Mekanik montaj aşamasında ortalama 2 gün gecikme var',
                'RM 36 CB tipi hücrelerde test süreçleri daha uzun sürüyor'
            ],
            recommendations: [
                'Mekanik montaj sürecinde ek personel görevlendirmesi yapılabilir',
                'Test süreçleri için standart prosedürler gözden geçirilebilir',
                'Tedarik zincirindeki gecikmeler için alternatif tedarikçiler değerlendirilebilir'
            ],
            riskAreas: [
                'Akım trafosu tedarikinde yaşanan gecikmeler',
                'RM 36 LB montaj sürecinde kalite sorunları'
            ]
        };
        
        return results;
    }
    
    predictMaterialNeeds(orders, inventory) {
        log.info('Malzeme ihtiyaçları tahmin ediliyor');
        
        // Demo tahmin sonuçları
        const predictions = {
            materials: [
                { code: '137998%', name: 'Siemens Röle', currentStock: 2, predicted: 10, confidence: 0.9 },
                { code: '144866%', name: 'Akım Trafosu', currentStock: 3, predicted: 8, confidence: 0.85 },
                { code: '120170%', name: 'Kablo Başlığı', currentStock: 12, predicted: 15, confidence: 0.75 }
            ],
            timeframe: '30 gün',
            totalCost: 450000
        };
        
        return predictions;
    }
}

// Global olarak advanced AI'yı ata
window.advancedAI = new AIAssistant();

log.info('Gelişmiş AI modülü başarıyla yüklendi');