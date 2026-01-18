const Coupon = require('../models/Coupon');

exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.findAll();
  res.json(coupons);
};

exports.createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json(coupon);
};
