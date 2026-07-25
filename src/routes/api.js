const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appController');
const payCtrl = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.get('/analytics', auth, ctrl.getAnalytics);
router.post('/payment/qris', auth, payCtrl.createQris);
router.post('/payment/va', auth, payCtrl.createVa);
router.post('/payment/webhook', payCtrl.handleWebhook);

router.get('/menu', auth, ctrl.getAllMenu);
router.post('/menu', auth, ctrl.createMenu);
router.delete('/menu/:id', auth, ctrl.deleteMenu);
router.get('/transaksi', auth, ctrl.getAllTransaksi);
router.post('/transaksi', auth, ctrl.createTransaksi);
router.delete('/transaksi/:id', auth, ctrl.deleteTransaksi);
router.get('/pengeluaran', auth, ctrl.getAllPengeluaran);
router.post('/pengeluaran', auth, ctrl.createPengeluaran);
router.delete('/pengeluaran/:id', auth, ctrl.deletePengeluaran);

module.exports = router;