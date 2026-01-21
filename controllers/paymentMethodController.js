const PaymentMethod = require('../models/PaymentMethod');
const Joi = require('joi');

const paymentMethodSchema = Joi.object({
  id: Joi.string().max(50).required(),
  name: Joi.string().max(255).required(),
  type: Joi.string().max(50).default('manual'),
  isActive: Joi.boolean().default(true),
  status: Joi.string().max(20).default('active'),
  description: Joi.string().allow('', null),
  config: Joi.object().default({})
});

const updatePaymentMethodSchema = Joi.object({
  name: Joi.string().max(255),
  type: Joi.string().max(50),
  isActive: Joi.boolean(),
  status: Joi.string().max(20),
  description: Joi.string().allow('', null),
  config: Joi.object()
});

exports.getPaymentMethods = async (req, res) => {
  try {
    // Mặc định chỉ lấy các phương thức đang hoạt động
    const methods = await PaymentMethod.findAll({ 
      where: { isActive: true }, 
      order: [['id', 'ASC']] 
    });
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ error: 'Payment method not found' });
    res.json(method);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createPaymentMethod = async (req, res) => {
  try {
    const { error } = paymentMethodSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const method = await PaymentMethod.create(req.body);
    res.status(201).json(method);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Payment method ID already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updatePaymentMethod = async (req, res) => {
  try {
    const { error } = updatePaymentMethodSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ error: 'Payment method not found' });

    await method.update(req.body);
    res.json(method);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deletePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ error: 'Payment method not found' });

    await method.destroy();
    res.json({ message: 'Payment method deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
