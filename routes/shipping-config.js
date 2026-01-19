const express = require('express');
const { getShippingConfigs, getShippingConfig, createShippingConfig, updateShippingConfig, deleteShippingConfig } = require('../controllers/shippingConfigController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', auth, getShippingConfigs);
router.get('/:id', auth, getShippingConfig);
router.post('/', adminAuth, createShippingConfig);
router.put('/:id', adminAuth, updateShippingConfig);
router.delete('/:id', adminAuth, deleteShippingConfig);

module.exports = router;
