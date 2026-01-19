const ShippingPartner = require('../models/ShippingPartner');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const shippingPartnerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string(),
  status: Joi.string().valid('active', 'inactive')
});

exports.getShippingPartners = async (req, res) => {
  try {
    const result = await paginate(ShippingPartner, { req });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getShippingPartner = async (req, res) => {
  try {
    const shippingPartner = await ShippingPartner.findByPk(req.params.id);
    if (!shippingPartner) return res.status(404).json({ error: 'Shipping partner not found' });
    res.json(shippingPartner);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createShippingPartner = async (req, res) => {
  try {
    const { error } = shippingPartnerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const shippingPartner = await ShippingPartner.create(req.body);
    res.status(201).json(shippingPartner);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateShippingPartner = async (req, res) => {
  try {
    const { error } = shippingPartnerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const shippingPartner = await ShippingPartner.findByPk(req.params.id);
    if (!shippingPartner) return res.status(404).json({ error: 'Shipping partner not found' });

    await shippingPartner.update(req.body);
    res.json(shippingPartner);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteShippingPartner = async (req, res) => {
  try {
    const shippingPartner = await ShippingPartner.findByPk(req.params.id);
    if (!shippingPartner) return res.status(404).json({ error: 'Shipping partner not found' });

    await shippingPartner.destroy();
    res.json({ message: 'Shipping partner deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
