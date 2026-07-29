const paymentService = require('../services/paymentService');
const { createClient } = require('@libsql/client');

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const paymentController = {
    async createPayment(req, res) {
        try {
            const { saleId, method, bank } = req.body;

            const saleResult = await db.execute({
                sql: "SELECT * FROM sales WHERE sale_id = ?",
                args: [saleId]
            });

            const sale = saleResult.rows[0];
            if (!sale) return res.status(404).json({ error: "Transaksi tidak ditemukan" });

            let paymentData;
            if (method === 'qris') {
                paymentData = await paymentService.createQrisTransaction(
                    sale.sale_id,
                    sale.total_amount,
                    { name: sale.customer_name }
                );
            } else {
                paymentData = await paymentService.createVirtualAccountTransaction(
                    sale.sale_id,
                    sale.total_amount,
                    bank || 'BCA'
                );
            }

            await db.execute({
                sql: "UPDATE sales SET payment_status = 'Pending' WHERE sale_id = ?",
                args: [saleId]
            });

            res.status(200).json(paymentData);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async handleWebhook(req, res) {
        try {
            const payload = req.body;
            const signature = req.headers['x-callback-signature'];

            if (!paymentService.verifyWebhookSignature(payload, signature)) {
                return res.status(401).json({ error: "Invalid signature" });
            }

            const { orderId, status } = payload;

            if (status === 'success' || status === 'settlement') {
                const saleResult = await db.execute({
                    sql: "SELECT items FROM sales WHERE sale_id = ?",
                    args: [orderId]
                });

                const sale = saleResult.rows[0];
                if (sale) {
                    const items = JSON.parse(sale.items);
                    
                    for (const item of items) {
                        await db.execute({
                            sql: "UPDATE products SET stock = stock - ? WHERE id = ?",
                            args: [item.qty, item.product_id]
                        });
                    }

                    await db.execute({
                        sql: "UPDATE sales SET payment_status = 'Paid' WHERE sale_id = ?",
                        args: [orderId]
                    });
                }
            }

            res.status(200).json({ received: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    async getStatus(req, res) {
        try {
            const { saleId } = req.params;
            const result = await db.execute({
                sql: "SELECT payment_status FROM sales WHERE sale_id = ?",
                args: [saleId]
            });

            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Data tidak ditemukan" });
            }

            res.status(200).json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = paymentController;