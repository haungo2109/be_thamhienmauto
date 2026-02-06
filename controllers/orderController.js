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
const VariantOption = require('../models/VariantOption');

const createOrderSchema = Joi.object({
  cart_item_ids: Joi.array().items(Joi.number().integer()).min(1).required(),
  coupon_code: Joi.string().allow('', null),
  shipping_name: Joi.string().min(1).max(255).required(),
  shipping_address: Joi.string().min(1).required(),
  shipping_phone: Joi.string().min(1).max(20).required(),
  shipping_email: Joi.string().email().allow('', null),
  note: Joi.string().allow('', null),
  payment_method_id: Joi.string().min(1).max(50).required(),
  shipping_partner_id: Joi.number().integer().allow(null),
  shipping_fee: Joi.number().min(0).default(0),
  tax_amount: Joi.number().min(0).default(0)
});

const updateOrderSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'shipped', 'completed', 'cancelled', 'returned'),
  total_amount: Joi.number().positive(),
  discount_amount: Joi.number().min(0),
  shipping_name: Joi.string().min(1).max(255),
  shipping_address: Joi.string().min(1),
  shipping_phone: Joi.string().min(1).max(20),
  shipping_email: Joi.string().email(),
  note: Joi.string(),
  payment_method_id: Joi.string().min(1).max(50), 
  shipping_partner_id: Joi.number().integer(),
  tracking_number: Joi.string().allow('', null),
  shipping_fee: Joi.number().min(0),
  tax_amount: Joi.number().min(0)
});

exports.getOrders = async (req, res) => {
  try {
    const { status, q } = req.query;
    let where = {};
    
    if (status) {
      const statusArray = Array.isArray(status) ? status : status.split(',');
      where.status = { [Op.in]: statusArray };
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
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let where = { user_id: req.user.id };
    
    if (status) {
      const statusArray = Array.isArray(status) ? status : status.split(',');
      where.status = { [Op.in]: statusArray };
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
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
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
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
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
      shipping_partner_id,
      shipping_fee = 0,
      tax_amount = 0
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
      let variantId = null;
      let variantName = null;
      let sku = item.Product.sku;
      let thumbnailUrl = item.Product.image_url;

      if (item.ProductVariant) {
        unitPrice = parseFloat(item.ProductVariant.price);
        variantId = item.ProductVariant.id;
        sku = item.ProductVariant.sku || item.Product.sku;
        thumbnailUrl = item.ProductVariant.image_url || item.Product.image_url;
        
        // Ghép tên các option vào variant_name
        const options = item.ProductVariant.VariantOptions
          .filter(o => o.affects_price)
          .map(o => `${o.attribute_name}: ${o.attribute_value}`)
          .join(', ');
        
        variantName = options || null;
      } else {
        unitPrice = parseFloat(item.Product.sale_price || item.Product.price);
      }

      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        product_id: item.product_id,
        product_name: productName,
        variant_id: variantId,
        variant_name: variantName,
        sku: sku,
        thumbnail_url: thumbnailUrl,
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
      
      if (!validatedCoupon || validatedCoupon.isActive === false) {
        await t.rollback();
        return res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã bị vô hiệu hóa' });
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
        // Áp dụng mức giảm tối đa nếu có
        const maxDiscount = parseFloat(validatedCoupon.max_discount);
        if (maxDiscount > 0 && discountAmount > maxDiscount) {
          discountAmount = maxDiscount;
        }
      } else if (validatedCoupon.discount_type === 'free_ship') {
        discountAmount = parseFloat(shipping_fee);
      }
      
      // Đảm bảo tiền giảm không vượt quá tổng tiền hàng + ship
      if (discountAmount > (subtotal + parseFloat(shipping_fee))) discountAmount = subtotal + parseFloat(shipping_fee);
    }

    const totalAmount = subtotal - discountAmount + parseFloat(shipping_fee) + parseFloat(tax_amount);

    // Xác định trạng thái ban đầu dựa trên phương thức thanh toán
    let initialStatus = 'pending';
    if (payment_method_id === 'cod') {
      initialStatus = 'processing';
    } else if (payment_method_id === 'bank_transfer') {
      initialStatus = 'pending';
    }

    // 4. Tạo đơn hàng
    const orderNumber = 'ORD-' + Date.now() + Math.floor(Math.random() * 1000);
    const order = await Order.create({
      user_id: req.user.id,
      order_number: orderNumber,
      sub_total: subtotal,
      shipping_fee: shipping_fee,
      tax_amount: tax_amount,
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
      status: initialStatus
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
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
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
      const updateData = { ...req.body };
      
      // Update timestamps based on status change
      if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
        updateData.cancelled_at = new Date();
      }
      if (req.body.status === 'completed' && order.status !== 'completed') {
        updateData.completed_at = new Date();
      }

      await order.update(updateData);
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
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
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};
