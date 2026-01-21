const express = require('express');
const { 
  getPaymentMethods, 
  getPaymentMethod, 
  createPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod 
} = require('../controllers/paymentMethodController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

// Public/Authenticated can get list
router.get('/', getPaymentMethods);

// Admin only for management
router.get('/:id', adminAuth, getPaymentMethod);
router.post('/', adminAuth, createPaymentMethod);
router.put('/:id', adminAuth, updatePaymentMethod);
router.delete('/:id', adminAuth, deletePaymentMethod);

module.exports = router;
