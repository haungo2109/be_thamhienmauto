const express = require('express');
const { getOrderItems, getOrderItem, createOrderItem, updateOrderItem, deleteOrderItem } = require('../controllers/orderItemController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', auth, getOrderItems);
router.get('/:id', auth, getOrderItem);
router.post('/', adminAuth, createOrderItem);
router.put('/:id', adminAuth, updateOrderItem);
router.delete('/:id', adminAuth, deleteOrderItem);

module.exports = router;
