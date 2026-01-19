const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const orderItemSchema = Joi.object({
  order_id: Joi.number().integer().required(),
  product_id: Joi.number().integer().required(),
  product_name: Joi.string().min(1).max(255).required(),
  quantity: Joi.number().integer().positive().required(),
  unit_price: Joi.number().positive().required(),
  subtotal: Joi.number().positive().required()
});

exports.getOrderItems = async (req, res) => {
  try {
    const result = await paginate(OrderItem, {
      req,
      include: [
        { model: Order, as: 'Order' },
        { model: Product, as: 'Product' }
      ]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getOrderItem = async (req, res) => {
  try {
    const orderItem = await OrderItem.findByPk(req.params.id, {
      include: [
        { model: Order, as: 'Order' },
        { model: Product, as: 'Product' }
      ]
    });
    if (!orderItem) return res.status(404).json({ error: 'OrderItem not found' });
    res.json(orderItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createOrderItem = async (req, res) => {
  try {
    const { error } = orderItemSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const orderItem = await OrderItem.create(req.body);
    res.status(201).json(orderItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateOrderItem = async (req, res) => {
  try {
    const { error } = orderItemSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const orderItem = await OrderItem.findByPk(req.params.id);
    if (!orderItem) return res.status(404).json({ error: 'OrderItem not found' });

    await orderItem.update(req.body);
    res.json(orderItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteOrderItem = async (req, res) => {
  try {
    const orderItem = await OrderItem.findByPk(req.params.id);
    if (!orderItem) return res.status(404).json({ error: 'OrderItem not found' });

    await orderItem.destroy();
    res.json({ message: 'OrderItem deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
