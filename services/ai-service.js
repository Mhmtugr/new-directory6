/**
 * AI Servisi
 * DeepSeek AI entegrasyonu için API ve yardımcı fonksiyonlar
 */

// AI Servisi sınıfı
class AIService {
    constructor() {
        this.config = {
            apiKey: window.DEEPSEEK_API_KEY || 'sk-3a17ae40b3e445528bc988f04805e54b',
            modelName: 'deepseek-chat',
            temperature: 0.7,
            maxTokens: 1000
        };
        this.initialized = false;
        this.context = [];
        this.systemPrompt = `
            Sen MehmetEndüstriyelTakip sisteminin yapay zeka asistanısın.
            Orta Gerilim Hücre Üretim Takip Sistemi hakkında uzman bir asistan olarak görev yapıyorsun.
            Her zaman doğru, net ve teknik bilgileri içeren yanıtlar vermelisin.
            Sistemdeki sipariş durumları, malzeme stokları ve teknik dokümantasyon hakkında detaylı bilgi sahibisin.
            Eğer sorular net değilse, daha net bilgi iste ve kullanıcıyı yönlendir.
            Özelllikle teknik konularda derin bilgi sahibisin.
        `;
        
        // Öntanımlı teknik bilgiler
        this.technicalKnowledge = {
            'rm36cb': `RM 36 CB (Circuit Breaker) hücresi, orta gerilim dağıtım şebekeleri için tasarlanmış kesicili hücredir. 
                      Nominal gerilimi 36kV'a kadar, nominal akımı 630A-2500A arası değerlerde olabilir.
                      Kısa devre dayanımı 16kA-25kA arasındadır. Metal muhafazalı (metal-clad) yapıda olup IEC 62271-200 standardına uygundur.
                      Genellikle koruma amaçlı kullanılır, akım-gerilim ölçümü ve kesici işlevleri vardır.`,
            'rm36lb': `RM 36 LB (Load-Break) hücresi, orta gerilim dağıtım şebekeleri için tasarlanmış yük ayırıcılı hücredir.
                      Nominal gerilimi 36kV'a kadar, nominal akımı 630A-1250A arası değerlerde olabilir.
                      IEC 62271-200 standardına uygun metal mahfazalı yapıdadır.
                      Yük altında açma-kapama işlemleri yapabilir, genellikle hat besleme ve transformatör koruma amaçlı kullanılır.`,
            'rm36fl': `RM 36 FL (Fuse-Link) hücresi, orta gerilim dağıtım şebekeleri için tasarlanmış sigortalı ayırıcılı hücredir.
                      Nominal gerilimi 36kV'a kadar, nominal akımı genellikle 630A'dir.
                      Transformatör koruması için kullanılır, sigorta ile aşırı akım koruması sağlar.`,
            'rmu': `RMU (Ring Main Unit), genellikle halka şebeke yapılarında kullanılan kompakt orta gerilim hücreleridir.
                   SF6 gazı veya hava izolasyonlu olabilir, genellikle 24kV-36kV gerilim seviyelerinde çalışır.
                   Modüler yapıda üretilebilir, yük ayırıcılı ve sigortalı kombinasyonlar içerebilir.`
        };
        
        // Hücrelerde kullanılan ekipman bilgileri
        this.equipmentDetails = {
            'akımTrafosu': {
                'description': 'Akım trafoları, yüksek akım değerlerini ölçüm cihazları ve koruma röleleri için uygun seviyeye düşüren transformatörlerdir.',
                'types': [
                    { 'model': 'KAP-80/190-95', 'code': '144866%', 'specs': '200-400/5-5A 5P20 7,5/15VA', 'usage': 'RM 36 CB' },
                    { 'model': 'KAT-85/190-95', 'code': '142227%', 'specs': '300-600/5-5A 5P20 7,5/15VA', 'usage': 'RM 36 CB, RMU' }
                ]
            },
            'gerilimTrafosu': {
                'description': 'Gerilim trafoları, yüksek gerilim değerlerini ölçüm için uygun seviyeye düşürür.',
                'types': [
                    { 'model': 'VCB-36', 'specs': '36kV/√3 / 100V/√3', 'accuracy': '0.5', 'burden': '30VA' },
                    { 'model': 'VCB-24', 'specs': '24kV/√3 / 100V/√3', 'accuracy': '0.5', 'burden': '25VA' }
                ]
            },
            'korumaSistemleri': {
                'relays': [
                    { 'model': 'Siemens 7SR1003-1JA20-2DA0+ZY20', 'code': '137998%', 'functions': 'ANSI 50/51/67N', 'supply': '24VDC' },
                    { 'model': 'ABB REF615', 'functions': 'ANSI 50/51/67N/87T', 'supply': '110-250VDC' }
                ],
                'fuses': [
                    { 'model': 'CEF', 'ratings': '6.3-63A', 'type': 'HH' },
                    { 'model': 'C&S', 'ratings': '10-100A', 'type': 'HH' }
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('AI Servisi başlatılıyor...');
        this.initialized = true;
        console.log('AI Servisi başlatıldı');
    }
    
    async query(message, options = {}) {
        if (!this.initialized) {
            console.warn('AI Servisi başlatılmadı');
            return { error: 'AI Servisi başlatılmadı' };
        }
        
        try {
            console.log('AI sorgulama:', message);
            
            // Sistem verilerini al
            const systemData = await this.getSystemData();
            
            // DeepSeek API entegrasyonu için hazırlık
            const context = this.prepareContext(message, systemData);
            
            // Demo modu veya gerçek API çağrısı
            if (options.demo) {
                return this.generateDemoResponse(message, systemData);
            } else {
                return this.callDeepSeekAPI(context);
            }
        } catch (error) {
            console.error('AI sorgulaması sırasında hata', error);
            return { error: 'AI sorgulaması sırasında bir hata oluştu', details: error.message };
        }
    }
    
    prepareContext(message, systemData) {
        // DeepSeek API için bağlam hazırla
        const ordersSummary = systemData.orders.map(o => 
            `Sipariş No: ${o.id}, Müşteri: ${o.customer}, Hücre Tipi: ${o.cellType}, Durum: ${o.status}, İlerleme: %${o.progress}`
        ).join('\n');
        
        const materialsSummary = systemData.materials.map(m => 
            `Kod: ${m.code}, Malzeme: ${m.name}, Stok: ${m.stock}, İhtiyaç: ${m.required}, Durum: ${m.status}`
        ).join('\n');
        
        const docsSummary = systemData.technicalDocs.map(d => 
            `Doküman: ${d.name}, Tarih: ${d.date}`
        ).join('\n');
        
        const technicalKnowledgeText = Object.values(this.technicalKnowledge).join('\n');
        
        return [
            { role: "system", content: this.systemPrompt },
            { role: "system", content: "Teknik Bilgiler:\n" + technicalKnowledgeText },
            { role: "system", content: "Mevcut sipariş bilgileri:\n" + ordersSummary },
            { role: "system", content: "Mevcut malzeme bilgileri:\n" + materialsSummary },
            { role: "system", content: "Mevcut teknik dokümanlar:\n" + docsSummary },
            { role: "user", content: message }
        ];
    }
    
    async callDeepSeekAPI(context) {
        try {
            const apiKey = this.config.apiKey;
            if (!apiKey) {
                console.warn('DeepSeek API anahtarı tanımlanmamış');
                return { error: 'API anahtarı bulunamadı' };
            }
            
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: this.config.modelName,
                    messages: context,
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens
                })
            });
            
            if (!response.ok) {
                throw new Error(`API hatası: ${response.status}`);
            }
            
            const data = await response.json();
            return {
                type: 'text',
                content: data.choices[0].message.content
            };
        } catch (error) {
            console.error('DeepSeek API isteği başarısız:', error);
            
            // API hatası durumunda demo yanıt döndür
            const demoResponse = await this.generateDemoResponse(context[context.length - 1].content, await this.getSystemData());
            return {
                type: 'text',
                content: `(Demo yanıt - API hatası) ${demoResponse.content || demoResponse}`,
                error: error.message
            };
        }
    }
    
    async getSystemData() {
        // Demo verileri (gerçek uygulamada API'den alınacak)
        return {
            orders: [
                { id: '#0424-1251', customer: 'AYEDAŞ', cellType: 'RM 36 CB', status: 'Gecikiyor', progress: 65 },
                { id: '#0424-1245', customer: 'TEİAŞ', cellType: 'RM 36 CB', status: 'Devam Ediyor', progress: 45 },
                { id: '#0424-1239', customer: 'BEDAŞ', cellType: 'RM 36 LB', status: 'Devam Ediyor', progress: 30 },
                { id: '#0424-1235', customer: 'OSMANİYE ELEKTRİK', cellType: 'RM 36 FL', status: 'Planlandı', progress: 10 }
            ],
            materials: [
                { code: '137998%', name: 'Siemens 7SR1003-1JA20-2DA0+ZY20 24VDC', stock: 2, required: 8, status: 'Kritik' },
                { code: '144866%', name: 'KAP-80/190-95 Akım Trafosu', stock: 3, required: 5, status: 'Düşük' },
                { code: '120170%', name: 'M480TB/G-027-95.300UN5 Kablo Başlığı', stock: 12, required: 15, status: 'Düşük' },
                { code: '109367%', name: '582mm Bara', stock: 25, required: 18, status: 'Yeterli' }
            ],
            technicalDocs: [
                { name: 'RM 36 CB Teknik Çizim', date: '15.10.2024', content: 'RM 36 CB hücresine ait teknik çizim detayları...' },
                { name: 'RM 36 LB Montaj Talimatı', date: '10.10.2024', content: 'RM 36 LB hücresi montaj talimatları...' },
                { name: 'Akım Trafosu Seçim Kılavuzu', date: '01.10.2024', content: 'Akım trafolarının seçimine ilişkin teknik bilgiler...' }
            ]
        };
    }
    
    generateDemoResponse(message, systemData) {
        // Bu kısım window.generateAIResponse fonksiyonunu çağırabilir
        if (typeof window.generateAIResponse === 'function') {
            return {
                type: 'text',
                content: window.generateAIResponse(message, systemData)
            };
        }
        
        // Temel demo yanıtlar
        const lowerMessage = message.toLowerCase();
        
        // Siparişlerle ilgili sorular
        if (lowerMessage.includes('sipariş') || lowerMessage.includes('order')) {
            if (lowerMessage.includes('geciken') || lowerMessage.includes('gecikme')) {
                return {
                    type: 'text',
                    content: `Sistemde geciken 1 sipariş bulunmaktadır: ${systemData.orders[0].id} no'lu ${systemData.orders[0].customer} firmasına ait ${systemData.orders[0].cellType} hücresi. İlerleme durumu: %${systemData.orders[0].progress}.`
                };
            }
            
            return {
                type: 'text',
                content: `Sistemde toplam 4 aktif sipariş bulunmaktadır. 1 sipariş gecikmiş durumda, 2 sipariş devam ediyor, 1 sipariş ise planlanma aşamasında.`
            };
        }
        
        // Teknik sorular
        for (const [key, info] of Object.entries(this.technicalKnowledge)) {
            if (lowerMessage.includes(key.toLowerCase())) {
                return {
                    type: 'text',
                    content: info
                };
            }
        }
        
        // Ekipman bilgisi
        if (lowerMessage.includes('akım trafo')) {
            return {
                type: 'text',
                content: `Akım trafoları hakkında bilgi: ${this.equipmentDetails.akımTrafosu.description} 
                         Sistemdeki modeller: 
                         - ${this.equipmentDetails.akımTrafosu.types[0].model} (${this.equipmentDetails.akımTrafosu.types[0].specs})
                         - ${this.equipmentDetails.akımTrafosu.types[1].model} (${this.equipmentDetails.akımTrafosu.types[1].specs})`
            };
        }
        
        // Genel yanıt
        return {
            type: 'text',
            content: `Merhaba, ben MehmetEndüstriyelTakip akıllı asistanıyım. Size orta gerilim hücre üretimi konusunda yardımcı olabilirim. Siparişler, malzemeler veya teknik konular hakkında soru sorabilirsiniz.`
        };
    }
    
    // Teknik sorgulama için özel metot
    async technicalQuery(question) {
        try {
            const hucreMatch = question.match(/rm\s*36\s*(cb|lb|fl|rmu)/i);
            const equipmentMatch = question.match(/(akım|gerilim)\s*(trafosu|transformatörü)/i);
            
            let relevantInfo = '';
            
            if (hucreMatch) {
                const hucreType = hucreMatch[1].toLowerCase();
                const key = `rm36${hucreType}`;
                if (this.technicalKnowledge[key]) {
                    relevantInfo = this.technicalKnowledge[key];
                }
            }
            
            if (equipmentMatch) {
                const equipType = equipmentMatch[1].toLowerCase() === 'akım' ? 'akımTrafosu' : 'gerilimTrafosu';
                if (this.equipmentDetails[equipType]) {
                    relevantInfo += '\n\n' + this.equipmentDetails[equipType].description;
                    relevantInfo += '\n\nModeller:';
                    this.equipmentDetails[equipType].types.forEach(type => {
                        relevantInfo += `\n- ${type.model}: ${type.specs}`;
                    });
                }
            }
            
            // İlgili bilgi bulunamazsa veya daha kompleks sorgular için API'ye yönlendir
            if (!relevantInfo || question.length > 50) {
                return this.query(question, { useRefinedPrompt: true });
            }
            
            return {
                type: 'text',
                content: relevantInfo,
                source: 'local-knowledge-base'
            };
            
        } catch (error) {
            console.error('Teknik sorgulama hatası:', error);
            return { error: 'Sorgu işlenirken bir hata oluştu' };
        }
    }
}

// Global olarak ai-service'i ata
window.aiService = new AIService();

console.log('AI Servisi başarıyla yüklendi');