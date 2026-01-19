const ContactInfo = require('../models/ContactInfo');
const Joi = require('joi');

const contactInfoSchema = Joi.object({
  hotline: Joi.string().max(50),
  email: Joi.string().email().max(100),
  address: Joi.string()
});

exports.getContactInfos = async (req, res) => {
  try {
    const contactInfos = await ContactInfo.findAll();
    res.json(contactInfos);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getContactInfo = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.findByPk(req.params.id);
    if (!contactInfo) return res.status(404).json({ error: 'Contact info not found' });
    res.json(contactInfo);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createContactInfo = async (req, res) => {
  try {
    const { error } = contactInfoSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const contactInfo = await ContactInfo.create(req.body);
    res.status(201).json(contactInfo);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateContactInfo = async (req, res) => {
  try {
    const { error } = contactInfoSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const contactInfo = await ContactInfo.findByPk(req.params.id);
    if (!contactInfo) return res.status(404).json({ error: 'Contact info not found' });

    await contactInfo.update(req.body);
    res.json(contactInfo);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteContactInfo = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.findByPk(req.params.id);
    if (!contactInfo) return res.status(404).json({ error: 'Contact info not found' });

    await contactInfo.destroy();
    res.json({ message: 'Contact info deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
