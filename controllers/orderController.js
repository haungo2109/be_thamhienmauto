const Order = require('../models/Order');

exports.getOrders = async (req, res) => {
  const orders = await Order.findAll({ include: 'User' });
  res.json(orders);
};

exports.createOrder = async (req, res) => {
  const order = await Order.create(req.body);
  res.status(201).json(order);
};
