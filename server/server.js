const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Route'ları import et
const orderRoutes = require('./routes/orders');
const productionRoutes = require('./routes/production');
const stockRoutes = require('./routes/stock');
const authRoutes = require('./routes/auth');

// Çevre değişkenlerini yükle
dotenv.config();

const app = express();

// Middleware'leri ayarla
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Route'ları tanımla
app.use('/api/orders', orderRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/auth', authRoutes);

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Bir hata oluştu' });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
}); 