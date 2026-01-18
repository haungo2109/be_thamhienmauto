const OrderItem = require('../models/OrderItem');

exports.getOrderItems = async (req, res) => {
  const orderItems = await OrderItem.findAll({ include: ['Order', 'Product'] });
  res.json(orderItems);
};

exports.getOrderItem = async (req, res) => {
  const orderItem = await OrderItem.findByPk(req.params.id, { include: ['Order', 'Product'] });
  if (!orderItem) return res.status(404).json({ error: 'OrderItem not found' });
  res.json(orderItem);
};

exports.createOrderItem = async (req, res) => {
  const orderItem = await OrderItem.create(req.body);
  res.status(201).json(orderItem);
};

exports.updateOrderItem = async (req, res) => {
  const orderItem = await OrderItem.findByPk(req.params.id);
  if (!orderItem) return res.status(404).json({ error: 'OrderItem not found' });
  await orderItem.update(req.body);
  res.json(orderItem);
};

exports.deleteOrderItem = async (req, res) => {
  const orderItem = await OrderItem.findByPk(req.params.id);
  if (!orderItem) return res.status(404).json({ error: 'OrderItem not found' });
  await orderItem.destroy();
  res.json({ message: 'OrderItem deleted' });
};
