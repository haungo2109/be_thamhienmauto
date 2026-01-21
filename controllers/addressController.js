const UserAddress = require('../models/UserAddress');
const Joi = require('joi');

const addressSchema = Joi.object({
  receiver_name: Joi.string().max(255).required(),
  receiver_phone: Joi.string().max(20).required(),
  address: Joi.string().required(),
  address_type: Joi.string().valid('home', 'office').default('home'),
  is_default: Joi.boolean().default(false)
});

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await UserAddress.findAll({
      where: { user_id: req.user.id },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const { error } = addressSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { is_default } = req.body;

    // If setting as default, unset other default addresses
    if (is_default) {
      await UserAddress.update(
        { is_default: false },
        { where: { user_id: req.user.id, is_default: true } }
      );
    }

    // If it's the first address, make it default regardless
    const count = await UserAddress.count({ where: { user_id: req.user.id } });
    const final_is_default = count === 0 ? true : is_default;

    const address = await UserAddress.create({
      ...req.body,
      user_id: req.user.id,
      is_default: final_is_default
    });

    res.status(201).json(address);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { error } = addressSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const address = await UserAddress.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!address) return res.status(404).json({ error: 'Address not found' });

    const { is_default } = req.body;

    if (is_default && !address.is_default) {
      await UserAddress.update(
        { is_default: false },
        { where: { user_id: req.user.id, is_default: true } }
      );
    }

    await address.update(req.body);
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const address = await UserAddress.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!address) return res.status(404).json({ error: 'Address not found' });

    const wasDefault = address.is_default;
    await address.destroy();

    // If the deleted address was default, set the most recent one as default
    if (wasDefault) {
      const latestAddress = await UserAddress.findOne({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']]
      });
      if (latestAddress) {
        latestAddress.is_default = true;
        await latestAddress.save();
      }
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const address = await UserAddress.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!address) return res.status(404).json({ error: 'Address not found' });

    await UserAddress.update(
      { is_default: false },
      { where: { user_id: req.user.id, is_default: true } }
    );

    address.is_default = true;
    await address.save();

    res.json(address);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
