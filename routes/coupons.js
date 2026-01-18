const express = require('express');
const { getCoupons, createCoupon } = require('../controllers/couponController');
const router = express.Router();

router.get('/', getCoupons);
router.post('/', createCoupon);

module.exports = router;
