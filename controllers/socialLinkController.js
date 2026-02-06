const SocialLink = require('../models/SocialLink');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const socialLinkSchema = Joi.object({
  platform: Joi.string().max(50),
  icon: Joi.string().max(50),
  url: Joi.string().max(255),
  contact_id: Joi.number().integer()
});

exports.getSocialLinks = async (req, res) => {
  try {
    const result = await paginate(SocialLink, { req });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getSocialLink = async (req, res) => {
  try {
    const socialLink = await SocialLink.findByPk(req.params.id);
    if (!socialLink) return res.status(404).json({ error: 'Social link not found' });
    res.json(socialLink);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createSocialLink = async (req, res) => {
  try {
    const { error } = socialLinkSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const socialLink = await SocialLink.create(req.body);
    res.status(201).json(socialLink);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updateSocialLink = async (req, res) => {
  try {
    const { error } = socialLinkSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const socialLink = await SocialLink.findByPk(req.params.id);
    if (!socialLink) return res.status(404).json({ error: 'Social link not found' });

    await socialLink.update(req.body);
    res.json(socialLink);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deleteSocialLink = async (req, res) => {
  try {
    const socialLink = await SocialLink.findByPk(req.params.id);
    if (!socialLink) return res.status(404).json({ error: 'Social link not found' });

    await socialLink.destroy();
    res.json({ message: 'Social link deleted' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};
