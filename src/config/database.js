// config/database.js
const { createClient } = require('@libsql/client');

const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL || 'libsql://localhost:8080', // Default to local for development
    authToken: process.env.TURSO_AUTH_TOKEN || ''
});

async function initializeDatabase() {
    try {
        // Products table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                cost_price REAL NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                category TEXT,
                sku TEXT UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Sales table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                sale_id TEXT UNIQUE NOT NULL,
                customer_name TEXT,
                items TEXT NOT NULL, -- JSON string of items sold
                total_amount REAL NOT NULL,
                payment_status TEXT DEFAULT 'Pending', -- e.g., Pending, Paid, Failed
                sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Customers table
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                name TEXT NOT NULL,
                phone TEXT UNIQUE,
                address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Suppliers table (for Pencatatan Pembelian)
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                name TEXT NOT NULL,
                contact_person TEXT,
                phone TEXT,
                address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Purchases table (for Pencatatan Pembelian)
        await tursoClient.execute(`
            CREATE TABLE IF NOT EXISTS purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT DEFAULT 'default',
                purchase_id TEXT UNIQUE NOT NULL,
                supplier_id INTEGER NOT NULL,
                items TEXT NOT NULL, -- JSON string of items purchased
                total_amount REAL NOT NULL,
                purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )
        `);

        console.log('[DB] Tables initialized successfully.');
    } catch (e) {
        console.error('Database initialization error:', e.message);
        // Exit process if DB fails to initialize critically
        // process.exit(1); 
    }
}

module.exports = { tursoClient, initializeDatabase };