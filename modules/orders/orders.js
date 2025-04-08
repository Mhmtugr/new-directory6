/**
 * orders.js
 * Sipariş yönetimi işlevleri
 */

import { apiService } from '../../services/apiService.js';
import { storageService } from '../../services/storageService.js';

export class Orders {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
    }

    async init() {
        try {
            await this.loadOrders();
            this.addEventListeners();
            console.log('Siparişler modülü başarıyla yüklendi');
    } catch (error) {
            console.error('Siparişler modülü yüklenirken hata:', error);
        }
    }

    cleanup() {
        // Event listener'ları temizle
        const orderTable = document.getElementById('ordersTable');
        if (orderTable) {
            orderTable.innerHTML = '';
        }
    }

    async loadOrders() {
        try {
            this.orders = await apiService.getOrders();
            this.filteredOrders = [...this.orders];
            this.updateOrdersTable();
        } catch (error) {
            console.error('Siparişler yüklenirken hata:', error);
            throw error;
        }
    }

    updateOrdersTable() {
        const tableBody = document.getElementById('ordersTable');
        if (!tableBody) return;

        tableBody.innerHTML = this.filteredOrders.map(order => `
            <tr>
                <td>${order.orderNumber}</td>
                <td>${order.customer}</td>
                <td>${order.product}</td>
                <td>${order.quantity}</td>
                <td>${order.status}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="window.orders.showOrderDetails('${order.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="window.orders.editOrder('${order.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.orders.deleteOrder('${order.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    addEventListeners() {
        // Sipariş filtreleme
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filteredOrders = this.orders.filter(order => 
                    order.orderNumber.toLowerCase().includes(searchTerm) ||
                    order.customer.toLowerCase().includes(searchTerm) ||
                    order.product.toLowerCase().includes(searchTerm)
                );
                this.updateOrdersTable();
            });
        }

        // Yeni sipariş ekleme
        const addOrderBtn = document.getElementById('addOrderBtn');
        if (addOrderBtn) {
            addOrderBtn.addEventListener('click', () => this.showAddOrderModal());
        }
    }

    async showOrderDetails(orderId) {
        try {
            const order = await apiService.getOrderDetails(orderId);
            // Detay modalını göster
            console.log('Sipariş detayları:', order);
        } catch (error) {
            console.error('Sipariş detayları yüklenirken hata:', error);
        }
    }

    async editOrder(orderId) {
        try {
            const order = await apiService.getOrderDetails(orderId);
            // Düzenleme modalını göster
            console.log('Sipariş düzenleme:', order);
    } catch (error) {
            console.error('Sipariş düzenlenirken hata:', error);
        }
    }

    async deleteOrder(orderId) {
        if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
            try {
                await apiService.deleteOrder(orderId);
                await this.loadOrders();
            } catch (error) {
                console.error('Sipariş silinirken hata:', error);
            }
        }
    }

    showAddOrderModal() {
        // Yeni sipariş modalını göster
        console.log('Yeni sipariş modalı gösteriliyor');
    }
}