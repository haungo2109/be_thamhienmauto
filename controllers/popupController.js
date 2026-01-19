const Popup = require('../models/Popup');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const popupSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  image_url: Joi.string().max(255),
  discount_code: Joi.string().max(50),
  frequency: Joi.string().max(50),
  button_text: Joi.string().min(1).max(100).required(),
  button_link: Joi.string().min(1).max(255).required(),
  is_active: Joi.boolean()
});

exports.getPopups = async (req, res) => {
  try {
    const result = await paginate(Popup, { req });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPopup = async (req, res) => {
  try {
    const popup = await Popup.findByPk(req.params.id);
    if (!popup) return res.status(404).json({ error: 'Popup not found' });
    res.json(popup);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createPopup = async (req, res) => {
  try {
    const { error } = popupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const popup = await Popup.create(req.body);
    res.status(201).json(popup);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updatePopup = async (req, res) => {
  try {
    const { error } = popupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const popup = await Popup.findByPk(req.params.id);
    if (!popup) return res.status(404).json({ error: 'Popup not found' });

    await popup.update(req.body);
    res.json(popup);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deletePopup = async (req, res) => {
  try {
    const popup = await Popup.findByPk(req.params.id);
    if (!popup) return res.status(404).json({ error: 'Popup not found' });

    await popup.destroy();
    res.json({ message: 'Popup deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
