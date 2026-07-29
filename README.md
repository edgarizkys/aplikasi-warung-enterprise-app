# Aplikasi Warung Enterprise

Sistem POS Enterprise untuk manajemen warung modern. Efisien, cepat, skala besar.

## Fitur Utama
- **Manajemen Stok**: Pantau stok, SKU, dan kategori produk.
- **Penjualan**: Kasir digital dengan status pembayaran.
- **Pelanggan**: Database loyalitas pelanggan.
- **Laporan**: Analisis penjualan harian dan bulanan.
- **Barcode**: Support integrasi scanner barcode.
- **Supplier**: Pencatatan pembelian barang ke supplier.

## Stack Teknologi
- **Backend**: Express.js (Node.js)
- **Database**: Turso SQLite (LibSQL)
- **Frontend**: Tailwind CSS
- **Template Engine**: EJS / HTML
- **Deployment**: Edge Ready

## Persyaratan Sistem
- Node.js v18 atau lebih baru
- Akun Turso (untuk database cloud) atau SQLite lokal

## Instalasi

1. Clone repositori:
```bash
git clone https://github.com/username/warung-enterprise.git
cd warung-enterprise
```

2. Instal dependensi:
```bash
npm install
```

3. Konfigurasi Environment:
Buat file `.env` di root folder:
```env
PORT=3000
TURSO_URL=libsql://your-db-name.turso.io
TURSO_TOKEN=your-auth-token
NODE_ENV=production
```

4. Jalankan Migrasi Database:
```bash
npm run migrate
```

5. Jalankan Aplikasi:
```bash
npm start
```

## Struktur Data (Entitas)

### Produk (Products)
- `name`: Nama Produk
- `description`: Deskripsi
- `price`: Harga Jual
- `cost_price`: Harga Beli
- `stock`: Jumlah Stok
- `category`: Kategori
- `sku`: Kode SKU

### Penjualan (Sales)
- `sale_id`: ID Transaksi
- `customer_name`: Nama Pembeli
- `items`: JSON list barang
- `total_amount`: Total Bayar
- `payment_status`: Status (Paid/Unpaid)
- `sale_date`: Tanggal Transaksi

### Pelanggan (Customers)
- `name`: Nama Pelanggan
- `phone`: Nomor Telepon
- `address`: Alamat

## API Endpoints (Ringkasan)
- `GET /api/products` - List semua produk (Pagination)
- `POST /api/sales` - Input transaksi baru
- `GET /api/reports/daily` - Laporan harian
- `PUT /api/products/:id` - Update stok/harga

## Keamanan & Performa
- Proteksi SQL Injection via LibSQL parameterized queries.
- Middleware Error Handling global.
- Pagination pada setiap list entitas untuk performa data besar.
- Multi-tenant ready architecture.

## Lisensi
Proprietary - Warung Enterprise Solution.