// api.js
const express = require('express');
const router = express.Router();
const { tursoClient } = require('../config/database');

// Middleware for tenant ID
router.use((req, res, next) => {
    req.tenantId = req.headers['x-tenant-id'] || 'default_tenant';
    next();
});

// --- Products ---

// Get all products with pagination
router.get('/products', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM products WHERE tenant_id = ? LIMIT ? OFFSET ?',
            args: [req.tenantId, parseInt(limit), offset]
        });

        const countResult = await tursoClient.execute({
            sql: 'SELECT COUNT(*) as total FROM products WHERE tenant_id = ?',
            args: [req.tenantId]
        });

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.rows[0].total,
                pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get single product
router.get('/products/:id', async (req, res) => {
    try {
        const result = await tursoClient.execute({
            sql: 'SELECT * FROM products WHERE id = ? AND tenant_id = ?',
            args: [req.params.id, req.tenantId]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create product
router.post('/products', async (req, res) => {
    try {
        const { name, description, price, cost_price, stock, category, sku } = req.body;
        const result = await tursoClient.execute({
            sql: `INSERT INTO products (tenant_id, name, description, price, cost_price, stock, category, sku) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [req.tenantId, name, description, price, cost_price, stock, category, sku]
        });
        res.status(201).json({
            success: true,
            data: { id: Number(result.lastInsertRowid), ...req.body }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update product
router.put('/products/:id', async (req, res) => {
    try {
        const { name, description, price, cost_price, stock, category, sku } = req.body;
        await tursoClient.execute({
            sql: `UPDATE products SET name = ?, description = ?, price = ?, cost_price = ?, stock = ?, category = ?, sku = ? 
                  WHERE id = ? AND tenant_id = ?`,
            args: [name, description, price, cost_price, stock, category, sku, req.params.id, req.tenantId]
        });
        res.json({ success: true, message: 'Produk berhasil diperbarui' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
    try {
        await tursoClient.execute({
            sql: 'DELETE FROM products WHERE id = ? AND tenant_id = ?',
            args: [req.params.id, req.tenantId]
        });
        res.json({ success: true, message: 'Produk berhasil dihapus' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Sales ---

// Get all sales with pagination
router.get('/sales', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM sales WHERE tenant_id = ? LIMIT ? OFFSET ?',
            args: [req.tenantId, parseInt(limit), offset]
        });

        const countResult = await tursoClient.execute({
            sql: 'SELECT COUNT(*) as total FROM sales WHERE tenant_id = ?',
            args: [req.tenantId]
        });

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.rows[0].total,
                pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get single sale
router.get('/sales/:id', async (req, res) => {
    try {
        const result = await tursoClient.execute({
            sql: 'SELECT * FROM sales WHERE id = ? AND tenant_id = ?',
            args: [req.params.id, req.tenantId]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Penjualan tidak ditemukan' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create sale
router.post('/sales', async (req, res) => {
    try {
        const { sale_id, customer_name, items, total_amount, payment_status, sale_date } = req.body;
        
        // Start transaction
        await tursoClient.execute('BEGIN');

        // Create sale record
        const saleResult = await tursoClient.execute({
            sql: `INSERT INTO sales (tenant_id, sale_id, customer_name, items, total_amount, payment_status, sale_date) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [req.tenantId, sale_id, customer_name, JSON.stringify(items), total_amount, payment_status, sale_date]
        });
        const saleId = Number(saleResult.lastInsertRowid);

        // Update stock for each item sold
        for (const item of items) {
            await tursoClient.execute({
                sql: `UPDATE products SET stock = stock - ? 
                      WHERE id = ? AND tenant_id = ?`,
                args: [item.qty, item.product_id, req.tenantId]
            });
        }

        // Commit transaction
        await tursoClient.execute('COMMIT');

        res.status(201).json({
            success: true,
            data: { id: saleId, ...req.body }
        });
    } catch (e) {
        // Rollback transaction on error
        await tursoClient.execute('ROLLBACK');
        res.status(500).json({ error: e.message });
    }
});

// --- Customers ---

// Get all customers with pagination
router.get('/customers', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM customers WHERE tenant_id = ? LIMIT ? OFFSET ?',
            args: [req.tenantId, parseInt(limit), offset]
        });

        const countResult = await tursoClient.execute({
            sql: 'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?',
            args: [req.tenantId]
        });

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.rows[0].total,
                pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get single customer
router.get('/customers/:id', async (req, res) => {
    try {
        const result = await tursoClient.execute({
            sql: 'SELECT * FROM customers WHERE id = ? AND tenant_id = ?',
            args: [req.params.id, req.tenantId]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Create customer
router.post('/customers', async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const result = await tursoClient.execute({
            sql: `INSERT INTO customers (tenant_id, name, phone, address) 
                  VALUES (?, ?, ?, ?)`,
            args: [req.tenantId, name, phone, address]
        });
        res.status(201).json({
            success: true,
            data: { id: Number(result.lastInsertRowid), ...req.body }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update customer
router.put('/customers/:id', async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        await tursoClient.execute({
            sql: `UPDATE customers SET name = ?, phone = ?, address = ? 
                  WHERE id = ? AND tenant_id = ?`,
            args: [name, phone, address, req.params.id, req.tenantId]
        });
        res.json({ success: true, message: 'Pelanggan berhasil diperbarui' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete customer
router.delete('/customers/:id', async (req, res) => {
    try {
        await tursoClient.execute({
            sql: 'DELETE FROM customers WHERE id = ? AND tenant_id = ?',
            args: [req.params.id, req.tenantId]
        });
        res.json({ success: true, message: 'Pelanggan berhasil dihapus' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Reports ---

// Daily Sales Report
router.get('/reports/sales/daily', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Tanggal harus diisi' });
        }

        const result = await tursoClient.execute({
            sql: `SELECT 
                    SUM(total_amount) as total_sales, 
                    COUNT(*) as number_of_sales 
                  FROM sales 
                  WHERE tenant_id = ? AND DATE(sale_date) = ?`,
            args: [req.tenantId, date]
        });

        res.json({
            success: true,
            data: {
                date: date,
                total_sales: result.rows[0].total_sales || 0,
                number_of_sales: result.rows[0].number_of_sales || 0
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Monthly Sales Report
router.get('/reports/sales/monthly', async (req, res) => {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ success: false, message: 'Tahun dan Bulan harus diisi' });
        }

        const result = await tursoClient.execute({
            sql: `SELECT 
                    SUM(total_amount) as total_sales, 
                    COUNT(*) as number_of_sales 
                  FROM sales 
                  WHERE tenant_id = ? AND STRFTIME('%Y-%m', sale_date) = ?`,
            args: [req.tenantId, `${year}-${month.padStart(2, '0')}`]
        });

        res.json({
            success: true,
            data: {
                year: parseInt(year),
                month: parseInt(month),
                total_sales: result.rows[0].total_sales || 0,
                number_of_sales: result.rows[0].number_of_sales || 0
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


module.exports = router;