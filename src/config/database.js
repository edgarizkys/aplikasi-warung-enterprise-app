const { createClient } = require('@libsql/client');

const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL || 'libsql://edgartech-db-edgarizkys.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN || ''
});

async function initializeDatabase() {
    try {
        await tursoClient.execute(`CREATE TABLE IF NOT EXISTS menu (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT DEFAULT 'default', kode TEXT NOT NULL, nama TEXT NOT NULL, kategori TEXT NOT NULL, harga REAL NOT NULL, stok REAL NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        console.log('[DB] Table menu (Multi-Tenant) ready');
        await tursoClient.execute(`CREATE TABLE IF NOT EXISTS transaksi (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT DEFAULT 'default', invoice TEXT NOT NULL, pembeli TEXT NOT NULL, item TEXT NOT NULL, total REAL NOT NULL, status TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        console.log('[DB] Table transaksi (Multi-Tenant) ready');
        await tursoClient.execute(`CREATE TABLE IF NOT EXISTS pengeluaran (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT DEFAULT 'default', keterangan TEXT NOT NULL, nominal REAL NOT NULL, tanggal TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        console.log('[DB] Table pengeluaran (Multi-Tenant) ready');
    } catch(e) { console.log('DB Notice:', e.message); }
}

module.exports = { tursoClient, initializeDatabase };