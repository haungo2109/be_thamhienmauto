const Order = require('../models/Order');
const User = require('../models/User');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const createOrderSchema = Joi.object({
  total_amount: Joi.number().positive().required(),
  coupon_code: Joi.string(),
  discount_amount: Joi.number().min(0),
  shipping_name: Joi.string().min(1).max(255).required(),
  shipping_address: Joi.string().min(1).required(),
  shipping_phone: Joi.string().min(1).max(20).required(),
  shipping_email: Joi.string().email(),
  note: Joi.string(),
  payment_method: Joi.string().min(1).max(50).required(), // New field validation
  shipping_partner_id: Joi.number().integer() // Optional field
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
  payment_method: Joi.string().min(1).max(50), // New field validation, optional for updates
  shipping_partner_id: Joi.number().integer() // Optional field
});

exports.getOrders = async (req, res) => {
  try {
    let where = {};
    if (req.user.role !== 'admin') {
      where.user_id = req.user.id;
    }

    const result = await paginate(Order, {
      req,
      where,
      include: [{ model: User, as: 'User', attributes: ['id', 'username', 'email'] }]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'username', 'email'] },
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
  try {
    const { error } = createOrderSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const orderNumber = 'ORD-' + Date.now();
    const order = await Order.create({
      ...req.body,
      user_id: req.user.id,
      order_number: orderNumber
    });
    res.status(201).json(order);
  } catch (error) {
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
