/**
 * Mock Firebase
 * Gerçek Firebase olmadığında demo verileri sağlar
 */

// Mock Firebase sınıfı
class MockFirebase {
    constructor() {
        this.users = [
            { id: 'user1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', role: 'Yönetici' },
            { id: 'user2', name: 'Mehmet Demir', email: 'mehmet@example.com', role: 'Kullanıcı' },
            { id: 'user3', name: 'Ayşe Kaya', email: 'ayse@example.com', role: 'Kullanıcı' }
        ];
        
        this.orders = [
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
        ];
        
        this.materials = [
            {
                id: '137998%',
                name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC',
                stock: 2,
                minStock: 5,
                supplyTime: '15 gün',
                lastOrder: '2024-10-10',
                status: 'Kritik'
            },
            {
                id: '144866%',
                name: 'KAP-80/190-95 Akım Trafosu',
                stock: 3,
                minStock: 5,
                supplyTime: '10 gün',
                lastOrder: '2024-10-15',
                status: 'Düşük'
            }
        ];
        
        console.log('Mock Firebase nesnesi oluşturuldu');
    }
    
    // Auth metotları
    signIn(email, password) {
        console.log('Mock giriş yapılıyor', email);
        
        const user = this.users.find(u => u.email === email);
        if (user) {
            return { success: true, user };
        }
        
        return { success: false, error: 'Kullanıcı bulunamadı' };
    }
    
    signOut() {
        console.log('Mock çıkış yapılıyor');
        return { success: true };
    }
    
    // Firestore metotları
    getOrders() {
        console.log('Mock siparişler getiriliyor');
        return Promise.resolve(this.orders);
    }
    
    getOrderById(id) {
        console.log('Mock sipariş getiriliyor', id);
        const order = this.orders.find(o => o.id === id);
        return Promise.resolve(order || null);
    }
    
    addOrder(order) {
        console.log('Mock sipariş ekleniyor', order);
        this.orders.push(order);
        return Promise.resolve({ success: true, id: order.id });
    }
    
    getMaterials() {
        console.log('Mock malzemeler getiriliyor');
        return Promise.resolve(this.materials);
    }
}

// Global nesne olarak ekle
window.mockFirebase = new MockFirebase();

console.log('Mock Firebase modülü başarıyla yüklendi');