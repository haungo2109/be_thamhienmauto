const Category = require('../models/Category');
const Joi = require('joi');
const { uploadFile } = require('../utils/rustfs');
const slugify = require('slugify');

const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().max(200).allow('', null),
  description: Joi.string().max(500).allow('', null),
  image: Joi.string().max(255).allow('', null), // Optional field for image URL
  icon: Joi.string().max(100).allow('', null),   // Optional field for icon name
  parent_id: Joi.number().integer().allow(null)
});

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { error } = categorySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let { name, slug, ...otherData } = req.body;
    if (!slug || slug.trim() === '') {
      slug = slugify(name, { lower: true });
    }

    let imageData = { ...otherData, name, slug };
    if (req.file) {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, WEBP, SVG, AVIF, BMP, and TIFF are allowed.' });
      }

      const fileName = `categories/${Date.now()}-${req.file.originalname}`;
      const imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
      imageData = { ...imageData, image: imageUrl };
    }

    const category = await Category.create(imageData);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { error } = categorySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    let { name, slug, ...otherData } = req.body;
    if (name && (!slug || slug.trim() === '')) {
      slug = slugify(name, { lower: true });
    }

    let updateData = { ...otherData, name, slug };
    if (req.file) {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, WEBP, SVG, AVIF, BMP, and TIFF are allowed.' });
      }

      const fileName = `categories/${Date.now()}-${req.file.originalname}`;
      const imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
      updateData = { ...updateData, image: imageUrl };
    }

    await category.update(updateData);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};
