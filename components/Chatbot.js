import { aiService } from '../services/aiService.js';

export default class Chatbot {
    constructor() {
        this.container = null;
        this.isOpen = false;
        this.initialize();
    }

    initialize() {
        // Chatbot container'ı oluştur
        this.container = document.createElement('div');
        this.container.className = 'ai-chatbot-container';
        this.container.style.display = 'none';

        // Chat header
        const header = document.createElement('div');
        header.className = 'chat-header';
        header.innerHTML = `
            <h5>Yapay Zeka Asistan</h5>
            <button class="close-chat"><i class="bi bi-x-lg"></i></button>
        `;

        // Chat messages container
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'chat-messages';

        // Chat input container
        const inputContainer = document.createElement('div');
        inputContainer.className = 'chat-input';
        inputContainer.innerHTML = `
            <input type="text" placeholder="Soru sorun...">
            <button class="send-message"><i class="bi bi-send"></i></button>
        `;

        // Bileşenleri container'a ekle
        this.container.appendChild(header);
        this.container.appendChild(messagesContainer);
        this.container.appendChild(inputContainer);

        // Document body'e ekle
        document.body.appendChild(this.container);

        // Event listeners
        header.querySelector('.close-chat').addEventListener('click', () => this.close());
        inputContainer.querySelector('.send-message').addEventListener('click', () => this.sendMessage());
        inputContainer.querySelector('input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Chatbot butonunu oluştur
        this.createChatbotButton();
    }

    createChatbotButton() {
        const button = document.createElement('div');
        button.className = 'ai-chatbot-btn';
        button.innerHTML = '<i class="bi bi-robot"></i>';
        button.addEventListener('click', () => this.toggle());

        document.body.appendChild(button);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.container.style.display = this.isOpen ? 'flex' : 'none';
    }

    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
    }

    async sendMessage() {
        const input = this.container.querySelector('.chat-input input');
        const message = input.value.trim();
        
        if (!message) return;

        // Kullanıcı mesajını ekle
        this.addMessage(message, 'user');
        input.value = '';

        try {
            // AI servisinden yanıt al
            const response = await aiService.processQuery(message);
            
            // AI yanıtını ekle
            this.addMessage(response, 'assistant');
        } catch (error) {
            console.error('Chatbot error:', error);
            this.addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'assistant');
        }
    }

    addMessage(content, type) {
        const messagesContainer = this.container.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        
        const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${time}</div>
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
} 