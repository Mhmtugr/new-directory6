import { Orders } from '../modules/orders/orders.js';
import { Production } from '../modules/production/production.js';
import { Stock } from '../modules/stock/stock.js';
import { Purchasing } from '../modules/purchasing/purchasing.js';

class Router {
    constructor() {
        this.routes = {
            '/': this.loadHomePage,
            '/orders': this.loadOrdersPage,
            '/production': this.loadProductionPage,
            '/stock': this.loadStockPage,
            '/purchasing': this.loadPurchasingPage
        };
        
        this.currentModule = null;
    }
    
    initialize() {
        this.setupEventListeners();
        // Sayfa yüklendiğinde ana sayfaya yönlendir
        this.navigate('/');
    }

    setupEventListeners() {
        // Sidebar linklerine tıklama olayları
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.target.closest('.nav-link').dataset.route;
                if (route) {
                    this.navigate(route);
                }
            });
        });

        // Tarayıcı geri/ileri butonları
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname);
        });
    }

    async navigate(route) {
        if (!this.routes[route]) {
            console.error('Route bulunamadı:', route);
            return;
        }

        // Aktif modülü temizle
        if (this.currentModule && typeof this.currentModule.cleanup === 'function') {
            this.currentModule.cleanup();
        }

        // Yeni sayfayı yükle
        await this.routes[route].call(this);

        // URL'i güncelle
        window.history.pushState({}, '', route);

        // Aktif linki güncelle
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.route === route) {
                link.classList.add('active');
            }
        });
    }

    async loadHomePage() {
        try {
            const mainContent = document.getElementById('main-content');
            const response = await fetch('pages/home.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            mainContent.innerHTML = await response.text();
            
            // Ana sayfa grafiklerini yükle
            if (typeof Chart !== 'undefined') {
                this.initializeHomeCharts();
            }
            
            this.currentModule = null;
        } catch (error) {
            console.error('Ana sayfa yüklenirken hata oluştu:', error);
            document.getElementById('main-content').innerHTML = `
                <div class="alert alert-danger mt-4">
                    <h4>Sayfa yüklenirken hata oluştu</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    // Ana sayfa grafiklerini oluştur
    initializeHomeCharts() {
        if (document.getElementById('productionChart')) {
            const productionCtx = document.getElementById('productionChart').getContext('2d');
            new Chart(productionCtx, {
                type: 'line',
                data: {
                    labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
                    datasets: [
                        {
                            label: 'Planlanan Üretim',
                            data: [180, 170, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280],
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Gerçekleşen Üretim',
                            data: [175, 165, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275],
                            borderColor: '#2ecc71',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Adet'
                            }
                        }
                    }
                }
            });
        }

        if (document.getElementById('cellTypeChart')) {
            const cellTypeCtx = document.getElementById('cellTypeChart').getContext('2d');
            new Chart(cellTypeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['RM 36 CB', 'RM 36 LB', 'RM 36 FL', 'RMU'],
                    datasets: [{
                        data: [45, 30, 15, 10],
                        backgroundColor: [
                            '#3498db',
                            '#2ecc71',
                            '#f39c12',
                            '#9b59b6'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right',
                        }
                    }
                }
            });
        }
    }

    async loadOrdersPage() {
        try {
            const mainContent = document.getElementById('main-content');
            const response = await fetch('pages/orders.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            mainContent.innerHTML = await response.text();
            
            // Orders modülünü başlat
            this.currentModule = new Orders();
            if (typeof this.currentModule.init === 'function') {
                await this.currentModule.init();
            }
        } catch (error) {
            console.error('Siparişler sayfası yüklenirken hata oluştu:', error);
            document.getElementById('main-content').innerHTML = `
                <div class="alert alert-danger mt-4">
                    <h4>Sayfa yüklenirken hata oluştu</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    async loadProductionPage() {
        try {
            const mainContent = document.getElementById('main-content');
            const response = await fetch('pages/production.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            mainContent.innerHTML = await response.text();
            
            // Production modülünü başlat
            this.currentModule = new Production();
            if (typeof this.currentModule.init === 'function') {
                await this.currentModule.init();
            }
        } catch (error) {
            console.error('Üretim sayfası yüklenirken hata oluştu:', error);
            document.getElementById('main-content').innerHTML = `
                <div class="alert alert-danger mt-4">
                    <h4>Sayfa yüklenirken hata oluştu</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    async loadStockPage() {
        try {
            const mainContent = document.getElementById('main-content');
            const response = await fetch('pages/stock.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            mainContent.innerHTML = await response.text();
            
            // Stock modülünü başlat
            this.currentModule = new Stock();
            if (typeof this.currentModule.init === 'function') {
                await this.currentModule.init();
            }
        } catch (error) {
            console.error('Stok sayfası yüklenirken hata oluştu:', error);
            document.getElementById('main-content').innerHTML = `
                <div class="alert alert-danger mt-4">
                    <h4>Sayfa yüklenirken hata oluştu</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    async loadPurchasingPage() {
        try {
            const mainContent = document.getElementById('main-content');
            const response = await fetch('pages/purchasing.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            mainContent.innerHTML = await response.text();
            
            // Purchasing modülünü başlat
            this.currentModule = new Purchasing();
            if (typeof this.currentModule.init === 'function') {
                await this.currentModule.init();
            }
        } catch (error) {
            console.error('Satın alma sayfası yüklenirken hata oluştu:', error);
            document.getElementById('main-content').innerHTML = `
                <div class="alert alert-danger mt-4">
                    <h4>Sayfa yüklenirken hata oluştu</h4>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

export default Router; 