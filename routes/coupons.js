const express = require('express');
const { getCoupons, getCoupon, createCoupon, updateCoupon, deleteCoupon, applyCoupon } = require('../controllers/couponController');
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/apply', auth, applyCoupon);
router.get('/', getCoupons);
router.get('/:id', adminAuth, getCoupon);
router.post('/', adminAuth, createCoupon);
router.put('/:id', adminAuth, updateCoupon);
router.delete('/:id', adminAuth, deleteCoupon);

module.exports = router;
