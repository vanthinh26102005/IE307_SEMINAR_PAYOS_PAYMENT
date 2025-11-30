const PayOS = require('@payos/node');
console.log('Type of PayOS:', typeof PayOS);
console.log('PayOS exports:', PayOS);

try {
    const payos = new PayOS('client', 'api', 'check');
    console.log('payos instance:', payos);
    console.log('payos keys:', Object.keys(payos));
    console.log('payos prototype:', Object.getPrototypeOf(payos));
} catch (e) {
    console.log('Error initializing PayOS:', e.message);
}
