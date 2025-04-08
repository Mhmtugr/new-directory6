/**
 * production.js
 * Üretim planlaması ve takip işlevleri
 */

import { apiService } from '../../services/apiService.js';
import { storageService } from '../../services/storageService.js';

export class Production {
    constructor() {
        this.productionData = null;
    }

    async init() {
        try {
            await this.loadProductionData();
            this.addEventListeners();
            console.log('Üretim modülü başarıyla yüklendi');
        } catch (error) {
            console.error('Üretim modülü yüklenirken hata:', error);
        }
    }

    cleanup() {
        // Event listener'ları temizle
        const productionStatus = document.getElementById('productionStatus');
        if (productionStatus) {
            productionStatus.innerHTML = '';
        }
    }

    async loadProductionData() {
        try {
            this.productionData = await apiService.getProductionData();
            this.updateProductionStatus();
            this.updateProductionPlan();
            this.updateProductionReports();
        } catch (error) {
            console.error('Üretim verileri yüklenirken hata:', error);
            throw error;
        }
    }

    updateProductionStatus() {
        const statusContainer = document.getElementById('productionStatus');
        if (!statusContainer || !this.productionData) return;

        statusContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Üretim Durumu</h5>
                    <div class="progress mb-3">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${this.productionData.progress}%">
                            ${this.productionData.progress}%
                        </div>
                    </div>
                    <p class="card-text">
                        <strong>Aktif Siparişler:</strong> ${this.productionData.activeOrders}<br>
                        <strong>Tamamlanan:</strong> ${this.productionData.completedOrders}<br>
                        <strong>Geciken:</strong> ${this.productionData.delayedOrders}
                    </p>
                </div>
            </div>
        `;
    }

    updateProductionPlan() {
        const planContainer = document.getElementById('productionPlan');
        if (!planContainer || !this.productionData) return;

        planContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Üretim Planı</h5>
                <div class="table-responsive">
                        <table class="table">
                        <thead>
                            <tr>
                                <th>Sipariş No</th>
                                <th>Müşteri</th>
                                    <th>Ürün</th>
                                <th>Miktar</th>
                                    <th>Başlangıç</th>
                                    <th>Bitiş</th>
                                    <th>Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                                ${this.productionData.plan.map(item => `
                                    <tr>
                                        <td>${item.orderNumber}</td>
                                        <td>${item.customer}</td>
                                        <td>${item.product}</td>
                                        <td>${item.quantity}</td>
                                        <td>${new Date(item.startDate).toLocaleDateString()}</td>
                                        <td>${new Date(item.endDate).toLocaleDateString()}</td>
                                        <td><span class="badge ${this.getStatusClass(item.status)}">${item.status}</span></td>
                </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        `;
    }

    updateProductionReports() {
        const reportsContainer = document.getElementById('productionReports');
        if (!reportsContainer || !this.productionData) return;

        reportsContainer.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Üretim Raporları</h5>
            <div class="table-responsive">
                        <table class="table">
                    <thead>
                        <tr>
                                    <th>Tarih</th>
                                    <th>Verimlilik</th>
                                    <th>Hedef</th>
                                    <th>Gerçekleşen</th>
                                    <th>Fark</th>
                        </tr>
                    </thead>
                    <tbody>
                                ${this.productionData.reports.map(report => `
                                    <tr>
                                        <td>${new Date(report.date).toLocaleDateString()}</td>
                                        <td>${report.efficiency}%</td>
                                        <td>${report.target}</td>
                                        <td>${report.actual}</td>
                                        <td class="${report.difference >= 0 ? 'text-success' : 'text-danger'}">
                                            ${report.difference >= 0 ? '+' : ''}${report.difference}
                                        </td>
                </tr>
                                `).join('')}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    `;
    }

    getStatusClass(status) {
        const statusClasses = {
            'Planlandı': 'bg-primary',
            'Devam Ediyor': 'bg-warning',
            'Tamamlandı': 'bg-success',
            'Gecikti': 'bg-danger'
        };
        return statusClasses[status] || 'bg-secondary';
    }

    addEventListeners() {
        // Plan güncelleme butonu
        const updatePlanBtn = document.getElementById('updatePlanBtn');
        if (updatePlanBtn) {
            updatePlanBtn.addEventListener('click', () => this.showUpdatePlanModal());
        }

        // Rapor ekleme butonu
        const addReportBtn = document.getElementById('addReportBtn');
        if (addReportBtn) {
            addReportBtn.addEventListener('click', () => this.showAddReportModal());
        }
    }

    showUpdatePlanModal() {
        // Plan güncelleme modalını göster
        console.log('Plan güncelleme modalı gösteriliyor');
    }

    showAddReportModal() {
        // Rapor ekleme modalını göster
        console.log('Rapor ekleme modalı gösteriliyor');
    }
}

// Production instance'ını oluştur ve export et
const production = new Production();

export const initialize = () => production.init();
export default production;