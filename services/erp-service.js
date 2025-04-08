/**
 * ERP Servisi
 * Canias ERP entegrasyonu için servis
 */

class ERPService {
    constructor() {
        this.apiUrl = window.appConfig?.apiUrl || 'https://api.example.com';
        this.mockMode = window.appConfig?.useDemoMode || true;
        this.initialized = false;
        
        this.init();
    }
    
    init() {
        console.log('ERP Servisi başlatılıyor...');
        this.initialized = true;
    }
    
    async getMaterials() {
        if (this.mockMode) {
            return this.getMockMaterials();
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/erp/materials`);
            return await response.json();
        } catch (error) {
            console.error('Malzeme verisi alınamadı:', error);
            return { error: 'Malzeme verisi alınamadı' };
        }
    }
    
    async getOrders() {
        if (this.mockMode) {
            return this.getMockOrders();
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/erp/orders`);
            return await response.json();
        } catch (error) {
            console.error('Sipariş verisi alınamadı:', error);
            return { error: 'Sipariş verisi alınamadı' };
        }
    }
    
    async getProductionStatus() {
        if (this.mockMode) {
            return this.getMockProductionStatus();
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/erp/production`);
            return await response.json();
        } catch (error) {
            console.error('Üretim durumu alınamadı:', error);
            return { error: 'Üretim durumu alınamadı' };
        }
    }
    
    // Mock veriler
    getMockMaterials() {
        return {
            materials: [
                {
                    code: '137998%',
                    name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC',
                    stock: 2,
                    minStock: 5,
                    supplyTime: '15 gün',
                    lastOrder: '2024-10-10',
                    status: 'Kritik'
                },
                {
                    code: '144866%',
                    name: 'KAP-80/190-95 Akım Trafosu',
                    stock: 3,
                    minStock: 5,
                    supplyTime: '10 gün',
                    lastOrder: '2024-10-15',
                    status: 'Düşük'
                },
                {
                    code: '120170%',
                    name: 'M480TB/G-027-95.300UN5 Kablo Başlığı',
                    stock: 12,
                    minStock: 15,
                    supplyTime: '7 gün',
                    lastOrder: '2024-10-20',
                    status: 'Düşük'
                },
                {
                    code: '109367%',
                    name: '582mm Bara',
                    stock: 25,
                    minStock: 10,
                    supplyTime: '5 gün',
                    lastOrder: '2024-10-05',
                    status: 'Yeterli'
                }
            ]
        };
    }
    
    getMockOrders() {
        return {
            orders: [
                { 
                    id: '#0424-1251', 
                    customer: 'AYEDAŞ', 
                    cellType: 'RM 36 CB', 
                    quantity: 1, 
                    deliveryDate: '2024-11-15', 
                    status: 'Gecikiyor', 
                    progress: 65,
                    priority: 'high'
                },
                { 
                    id: '#0424-1245', 
                    customer: 'TEİAŞ', 
                    cellType: 'RM 36 CB', 
                    quantity: 1, 
                    deliveryDate: '2024-11-20', 
                    status: 'Devam Ediyor', 
                    progress: 45,
                    priority: 'medium'
                },
                { 
                    id: '#0424-1239', 
                    customer: 'BEDAŞ', 
                    cellType: 'RM 36 LB', 
                    quantity: 1, 
                    deliveryDate: '2024-11-25', 
                    status: 'Devam Ediyor', 
                    progress: 30,
                    priority: 'normal'
                }
            ]
        };
    }
    
    getMockProductionStatus() {
        return {
            production: [
                {
                    orderId: '#0424-1251',
                    cellType: 'RM 36 CB',
                    status: [
                        { stage: 'Proje', status: 'completed', date: '2024-10-01' },
                        { stage: 'Elektrik Tasarım', status: 'completed', date: '2024-10-05' },
                        { stage: 'Mekanik Tasarım', status: 'completed', date: '2024-10-10' },
                        { stage: 'Satın Alma', status: 'completed', date: '2024-10-15' },
                        { stage: 'Mekanik Üretim', status: 'inProgress', date: '2024-10-20' },
                        { stage: 'İç Montaj', status: 'pending', date: null },
                        { stage: 'Kablaj', status: 'pending', date: null },
                        { stage: 'Genel Montaj', status: 'pending', date: null },
                        { stage: 'Test', status: 'pending', date: null }
                    ]
                },
                {
                    orderId: '#0424-1245',
                    cellType: 'RM 36 CB',
                    status: [
                        { stage: 'Proje', status: 'completed', date: '2024-10-05' },
                        { stage: 'Elektrik Tasarım', status: 'completed', date: '2024-10-10' },
                        { stage: 'Mekanik Tasarım', status: 'completed', date: '2024-10-15' },
                        { stage: 'Satın Alma', status: 'inProgress', date: '2024-10-20' },
                        { stage: 'Mekanik Üretim', status: 'pending', date: null },
                        { stage: 'İç Montaj', status: 'pending', date: null },
                        { stage: 'Kablaj', status: 'pending', date: null },
                        { stage: 'Genel Montaj', status: 'pending', date: null },
                        { stage: 'Test', status: 'pending', date: null }
                    ]
                }
            ]
        };
    }
}

// Global olarak erp-service'i ata
window.erpService = new ERPService();

console.log('ERP Servisi başarıyla yüklendi');