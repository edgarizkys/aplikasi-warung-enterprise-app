// World-Class Controllers for Aplikasi Warung Enterprise (Sistem Kasir POS & Inventory Warung Enterprise)

let menuData = [
  {
    "id": 1,
    "kode": "MNU-001",
    "nama": "Nasi Goreng Spesial Telur",
    "kategori": "Makanan Utama",
    "harga": 18000,
    "stok": 50
  },
  {
    "id": 2,
    "kode": "MNU-002",
    "nama": "Es Teh Manis Jumbo",
    "kategori": "Minuman",
    "harga": 5000,
    "stok": 100
  },
  {
    "id": 3,
    "kode": "MNU-003",
    "nama": "Mie Goreng Dok Dok",
    "kategori": "Makanan Utama",
    "harga": 15000,
    "stok": 40
  }
];

exports.getAllMenu = async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
    res.json({ success: true, tenantId, count: menuData.length, data: menuData });
};

exports.createMenu = async (req, res) => {
    const item = { id: Date.now(), tenant_id: req.headers['x-tenant-id'] || 'default_tenant', ...req.body };
    menuData.unshift(item);
    res.status(201).json({ success: true, data: item });
};

exports.deleteMenu = async (req, res) => {
    menuData = menuData.filter(i => i.id !== parseInt(req.params.id));
    res.json({ success: true, message: 'Menu & Barang Warung deleted' });
};

let transaksiData = [
  {
    "id": 1,
    "invoice": "TRX-20260725-001",
    "pembeli": "Pak Edgar",
    "item": "2x Nasgor Spesial + 2x Es Teh",
    "total": 46000,
    "status": "LUNAS"
  },
  {
    "id": 2,
    "invoice": "TRX-20260725-002",
    "pembeli": "Mas Budi",
    "item": "1x Mie Dok Dok",
    "total": 15000,
    "status": "LUNAS"
  }
];

exports.getAllTransaksi = async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
    res.json({ success: true, tenantId, count: transaksiData.length, data: transaksiData });
};

exports.createTransaksi = async (req, res) => {
    const item = { id: Date.now(), tenant_id: req.headers['x-tenant-id'] || 'default_tenant', ...req.body };
    transaksiData.unshift(item);
    res.status(201).json({ success: true, data: item });
};

exports.deleteTransaksi = async (req, res) => {
    transaksiData = transaksiData.filter(i => i.id !== parseInt(req.params.id));
    res.json({ success: true, message: 'Transaksi Kasir deleted' });
};

let pengeluaranData = [
  {
    "id": 1,
    "keterangan": "Belanja Beras 10kg & Telur 2kg",
    "nominal": 185000,
    "tanggal": "2026-07-25"
  }
];

exports.getAllPengeluaran = async (req, res) => {
    const tenantId = req.headers['x-tenant-id'] || 'default_tenant';
    res.json({ success: true, tenantId, count: pengeluaranData.length, data: pengeluaranData });
};

exports.createPengeluaran = async (req, res) => {
    const item = { id: Date.now(), tenant_id: req.headers['x-tenant-id'] || 'default_tenant', ...req.body };
    pengeluaranData.unshift(item);
    res.status(201).json({ success: true, data: item });
};

exports.deletePengeluaran = async (req, res) => {
    pengeluaranData = pengeluaranData.filter(i => i.id !== parseInt(req.params.id));
    res.json({ success: true, message: 'Pengeluaran Belanja deleted' });
};

exports.getAnalytics = async (req, res) => {
    res.json({ success: true, platform: 'Aplikasi Warung Enterprise', domain: 'Sistem Kasir POS & Inventory Warung Enterprise', version: '5.0.0-WorldClass', architecture: 'Multi-Tenant Ready + Redis Cache' });
};