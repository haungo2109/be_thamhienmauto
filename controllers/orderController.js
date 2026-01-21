const Order = require('../models/Order');
const User = require('../models/User');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const CartItem = require('../models/CartItem');
const Coupon = require('../models/Coupon');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const createOrderSchema = Joi.object({
  cart_item_ids: Joi.array().items(Joi.number().integer()).min(1).required(),
  coupon_code: Joi.string().allow('', null),
  shipping_name: Joi.string().min(1).max(255).required(),
  shipping_address: Joi.string().min(1).required(),
  shipping_phone: Joi.string().min(1).max(20).required(),
  shipping_email: Joi.string().email().allow('', null),
  note: Joi.string().allow('', null),
  payment_method_id: Joi.string().min(1).max(50).required(),
  shipping_partner_id: Joi.number().integer().allow(null)
});

const updateOrderSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled', 'refunded'),
  total_amount: Joi.number().positive(),
  discount_amount: Joi.number().min(0),
  shipping_name: Joi.string().min(1).max(255),
  shipping_address: Joi.string().min(1),
  shipping_phone: Joi.string().min(1).max(20),
  shipping_email: Joi.string().email(),
  note: Joi.string(),
  payment_method_id: Joi.string().min(1).max(50), // New field validation, optional for updates
  shipping_partner_id: Joi.number().integer() // Optional field
});

exports.getOrders = async (req, res) => {
  try {
    const { status, q } = req.query;
    let where = {};
    
    if (status) {
      where.status = status;
    }

    if (q) {
      where[Op.or] = [
        { order_number: { [Op.iLike]: `%${q}%` } },
        { shipping_name: { [Op.iLike]: `%${q}%` } },
        { shipping_phone: { [Op.iLike]: `%${q}%` } },
        { '$User.name$': { [Op.iLike]: `%${q}%` } },
        { '$User.phone$': { [Op.iLike]: `%${q}%` } }
      ];
    }

    const result = await paginate(Order, {
      req,
      where,
      include: [
        { 
          model: OrderItem, 
          as: 'OrderItems', 
          include: [{ model: Product, as: 'Product' }] 
        },
        { 
          model: User, 
          as: 'User', 
          attributes: ['id', 'email', 'name', 'phone'] 
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let where = { user_id: req.user.id };
    
    if (status) {
      where.status = status;
    }

    const result = await paginate(Order, {
      req,
      where,
      include: [
        { 
          model: OrderItem, 
          as: 'OrderItems', 
          include: [{ model: Product, as: 'Product' }] 
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email'] },
        { model: OrderItem, as: 'OrderItems', include: [{ model: Product, as: 'Product' }] }
      ]
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { error } = createOrderSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { 
      cart_item_ids,
      coupon_code, 
      shipping_name, 
      shipping_address, 
      shipping_phone, 
      shipping_email, 
      note, 
      payment_method_id,
      shipping_partner_id 
    } = req.body;

    // 1. Lấy các sản phẩm được chọn trong giỏ hàng
    const cartItems = await CartItem.findAll({
      where: { 
        id: cart_item_ids,
        user_id: req.user.id 
      },
      include: [
        { model: Product, as: 'Product' },
        { 
          model: ProductVariant, 
          as: 'ProductVariant',
          include: [{ model: VariantOption, as: 'VariantOptions' }]
        }
      ]
    });

    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Không tìm thấy sản phẩm hợp lệ trong giỏ hàng' });
    }

    if (cartItems.length !== cart_item_ids.length) {
      await t.rollback();
      return res.status(400).json({ error: 'Một số sản phẩm không còn tồn tại trong giỏ hàng' });
    }

    // 2. Tính toán tổng tiền từ backend (không tin tưởng frontend)
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      let unitPrice = 0;
      let productName = item.Product.name;

      if (item.ProductVariant) {
        unitPrice = parseFloat(item.ProductVariant.price);
        // Ghép tên các option vào tên sản phẩm (VD: Áo thun - Đỏ, L)
        const options = item.ProductVariant.VariantOptions.map(o => o.attribute_value).join(', ');
        if (options) productName += ` - ${options}`;
      } else {
        unitPrice = parseFloat(item.Product.sale_price || item.Product.price);
      }

      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        product_id: item.product_id,
        product_name: productName,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: itemSubtotal
      });
    }

    // 3. Kiểm tra mã giảm giá (nếu có)
    let discountAmount = 0;
    let validatedCoupon = null;

    if (coupon_code) {
      validatedCoupon = await Coupon.findOne({ where: { code: coupon_code } });
      
      if (!validatedCoupon) {
        await t.rollback();
        return res.status(400).json({ error: 'Mã giảm giá không hợp lệ' });
      }

      // Kiểm tra hết hạn
      if (validatedCoupon.expiry_date && new Date(validatedCoupon.expiry_date) < new Date()) {
        await t.rollback();
        return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' });
      }

      // Kiểm tra giới hạn sử dụng
      if (validatedCoupon.usage_limit > 0 && validatedCoupon.usage_count >= validatedCoupon.usage_limit) {
        await t.rollback();
        return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng' });
      }

      // Kiểm tra mức chi tiêu tối thiểu
      if (validatedCoupon.min_spend > 0 && subtotal < parseFloat(validatedCoupon.min_spend)) {
        await t.rollback();
        return res.status(400).json({ error: `Đơn hàng tối thiểu ${validatedCoupon.min_spend}đ để dùng mã này` });
      }

      // Tính số tiền giảm
      if (validatedCoupon.discount_type === 'fixed_cart') {
        discountAmount = parseFloat(validatedCoupon.amount);
      } else if (validatedCoupon.discount_type === 'percent') {
        discountAmount = (subtotal * parseFloat(validatedCoupon.amount)) / 100;
      }
      
      // Đảm bảo tiền giảm không vượt quá tổng tiền
      if (discountAmount > subtotal) discountAmount = subtotal;
    }

    const totalAmount = subtotal - discountAmount;

    // 4. Tạo đơn hàng
    const orderNumber = 'ORD-' + Date.now() + Math.floor(Math.random() * 1000);
    const order = await Order.create({
      user_id: req.user.id,
      order_number: orderNumber,
      total_amount: totalAmount,
      coupon_code: validatedCoupon ? validatedCoupon.code : null,
      discount_amount: discountAmount,
      shipping_name,
      shipping_address,
      shipping_phone,
      shipping_email,
      note,
      payment_method_id,
      shipping_partner_id,
      status: 'pending'
    }, { transaction: t });

    // 5. Tạo các chi tiết đơn hàng
    const orderItems = orderItemsData.map(item => ({
      ...item,
      order_id: order.id
    }));
    await OrderItem.bulkCreate(orderItems, { transaction: t });

    // 6. Cập nhật lượt dùng mã giảm giá
    if (validatedCoupon) {
      await validatedCoupon.increment('usage_count', { transaction: t });
    }

    // 7. Xóa các mục đã đặt khỏi giỏ hàng
    await CartItem.destroy({
      where: { 
        id: cart_item_ids,
        user_id: req.user.id 
      },
      transaction: t
    });

    await t.commit();
    res.status(201).json(order);

  } catch (error) {
    await t.rollback();
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { error } = updateOrderSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Chỉ admin hoặc user sở hữu có thể update, nhưng user chỉ update shipping info nếu pending
    if (req.user.role !== 'admin') {
      if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      if (order.status !== 'pending') return res.status(400).json({ error: 'Cannot update order' });
      // User chỉ update shipping info
      const allowedFields = ['shipping_name', 'shipping_address', 'shipping_phone', 'shipping_email', 'note'];
      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      });
      await order.update(updateData);
    } else {
      await order.update(req.body);
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role !== 'admin' && order.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete order' });
    }

    await order.destroy();
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
