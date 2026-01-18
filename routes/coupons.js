const express = require('express');
const { getCoupons, getCoupon, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', adminAuth, getCoupons);
router.get('/:id', adminAuth, getCoupon);
router.post('/', adminAuth, createCoupon);
router.put('/:id', adminAuth, updateCoupon);
router.delete('/:id', adminAuth, deleteCoupon);

module.exports = router;
