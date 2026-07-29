const { createClient } = require('@libsql/client');
const request = require('supertest');
const express = require('express');

// Mock DB
const db = {
  execute: jest.fn()
};

const app = express();
app.use(express.json());

// Routes for test
app.post('/api/products', async (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || price < 0) return res.status(400).json({ error: 'Data tidak valid' });
  await db.execute({
    sql: 'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)',
    args: [name, price, stock]
  });
  res.status(201).json({ success: true });
});

app.post('/api/sales', async (req, res) => {
  const { items, total_amount } = req.body;
  for (const item of items) {
    const product = await db.execute({
      sql: 'SELECT stock FROM products WHERE id = ?',
      args: [item.product_id]
    });
    if (product.rows[0].stock < item.qty) {
      return res.status(400).json({ error: 'Stok tidak cukup' });
    }
    await db.execute({
      sql: 'UPDATE products SET stock = stock - ? WHERE id = ?',
      args: [item.qty, item.product_id]
    });
  }
  res.status(201).json({ success: true });
});

describe('Unit Test Warung Enterprise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Tambah produk baru sukses', async () => {
    db.execute.mockResolvedValue({ rowsAffected: 1 });
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Kopi Bubuk', price: 15000, stock: 50 });
    
    expect(res.statusCode).toBe(201);
    expect(db.execute).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining('INSERT INTO products')
    }));
  });

  test('Tambah produk gagal jika harga negatif', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ name: 'Kopi Error', price: -100, stock: 10 });
    
    expect(res.statusCode).toBe(400);
  });

  test('Penjualan kurangi stok produk', async () => {
    db.execute
      .mockResolvedValueOnce({ rows: [{ stock: 50 }] }) // Cek stok
      .mockResolvedValueOnce({ rowsAffected: 1 });    // Update stok

    const res = await request(app)
      .post('/api/sales')
      .send({
        items: [{ product_id: 1, qty: 5 }],
        total_amount: 75000
      });

    expect(res.statusCode).toBe(201);
    expect(db.execute).toHaveBeenCalledWith(expect.objectContaining({
      sql: expect.stringContaining('UPDATE products SET stock = stock - ?')
    }));
  });

  test('Penjualan gagal jika stok kurang', async () => {
    db.execute.mockResolvedValueOnce({ rows: [{ stock: 2 }] });

    const res = await request(app)
      .post('/api/sales')
      .send({
        items: [{ product_id: 1, qty: 10 }],
        total_amount: 150000
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Stok tidak cukup');
  });

  test('Validasi data pelanggan', async () => {
    const validateCustomer = (c) => c.name && c.phone.length >= 10;
    
    const valid = validateCustomer({ name: 'Budi', phone: '081234567890' });
    const invalid = validateCustomer({ name: 'Siti', phone: '123' });

    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });
});