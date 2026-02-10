const Popup = require('../models/Popup');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');
const { uploadFile } = require('../utils/rustfs');

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
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getPopup = async (req, res) => {
  try {
    const popup = await Popup.findByPk(req.params.id);
    if (!popup) return res.status(404).json({ error: 'Popup not found' });
    res.json(popup);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getActivePopup = async (req, res) => {
  try {
    const popup = await Popup.findOne({
      where: { is_active: true },
      order: [['id', 'DESC']] // Get the most recently created active popup
    });
    res.json(popup);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createPopup = async (req, res) => {
  try {
    const { error } = popupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let popupData = req.body;
    if (req.file) {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, WEBP, SVG, AVIF, BMP, and TIFF are allowed.' });
      }

      const fileName = `popups/${Date.now()}-${req.file.originalname}`;
      const imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
      popupData = { ...req.body, image_url: imageUrl };
    }

    const popup = await Popup.create(popupData);
    res.status(201).json(popup);
  } catch (error) {
    console.error('Create popup error:', error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updatePopup = async (req, res) => {
  try {
    const { error } = popupSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const popup = await Popup.findByPk(req.params.id);
    if (!popup) return res.status(404).json({ error: 'Popup not found' });

    let updateData = req.body;
    if (req.file) {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, WEBP, SVG, AVIF, BMP, and TIFF are allowed.' });
      }

      const fileName = `popups/${Date.now()}-${req.file.originalname}`;
      const imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
      updateData = { ...req.body, image_url: imageUrl };
    }

    await popup.update(updateData);
    res.json(popup);
  } catch (error) {
    console.error('Update popup error:', error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deletePopup = async (req, res) => {
  try {
    const popup = await Popup.findByPk(req.params.id);
    if (!popup) return res.status(404).json({ error: 'Popup not found' });

    await popup.destroy();
    res.json({ message: 'Popup deleted' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};
