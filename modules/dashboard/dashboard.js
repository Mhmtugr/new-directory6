/**
 * dashboard.js
 * Kontrol paneli işlevleri ve veri yönetimi
 */

import apiService from '../../services/apiService.js';
import storageService from '../../services/storageService.js';

class Dashboard {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // Dashboard verilerini yükle
            await this.loadDashboardData();
            
            // Event listener'ları ekle
            this.addEventListeners();
            
            console.log('Dashboard başarıyla başlatıldı');
            } catch (error) {
            console.error('Dashboard başlatılırken hata oluştu:', error);
        }
    }

    async loadDashboardData() {
        try {
            // Siparişleri yükle
            const orders = await apiService.getOrders();
            this.updateOrdersList(orders);
            
            // Envanter durumunu yükle
            const inventory = await apiService.getInventory();
            this.updateInventoryStatus(inventory);
            
            // Üretim durumunu yükle
            const productionStatus = await apiService.getProductionStatus();
            this.updateProductionStatus(productionStatus);
        } catch (error) {
            console.error('Dashboard verileri yüklenirken hata oluştu:', error);
        }
    }

    updateOrdersList(orders) {
        const ordersList = document.getElementById('orders-list');
        if (!ordersList) return;
        
        ordersList.innerHTML = orders.map(order => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${order.title}</h5>
                    <p class="card-text">${order.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge ${this.getStatusClass(order.status)}">${order.status}</span>
                        <small class="text-muted">${new Date(order.date).toLocaleDateString()}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateInventoryStatus(inventory) {
        const inventoryStatus = document.getElementById('inventory-status');
        if (!inventoryStatus) return;
        
        inventoryStatus.innerHTML = inventory.map(item => `
            <div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text">Stok: ${item.quantity}</p>
                    <div class="progress">
                        <div class="progress-bar ${this.getInventoryClass(item.quantity, item.threshold)}" 
                             role="progressbar" 
                             style="width: ${(item.quantity / item.maxQuantity) * 100}%">
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateProductionStatus(status) {
        const productionStatus = document.getElementById('production-status');
        if (!productionStatus) return;
        
        productionStatus.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Üretim Durumu</h5>
                    <p class="card-text">${status.description}</p>
                    <div class="progress">
                        <div class="progress-bar" 
                             role="progressbar" 
                             style="width: ${status.progress}%">
                            ${status.progress}%
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        const classes = {
            'planlandı': 'bg-primary',
            'devam ediyor': 'bg-warning',
            'tamamlandı': 'bg-success',
            'gecikti': 'bg-danger'
        };
        return classes[status.toLowerCase()] || 'bg-secondary';
    }

    getInventoryClass(quantity, threshold) {
        if (quantity <= threshold) return 'bg-danger';
        if (quantity <= threshold * 1.5) return 'bg-warning';
        return 'bg-success';
    }

    addEventListeners() {
        // Sipariş kartlarına tıklama olayı ekle
        document.getElementById('orders-list')?.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const orderId = card.dataset.orderId;
                if (orderId) {
                    window.location.href = `/orders/${orderId}`;
                }
            }
        });
        
        // Envanter kartlarına tıklama olayı ekle
        document.getElementById('inventory-status')?.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const itemId = card.dataset.itemId;
                if (itemId) {
                    window.location.href = `/inventory/${itemId}`;
                }
            }
        });
    }
}

// Loading indicator function
function showLoadingInPage() {
    console.log('Loading indicator shown.');
}

// Error display function
function showErrorInPage(error) {
    console.error('Error shown in page:', error);
}

// Dashboard instance'ını oluştur ve export et
const dashboard = new Dashboard();

export const initialize = () => dashboard.init();
export default dashboard;