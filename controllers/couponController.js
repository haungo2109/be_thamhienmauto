const Coupon = require('../models/Coupon');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');
const { Op } = require('sequelize');

const createCouponSchema = Joi.object({
  code: Joi.string().min(1).max(50).required(),
  discount_type: Joi.string().valid('fixed_cart', 'percent', 'free_ship').required(),
  amount: Joi.number().positive().required(),
  max_discount: Joi.number().min(0),
  min_spend: Joi.number().min(0),
  usage_limit: Joi.number().integer().min(0),
  expiry_date: Joi.date().allow(null),
  isActive: Joi.boolean(),
  is_show_banner: Joi.boolean()
});

const updateCouponSchema = Joi.object({
  code: Joi.string().min(1).max(50),
  discount_type: Joi.string().valid('fixed_cart', 'percent', 'free_ship'),
  amount: Joi.number().positive(),
  max_discount: Joi.number().min(0),
  min_spend: Joi.number().min(0),
  usage_limit: Joi.number().integer().min(0),
  expiry_date: Joi.date().allow(null),
  isActive: Joi.boolean(),
  is_show_banner: Joi.boolean()
});

exports.getCoupons = async (req, res) => {
  try {
    const { status, type, q } = req.query;
    let where = {};

    if (q) {
      where.code = { [Op.iLike]: `%${q}%` };
    }

    if (type) {
      where.discount_type = type;
    }

    if (status) {
      const now = new Date();
      if (status === 'active') {
        where.isActive = true;
        where[Op.or] = [
          { expiry_date: { [Op.is]: null } },
          { expiry_date: { [Op.gte]: now } }
        ];
      } else if (status === 'inactive') {
        where.isActive = false;
      } else if (status === 'expired') {
        where.expiry_date = { [Op.lt]: now };
      }
    }

    const result = await paginate(Coupon, { 
      req, 
      where,
      order: [['created_at', 'DESC']]
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { error } = createCouponSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { error } = updateCouponSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

    await coupon.update(req.body);
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

    await coupon.destroy();
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ where: { code } });

    if (!coupon) {
      return res.status(404).json({ error: 'Mã giảm giá không tồn tại' });
    }

    // Kiểm tra ngày hết hạn
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' });
    }

    // Kiểm tra giới hạn sử dụng
    if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    // Kiểm tra mức chi tiêu tối thiểu
    if (coupon.min_spend > 0 && cartTotal < parseFloat(coupon.min_spend)) {
      return res.status(400).json({ 
        error: `Mã này chỉ áp dụng cho đơn hàng từ ${parseFloat(coupon.min_spend).toLocaleString('vi-VN')}đ trở lên` 
      });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'fixed_cart') {
      discountAmount = parseFloat(coupon.amount);
    } else if (coupon.discount_type === 'percent') {
      discountAmount = (cartTotal * parseFloat(coupon.amount)) / 100;
    } else if (coupon.discount_type === 'free_ship') {
      // Logic free ship thường được xử lý ở phí vận chuyển, 
      // ở đây trả về 0 hoặc đánh dấu là free_ship
      discountAmount = 0; 
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        amount: parseFloat(coupon.amount),
        discount_amount: discountAmount
      }
    });

  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};
