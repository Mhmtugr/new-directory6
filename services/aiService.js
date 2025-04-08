import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class AIService {
    constructor() {
        this.model = this.initializeModel();
    }

    initializeModel() {
        // Basit bir mock model oluştur
        return {
            predict: async (input) => {
                // Gerçek bir model entegrasyonu için bu kısım değiştirilmeli
                return {
                    productionTime: Math.floor(Math.random() * 10) + 5, // 5-15 gün arası
                    requiredMaterials: [
                        { name: 'Akım Trafosu', quantity: 2 },
                        { name: 'Röle', quantity: 1 },
                        { name: 'Kablo Başlığı', quantity: 4 }
                    ]
                };
            }
        };
    }

    async processQuery(query) {
        try {
            // Sipariş analizi
            if (query.toLowerCase().includes('sipariş') || query.toLowerCase().includes('üretim')) {
                const prediction = await this.model.predict(query);
                return `Tahmini üretim süresi: ${prediction.productionTime} gün\nGerekli malzemeler:\n${prediction.requiredMaterials.map(m => `- ${m.name}: ${m.quantity} adet`).join('\n')}`;
            }

            // Stok kontrolü
            if (query.toLowerCase().includes('stok') || query.toLowerCase().includes('malzeme')) {
                const materials = await this.checkStock();
                return `Stok durumu:\n${materials.map(m => `- ${m.name}: ${m.quantity} adet`).join('\n')}`;
            }

            // Üretim planı
            if (query.toLowerCase().includes('plan') || query.toLowerCase().includes('program')) {
                const plan = await this.generateProductionPlan();
                return `Üretim planı:\n${plan.map(p => `- ${p.order}: ${p.status}`).join('\n')}`;
            }

            // Genel sorular için Firestore'dan bilgi al
            const response = await this.getResponseFromFirestore(query);
            return response || 'Üzgünüm, bu konuda yeterli bilgiye sahip değilim.';
        } catch (error) {
            console.error('AI Service error:', error);
            throw error;
        }
    }

    async checkStock() {
        // Firestore'dan stok bilgilerini al
        const snapshot = await db.collection('materials').get();
        return snapshot.docs.map(doc => doc.data());
    }

    async generateProductionPlan() {
        // Firestore'dan üretim planını al
        const snapshot = await db.collection('production_plan').get();
        return snapshot.docs.map(doc => doc.data());
    }

    async getResponseFromFirestore(query) {
        // Firestore'dan ilgili yanıtı al
        const snapshot = await db.collection('ai_responses')
            .where('keywords', 'array-contains-any', query.toLowerCase().split(' '))
            .get();

        if (!snapshot.empty) {
            return snapshot.docs[0].data().response;
        }
        return null;
    }
}

// Singleton instance oluştur
const aiService = new AIService();

export { aiService }; 