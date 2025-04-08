/**
 * API Servisi
 */

// API Servisi sınıfı
class APIService {
    constructor() {
        this.config = window.appConfig || {};
        this.baseUrl = this.config.apiUrl || 'https://api.example.com';
        this.mockMode = this.config.useDemoMode || true;
        
        console.log('API Servisi başlatılıyor', { baseUrl: this.baseUrl, mockMode: this.mockMode });
    }
    
    async get(endpoint, params = {}) {
        if (this.mockMode) {
            return this.getMockData(endpoint, params);
        }
        
        try {
            const url = new URL(this.baseUrl + endpoint);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            return await response.json();
        } catch (error) {
            console.error(`GET ${endpoint} başarısız:`, error);
            throw error;
        }
    }
    
    async post(endpoint, data = {}) {
        if (this.mockMode) {
            return this.postMockData(endpoint, data);
        }
        
        try {
            const response = await fetch(this.baseUrl + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(data)
            });
            
            return await response.json();
        } catch (error) {
            console.error(`POST ${endpoint} başarısız:`, error);
            throw error;
        }
    }
    
    getAuthToken() {
        // Tarayıcı localStorage'dan token alma
        return localStorage.getItem('auth_token') || '';
    }
    
    // Mock veri metotları
    getMockData(endpoint, params) {
        console.log(`Mock GET: ${endpoint}`, params);
        
        // Endpoint'e göre demo veri döndür
        if (endpoint.includes('/orders')) {
            return Promise.resolve({
                orders: [
                    { 
                        id: '#0424-1251', 
                        customer: 'AYEDAŞ', 
                        cellType: 'RM 36 CB', 
                        quantity: 1, 
                        deliveryDate: '2024-11-15', 
                        status: 'Gecikiyor'
                    },
                    { 
                        id: '#0424-1245', 
                        customer: 'TEİAŞ', 
                        cellType: 'RM 36 CB', 
                        quantity: 1, 
                        deliveryDate: '2024-11-20', 
                        status: 'Devam Ediyor'
                    }
                ]
            });
        }
        
        if (endpoint.includes('/materials')) {
            return Promise.resolve({
                materials: [
                    {
                        code: '137998%',
                        name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC',
                        stock: 2,
                        minStock: 5,
                        status: 'Kritik'
                    },
                    {
                        code: '144866%',
                        name: 'KAP-80/190-95 Akım Trafosu',
                        stock: 3,
                        minStock: 5,
                        status: 'Düşük'
                    }
                ]
            });
        }
        
        return Promise.resolve({ message: 'Mock veri bulunamadı' });
    }
    
    postMockData(endpoint, data) {
        console.log(`Mock POST: ${endpoint}`, data);
        
        return Promise.resolve({ 
            success: true, 
            message: 'İşlem başarılı (mock)',
            id: `ORD-${Date.now()}` 
        });
    }
}

// Global olarak api-service'i ata
window.apiService = new APIService();

console.log('API Servisi başarıyla yüklendi');
