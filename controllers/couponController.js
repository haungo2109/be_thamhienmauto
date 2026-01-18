const Coupon = require('../models/Coupon');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const couponSchema = Joi.object({
  code: Joi.string().min(1).max(50).required(),
  discount_type: Joi.string().valid('fixed_cart', 'percent').required(),
  amount: Joi.number().positive().required(),
  min_spend: Joi.number().min(0),
  usage_limit: Joi.number().integer().min(0),
  expiry_date: Joi.date()
});

exports.getCoupons = async (req, res) => {
  try {
    const result = await paginate(Coupon, { req });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { error } = couponSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { error } = couponSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

    await coupon.update(req.body);
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

    await coupon.destroy();
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
