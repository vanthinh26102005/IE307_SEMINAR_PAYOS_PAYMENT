// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PayOS } = require('@payos/node');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// Default route for checking server status
app.get('/', (req, res) => {
    res.send('PayOS Backend is running');
});

// Initialize PayOS
const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

console.log('PayOS instance initialized:', payos);

app.post('/create-payment-link', async (req, res) => {
    try {
        const { amount, orderCode, description, returnUrl, cancelUrl } = req.body;

        if (!amount || !orderCode || !description || !returnUrl || !cancelUrl) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const paymentData = {
            orderCode: Number(orderCode),
            amount: Number(amount),
            description: description,
            cancelUrl: cancelUrl,
            returnUrl: returnUrl
        };

        const paymentLink = await payos.paymentRequests.create(paymentData);
        res.json(paymentLink);
    } catch (error) {
        console.error('Error creating payment link:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to create payment link',
            details: error.response?.data || error.message 
        });
    }
});

// Optional: Webhook for PayOS to send payment status updates
// You would typically have a secure endpoint here to verify the webhook signature
// For a simple demo, we'll just log it.
app.post('/payos-webhook', (req, res) => {
    console.log('PayOS Webhook received:', req.body);
    // TODO: Implement webhook signature verification and update order status in your DB
    res.status(200).send('Webhook received');
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
