const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Tüm siparişleri getir
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Tek bir siparişi getir
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Sipariş bulunamadı' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Yeni sipariş oluştur
router.post('/', async (req, res) => {
    const order = new Order({
        orderNumber: req.body.orderNumber,
        customer: req.body.customer,
        product: req.body.product,
        quantity: req.body.quantity,
        status: req.body.status
    });

    try {
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Siparişi güncelle
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Sipariş bulunamadı' });
        }

        order.orderNumber = req.body.orderNumber || order.orderNumber;
        order.customer = req.body.customer || order.customer;
        order.product = req.body.product || order.product;
        order.quantity = req.body.quantity || order.quantity;
        order.status = req.body.status || order.status;

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Siparişi sil
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Sipariş bulunamadı' });
        }

        await order.remove();
        res.json({ message: 'Sipariş silindi' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 