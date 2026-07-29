const { tursoClient } = require('../config/database');

const getTenantId = (req) => req.headers['x-tenant-id'] || 'default_tenant';

exports.getAllProducts = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search ? `%${req.query.search}%` : '%';

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM products WHERE tenant_id = ? AND (name LIKE ? OR sku LIKE ?) LIMIT ? OFFSET ?',
            args: [tenantId, search, search, limit, offset]
        });

        const countResult = await tursoClient.execute({
            sql: 'SELECT COUNT(*) as total FROM products WHERE tenant_id = ? AND (name LIKE ? OR sku LIKE ?)',
            args: [tenantId, search, search]
        });

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                total: countResult.rows[0].total,
                pages: Math.ceil(countResult.rows[0].total / limit)
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { name, description, price, cost_price, stock, category, sku } = req.body;
        
        const result = await tursoClient.execute({
            sql: `INSERT INTO products (tenant_id, name, description, price, cost_price, stock, category, sku) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [tenantId, name, description, price, cost_price, stock, category, sku]
        });

        res.status(201).json({
            success: true,
            data: { id: Number(result.lastInsertRowid), ...req.body }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { id } = req.params;
        const { name, description, price, cost_price, stock, category, sku } = req.body;

        await tursoClient.execute({
            sql: `UPDATE products SET name = ?, description = ?, price = ?, cost_price = ?, stock = ?, category = ?, sku = ? 
                  WHERE id = ? AND tenant_id = ?`,
            args: [name, description, price, cost_price, stock, category, sku, id, tenantId]
        });

        res.json({ success: true, message: "Produk diperbarui" });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.getAllSales = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const result = await tursoClient.execute({
            sql: 'SELECT * FROM sales WHERE tenant_id = ? ORDER BY sale_date DESC LIMIT ? OFFSET ?',
            args: [tenantId, limit, offset]
        });

        const countResult = await tursoClient.execute({
            sql: 'SELECT COUNT(*) as total FROM sales WHERE tenant_id = ?',
            args: [tenantId]
        });

        const formattedData = result.rows.map(row => ({
            ...row,
            items: JSON.parse(row.items || '[]')
        }));

        res.json({
            success: true,
            data: formattedData,
            pagination: {
                page,
                limit,
                total: countResult.rows[0].total,
                pages: Math.ceil(countResult.rows[0].total / limit)
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.createSale = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const { sale_id, customer_name, items, total_amount, payment_status, sale_date } = req.body;

        const queries = [
            {
                sql: `INSERT INTO sales (tenant_id, sale_id, customer_name, items, total_amount, payment_status, sale_date) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [tenantId, sale_id, customer_name, JSON.stringify(items), total_amount, payment_status, sale_date]
            }
        ];

        items.forEach(item => {
            queries.push({
                sql: 'UPDATE products SET stock = stock - ? WHERE id = ? AND tenant_id = ?',
                args: [item.qty, item.product_id, tenantId]
            });
        });

        await tursoClient.batch(queries, "write");

        res.status(201).json({
            success: true,
            message: "Penjualan berhasil dicatat dan stok diperbarui"
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};

exports.getAllCustomers = async (req, res) => {
    try {
        const tenantId = getTenantId(req);
        const result = await tursoClient.execute({
            sql: 'SELECT * FROM customers WHERE tenant_id = ?',