const ShippingConfig = require('../models/ShippingConfig');
const Joi = require('joi');

const shippingConfigSchema = Joi.object({
  base_fee: Joi.number().integer().min(0),
  free_shipping_threshold: Joi.number().integer().min(0)
});

exports.getShippingConfigs = async (req, res) => {
  try {
    const shippingConfigs = await ShippingConfig.findAll();
    res.json(shippingConfigs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getShippingConfig = async (req, res) => {
  try {
    const shippingConfig = await ShippingConfig.findByPk(req.params.id);
    if (!shippingConfig) return res.status(404).json({ error: 'Shipping config not found' });
    res.json(shippingConfig);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createShippingConfig = async (req, res) => {
  try {
    const { error } = shippingConfigSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const shippingConfig = await ShippingConfig.create(req.body);
    res.status(201).json(shippingConfig);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateShippingConfig = async (req, res) => {
  try {
    const { error } = shippingConfigSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const shippingConfig = await ShippingConfig.findByPk(req.params.id);
    if (!shippingConfig) return res.status(404).json({ error: 'Shipping config not found' });

    await shippingConfig.update(req.body);
    res.json(shippingConfig);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteShippingConfig = async (req, res) => {
  try {
    const shippingConfig = await ShippingConfig.findByPk(req.params.id);
    if (!shippingConfig) return res.status(404).json({ error: 'Shipping config not found' });

    await shippingConfig.destroy();
    res.json({ message: 'Shipping config deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
