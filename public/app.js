require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;

// Turso DB Client
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multi-tenant middleware
app.use((req, res, next) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
        return res.status(400).json({ message: 'Header "x-tenant-id" wajib.' });
    }
    req.tenantId = tenantId;
    next();
});

// Database Initialization
async function initDb() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                cost_price REAL NOT NULL,
                stock INTEGER NOT NULL,
                category TEXT,
                sku TEXT UNIQUE NOT NULL
            );
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                sale_id TEXT UNIQUE NOT NULL,
                customer_name TEXT,
                items TEXT NOT NULL, -- JSON string
                total_amount REAL NOT NULL,
                payment_status TEXT NOT NULL,
                sale_date TEXT NOT NULL
            );
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT,
                address TEXT
            );
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT NOT NULL,
                purchase_id TEXT UNIQUE NOT NULL,
                supplier_name TEXT,
                items TEXT NOT NULL, -- JSON string
                total_amount REAL NOT NULL,
                purchase_date TEXT NOT NULL,
                payment_status TEXT NOT NULL
            );
        `);
        console.log('Tabel database siap.');
    } catch (e) {
        console.error('Gagal inisialisasi database:', e);
        process.exit(1); // Keluar jika DB gagal
    }
}

// Helper for pagination
const getPagination = (req) => {
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || 10;
    const offset = (page - 1) * limit;
    return { limit, offset };
};

// --- Routes ---

// Products
app.get('/api/products', async (req, res) => {
    const { limit, offset } = getPagination(req);
    const { tenantId } = req;
    try {
        const result = await db.execute({
            sql: `SELECT * FROM products WHERE tenant_id = ? LIMIT ? OFFSET ?`,
            args: [tenantId, limit, offset]
        });
        const countResult = await db.execute({
            sql: `SELECT COUNT(*) as count FROM products WHERE tenant_id = ?`,
            args: [tenantId]
        });
        res.header('X-Total-Count', countResult.rows[0].count);
        res.json(result.rows);
    } catch (e) {
        console.error('Produk gagal ambil:', e);
        res.status(500).json({ message: 'Produk gagal ambil.', error: e.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { tenantId } = req;
    try {
        const result = await db.execute({
            sql: `SELECT * FROM products WHERE id = ? AND tenant_id = ?`,
            args: [id, tenantId]
        });
        if (result.rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
        res.json(result.rows[0]);
    } catch (e) {
        console.error('Produk gagal ambil:', e);
        res.status(500).json({ message: 'Produk gagal ambil.', error: e.message });
    }
});

app.post('/api/products', async (req, res) => {
    const { name, description, price, cost_price, stock, category, sku } = req.body;
    const { tenantId } = req;
    if (!name || !price || !cost_price || stock === undefined || !sku) {
        return res.status(400).json({ message: 'Nama, harga jual, harga beli, stok, dan SKU wajib.' });
    }
    try {
        const result = await db.execute({
            sql: `INSERT INTO products (tenant_id, name, description, price, cost_price, stock, category, sku) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, name, description, price, cost_price, stock, category, sku]
        });
        res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    } catch (e) {
        console.error('Produk gagal tambah:', e);
        res.status(500).json({ message: 'Produk gagal tambah.', error: e.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, cost_price, stock, category, sku } = req.body;
    const { tenantId } = req;
    if (!name || !price || !cost_price || stock === undefined || !sku) {
        return res.status(400).json({ message: 'Nama, harga jual, harga beli, stok, dan SKU wajib.' });
    }
    try {
        const result = await db.execute({
            sql: `UPDATE products SET name = ?, description = ?, price = ?, cost_price = ?, stock = ?, category = ?, sku = ? WHERE id = ? AND tenant_id = ?`,
            args: [name, description, price, cost_price, stock, category, sku, id, tenantId]
        });
        if (result.rowsAffected === 0) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
        res.json({ id, ...req.body });
    } catch (e) {
        console.error('Produk gagal update:', e);
        res.status(500).json({ message: 'Produk gagal update.', error: e.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { tenantId } = req;
    try {
        const result = await db.execute({
            sql: `DELETE FROM products WHERE id = ? AND tenant_id = ?`,
            args: [id, tenantId]
        });
        if (result.rowsAffected === 0) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
        res.status(204).send();
    } catch (e) {
        console.error('Produk gagal hapus:', e);
        res.status(500).json({ message: 'Produk gagal hapus.', error: e.message });
    }
});

// Sales
app.get('/api/sales', async (req, res) => {
    const { limit, offset } = getPagination(req);
    const { tenantId } = req;
    try {
        const result = await db.execute({
            sql: `SELECT * FROM sales WHERE tenant_id = ? LIMIT ? OFFSET ?`,
            args: [tenantId, limit, offset]
        });
        const countResult = await db.execute({
            sql: `SELECT COUNT(*) as count FROM sales WHERE tenant_id = ?`,
            args: [tenantId]
        });
        res.header('X-Total-Count', countResult.rows[0].count);
        res.json(result.rows.map(row => ({ ...row, items: JSON.parse(row.items) })));
    } catch (e) {
        console.error('Penjualan gagal ambil:', e);
        res.status(500).json({ message: 'Penjualan gagal ambil.', error: e.message });
    }
});

app.get('/api/sales/:id', async (req, res) => {
    const { id } = req.params;
    const { tenantId } = req;
    try {
        const result = await db.execute({
            sql: `SELECT * FROM sales WHERE id = ? AND tenant_id = ?`,
            args: [id, tenantId]
        });
        if (result.rows.length === 0) return res.status(404).json({ message: 'Penjualan tidak ditemukan.' });
        const sale = { ...result.rows[0], items: JSON.parse(result.rows[0].items) };
        res.json(sale);
    } catch (e) {
        console.error('Penjualan gagal ambil:', e);
        res.status(500).json({ message: 'Penjualan gagal ambil.', error: e.message });
    }
});

app.post('/api/sales', async (req, res) => {
    const { sale_id, customer_name, items, total_amount, payment_status, sale_date } = req.body;
    const { tenantId } = req;
    if (!sale_id || !items || !total_amount || !payment_status || !sale_date) {
        return res.status(400).json({ message: 'ID Penjualan, item, total harga, status pembayaran, dan tanggal wajib.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Item penjualan harus array tidak kosong.' });
    }

    try {
        // Check and decrement stock
        for (const item of items) {
            const productResult = await db.execute({
                sql: `SELECT id, stock FROM products WHERE id = ? AND tenant_id = ?`,
                args: [item.product_id, tenantId]
            });
            if (productResult.rows.length === 0) {
                return res.status(404).json({ message: `Produk dengan ID ${item.product_id} tidak ditemukan.` });
            }
            const currentStock = productResult.rows[0].stock;
            if (currentStock < item.qty) {
                return res.status(400).json({ message: `Stok tidak cukup untuk produk: ${item.product_name}. Stok tersedia: ${currentStock}, diminta: ${item.qty}.` });
            }
        }

        // All stock checks passed, proceed with sale and stock decrement
        await db.execute('BEGIN');
        for (const item of items) {
            await db.execute({
                sql: `UPDATE products SET stock = stock - ? WHERE id = ? AND tenant_id = ?`,
                args: [item.qty, item.product_id, tenantId]
            });