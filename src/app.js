// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import productRoutes from './routes/products.js';
import saleRoutes from './routes/sales.js';
import customerRoutes from './routes/customers.js';
import purchaseRoutes from './routes/purchases.js'; // Assuming purchase routes will be added
import reportRoutes from './routes/reports.js'; // Assuming report routes will be added

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Turso DB Client
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multi-tenant middleware (example: using subdomain)
app.use((req, res, next) => {
    const tenantId = req.subdomains.length > 0 ? req.subdomains[0] : 'public'; // Default to 'public' if no subdomain
    req.tenantId = tenantId;
    // In a real app, you'd use tenantId to select the correct database or schema
    // For this example, we'll assume a single DB and use tenantId in queries if needed
    console.log(`Tenant ID: ${req.tenantId}`);
    next();
});

// Routes
app.use('/api/products', productRoutes(db));
app.use('/api/sales', saleRoutes(db));
app.use('/api/customers', customerRoutes(db));
app.use('/api/purchases', purchaseRoutes(db)); // Add purchase routes
app.use('/api/reports', reportRoutes(db)); // Add report routes

// Basic Root Route
app.get('/', (req, res) => {
    res.send('Aplikasi Warung Enterprise API is running!');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({
        message: 'Terjadi kesalahan pada server.',
        error: process.env.NODE_ENV === 'development' ? err.message : {},
    });
});

// Initialize DB Schema (run once)
async function initializeSchema() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenantId TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                cost_price REAL NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                category TEXT,
                sku TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenantId TEXT NOT NULL,
                sale_id TEXT NOT NULL UNIQUE,
                customer_name TEXT,
                items TEXT, -- Store as JSON string
                total_amount REAL NOT NULL,
                payment_status TEXT DEFAULT 'Pending', -- e.g., Pending, Paid, Failed
                sale_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenantId TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
         await db.execute(`
            CREATE TABLE IF NOT EXISTS purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenantId TEXT NOT NULL,
                supplier_name TEXT,
                items TEXT, -- Store as JSON string
                total_cost REAL NOT NULL,
                purchase_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database schema initialized successfully.');
    } catch (error) {
        console.error('Error initializing database schema:', error);
        process.exit(1); // Exit if schema initialization fails
    }
}

// Start server after schema initialization
initializeSchema().then(() => {
    app.listen(port, () => {
        console.log(`Aplikasi Warung Enterprise berjalan di http://localhost:${port}`);
    });
});

export default app;