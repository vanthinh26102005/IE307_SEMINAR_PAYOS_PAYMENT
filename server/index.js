require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { PayOS } = require('@payos/node');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, 'orders.json');

// Middleware
app.use(express.json());
app.use(cors());

// --- DATABASE HELPER FUNCTIONS (Mô phỏng DB) ---
const readOrders = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const saveOrder = (newOrder) => {
    const orders = readOrders();
    const existingIndex = orders.findIndex(o => o.orderCode === newOrder.orderCode);
    if (existingIndex >= 0) {
        orders[existingIndex] = { ...orders[existingIndex], ...newOrder };
    } else {
        orders.push(newOrder);
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2));
};

const getOrder = (orderCode) => {
    const orders = readOrders();
    return orders.find(o => o.orderCode == orderCode); // Loose equality for string/number
};

const generateOrderCode = () => Number(String(Date.now()).slice(-6));

// Initialize PayOS
const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// --- ENDPOINTS ---

// 1. POST /payment/create-order
// Tạo đơn hàng PENDING -> Gọi PayOS lấy Link
app.post('/payment/create-order', async (req, res) => {
    try {
        const { amount, description, returnUrl, cancelUrl, orderCode: providedOrderCode } = req.body;

        if (!amount || !description || !returnUrl || !cancelUrl) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Ưu tiên mã đơn hàng phía client gửi, fallback sang mã random
        const orderCode = Number(providedOrderCode) || generateOrderCode();

        const paymentData = {
            orderCode: orderCode,
            amount: Number(amount),
            description: description,
            cancelUrl: cancelUrl,
            returnUrl: returnUrl
        };

        // Gọi PayOS để lấy Checkout Url
        const paymentLink = await payos.paymentRequests.create(paymentData);

        // Lưu đơn hàng vào DB với trạng thái PENDING
        const newOrder = {
            orderCode: orderCode,
            amount: Number(amount),
            description: description,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            checkoutUrl: paymentLink.checkoutUrl,
            paymentLinkId: paymentLink.paymentLinkId,
            returnUrl,
            cancelUrl
        };
        saveOrder(newOrder);
        
        // Trả về cả link và orderCode để App theo dõi
        res.json({
            checkoutUrl: paymentLink.checkoutUrl,
            orderCode: orderCode,
            paymentLinkId: paymentLink.paymentLinkId
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. POST /payment/payos-webhook
app.post('/payment/payos-webhook', async (req, res) => {
    console.log('Webhook Received Body:', JSON.stringify(req.body, null, 2));

    try {
        const data = await payos.webhooks.verify(req.body);

        const updatedOrder = {
            ...getOrder(data.orderCode),
            ...data,
            orderCode: data.orderCode,
            status: data.code === '00' ? 'PAID' : data.desc || 'UNKNOWN',
            transactionId: data.reference,
            webhookReceivedAt: new Date().toISOString()
        };

        saveOrder(updatedOrder);
        console.log('Webhook Signature Verified!');
        console.log(`Order ${data.orderCode} updated to ${updatedOrder.status}`);

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook verification failed:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// 3. GET /payment/order-status/:orderCode
// App gọi vào đây để kiểm tra trạng thái
app.get('/payment/order-status/:orderCode', (req, res) => {
    try {
        const { orderCode } = req.params;
        const order = getOrder(orderCode);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            orderCode: order.orderCode,
            status: order.status
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ADMIN PANEL ---

// GET /payment/orders
// API lấy danh sách đơn hàng cho Admin Panel
app.get('/payment/orders', (req, res) => {
    try {
        const orders = readOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /payment/orders/:orderCode
app.get('/payment/orders/:orderCode', (req, res) => {
    try {
        const { orderCode } = req.params;
        const order = getOrder(orderCode);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin
// Trang Admin quản lý đơn hàng
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (req, res) => {
    res.send('PayOS Backend with Database is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
