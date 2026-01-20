const express = require('express');
const { getOrders, getMyOrders, getOrder, createOrder, updateOrder, deleteOrder } = require('../controllers/orderController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', adminAuth, getOrders);
router.get('/me', auth, getMyOrders);
router.get('/:id', auth, getOrder);
router.post('/', auth, createOrder);
router.put('/:id', auth, updateOrder);
router.delete('/:id', auth, deleteOrder);

module.exports = router;
