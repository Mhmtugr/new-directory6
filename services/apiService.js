// Mock veri
const mockOrders = [
    {
        id: '1',
        orderNumber: 'ORD-001',
        customer: 'Müşteri A',
        product: 'Hücre Tipi 1',
        quantity: 100,
        status: 'Planlandı'
    },
    {
        id: '2',
        orderNumber: 'ORD-002',
        customer: 'Müşteri B',
        product: 'Hücre Tipi 2',
        quantity: 200,
        status: 'Devam Ediyor'
    }
];

const mockProductionData = {
    progress: 65,
    activeOrders: 3,
    completedOrders: 5,
    delayedOrders: 1,
    plan: [
        {
            orderNumber: 'ORD-001',
            customer: 'Müşteri A',
            product: 'Hücre Tipi 1',
            quantity: 100,
            startDate: '2024-03-01',
            endDate: '2024-03-15',
            status: 'Planlandı'
        }
    ],
    reports: [
        {
            date: '2024-03-01',
            efficiency: 85,
            target: 100,
            actual: 85,
            difference: -15
        }
    ]
};

class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API isteği başarısız:', error);
            throw error;
        }
    }

    // CRUD operasyonları
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Özel endpoint'ler
    async getOrders() {
        return this.get('/orders');
    }

    async getOrderDetails(orderId) {
        return this.get(`/orders/${orderId}`);
    }

    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }

    async updateOrder(orderId, orderData) {
        return this.put(`/orders/${orderId}`, orderData);
    }

    async deleteOrder(orderId) {
        return this.delete(`/orders/${orderId}`);
    }

    async getProductionData() {
        return this.get('/production');
    }

    async updateProductionStatus(statusData) {
        return this.put('/production/status', statusData);
    }

    async getInventory() {
        return this.get('/stock');
    }

    async updateInventory(itemId, quantity) {
        return this.put(`/stock/${itemId}`, { quantity });
    }
}

// API Service instance'ını oluştur ve export et
export const apiService = new ApiService(); 