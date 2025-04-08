class EventManager {
    constructor() {
        this.events = new Map();
        this.init();
    }

    init() {
        // Global event listener'ları ekle
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('submit', this.handleSubmit.bind(this));
    }

    handleClick(event) {
        const target = event.target;
        
        // Sidebar menü öğeleri için
        if (target.matches('.sidebar .nav-link')) {
            event.preventDefault();
            const path = target.getAttribute('href');
            if (path) {
                import('../core/router.js').then(({ router }) => {
                    router.navigate(path);
                });
            }
        }
        
        // Chatbot butonu için
        if (target.matches('.ai-chatbot-btn')) {
            import('../modules/ai/chatbot.js').then(module => {
                module.toggleChatbot();
            });
        }
    }

    handleSubmit(event) {
        const form = event.target;
        if (form.matches('form')) {
            event.preventDefault();
            this.handleFormSubmit(form);
        }
    }

    async handleFormSubmit(form) {
        const formData = new FormData(form);
        const formId = form.id || form.getAttribute('data-form-id');
        
        try {
            // Form verilerini işle
            const formHandler = this.events.get(`form:${formId}`);
            if (formHandler) {
                await formHandler(formData);
            }
        } catch (error) {
            console.error('Form işlenirken hata oluştu:', error);
        }
    }

    on(eventName, handler) {
        this.events.set(eventName, handler);
    }

    off(eventName) {
        this.events.delete(eventName);
    }
}

// Event Manager instance'ını oluştur ve export et
const eventManager = new EventManager();

export const initializeEventManager = () => eventManager; 