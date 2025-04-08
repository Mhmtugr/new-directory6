/**
 * Chatbot Modülü
 * Yapay zeka asistanı ile iletişim arayüzü sağlar
 */

// Chatbot sınıfı
class Chatbot {
    constructor() {
        this.messages = [];
        this.initialized = false;
        
        this.init();
    }
    
    init() {
        console.log('Chatbot başlatılıyor...');
        
        try {
            // DOM elementleri
            this.chatModal = document.getElementById('aiChatModal');
            this.chatMessages = document.getElementById('chatMessages');
            this.chatInput = document.getElementById('aiChatInput');
            this.sendButton = document.getElementById('sendChatBtn');
            
            // Event listeners
            if (this.sendButton) {
                this.sendButton.addEventListener('click', () => {
                    if (window.sendChatMessage) {
                        window.sendChatMessage();
                    } else {
                        this.sendMessage();
                    }
                });
            }
            
            if (this.chatInput) {
                this.chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        if (window.sendChatMessage) {
                            window.sendChatMessage();
                        } else {
                            this.sendMessage();
                        }
                    }
                });
            }
            
            // AI servis kontrolü
            this.aiService = window.aiService;
            
            if (!this.aiService) {
                console.warn('AI servisi bulunamadı, demo yanıtlar kullanılacak');
            }
            
            this.initialized = true;
            console.log('Chatbot başarıyla başlatıldı');
            
            // Demo bildirim
            setTimeout(() => {
                this.showNotification(3);
            }, 3000);
            
        } catch (error) {
            console.error('Chatbot başlatılamadı:', error);
        }
    }
    
    async sendMessage() {
        if (!this.initialized || !this.chatInput) {
            console.error('Chatbot henüz hazır değil');
            return;
        }
        
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Kullanıcı mesajını ekle
        this.addMessage('user', message);
        this.chatInput.value = '';
        
        // Yükleniyor mesajı
        const loadingId = this.addLoadingMessage();
        
        try {
            let response;
            
            if (this.aiService) {
                // Yapay zeka yanıtını al
                response = await this.aiService.query(message, { demo: true });
            } else {
                // AI servis yoksa demo yanıt kullan
                response = {
                    type: 'text',
                    content: 'Bu bir demo yanıttır. AI servisi aktif değil.'
                };
            }
            
            // Yükleniyor mesajını kaldır
            this.removeLoadingMessage(loadingId);
            
            if (response.error) {
                this.addMessage('ai', 'Üzgünüm, bir hata oluştu: ' + response.error);
                return;
            }
            
            // Yanıta göre mesaj ekle
            const content = response.content || response.text || 'Yanıt alınamadı.';
            this.addMessage('ai', content);
        } catch (error) {
            // Yükleniyor mesajını kaldır
            this.removeLoadingMessage(loadingId);
            
            console.error('Mesaj gönderilirken hata oluştu', error);
            this.addMessage('ai', 'Üzgünüm, bir sorun oluştu. Lütfen tekrar deneyin.');
        }
    }
    
    addLoadingMessage() {
        if (!this.chatMessages) return null;
        
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message ai-message';
        loadingDiv.id = loadingId;
        loadingDiv.innerHTML = '<small><i>Yanıt oluşturuluyor...</i></small>';
        
        this.chatMessages.appendChild(loadingDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        return loadingId;
    }
    
    removeLoadingMessage(loadingId) {
        if (!loadingId || !this.chatMessages) return;
        
        const loadingDiv = document.getElementById(loadingId);
        if (loadingDiv) {
            this.chatMessages.removeChild(loadingDiv);
        }
    }
    
    addMessage(type, text) {
        if (!this.chatMessages) return;
        
        // Mesajı listeye ekle
        this.messages.push({ type, text, timestamp: new Date() });
        
        // Mesajı DOM'a ekle
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type === 'user' ? 'user-message' : 'ai-message'}`;
        messageDiv.textContent = text;
        
        this.chatMessages.appendChild(messageDiv);
        
        // Sohbeti en alta kaydır
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    showNotification(count = 1) {
        const badge = document.querySelector('.ai-chatbot-btn .notification-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = 'flex';
        }
    }
    
    clearNotifications() {
        const badge = document.querySelector('.ai-chatbot-btn .notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
}

// Global olarak chatbot nesnesini oluştur
window.chatbot = new Chatbot();

console.log('Chatbot modülü başarıyla yüklendi');