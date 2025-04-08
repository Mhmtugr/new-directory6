/**
 * main.js
 * AI modüllerini tek bir yerden dışa aktarmak için ana dosya
 */

// Modül içe aktarmaları
import AIAnalytics from './ai-analytics.js';
import DataViz from './data-viz.js';
import ChatBot from './chatbot.js';

// Modülleri birleştirip ihraç et
export {
    AIAnalytics,
    DataViz,
    ChatBot
};

// Erişimi kolaylaştırmak için global değişkene ekle
if (typeof window !== 'undefined') {
    window.AIAnalytics = AIAnalytics;
    window.DataViz = DataViz;
    window.ChatBot = ChatBot;
    
    console.log('AI modülleri başarıyla yüklendi');
}

// Varsayılan dışa aktarma
export default {
    AIAnalytics,
    DataViz,
    ChatBot
}; 