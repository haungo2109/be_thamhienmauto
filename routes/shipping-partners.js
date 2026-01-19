const express = require('express');
const { getShippingPartners, getShippingPartner, createShippingPartner, updateShippingPartner, deleteShippingPartner } = require('../controllers/shippingPartnerController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', auth, getShippingPartners);
router.get('/:id', auth, getShippingPartner);
router.post('/', adminAuth, createShippingPartner);
router.put('/:id', adminAuth, updateShippingPartner);
router.delete('/:id', adminAuth, deleteShippingPartner);

module.exports = router;
