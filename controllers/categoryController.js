const Category = require('../models/Category');
const Joi = require('joi');
const { uploadFile } = require('../utils/rustfs');

const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500),
  image: Joi.string().max(255), // Optional field for image URL
  icon: Joi.string().max(100)   // Optional field for icon name
});

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { error } = categorySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let imageData = req.body;
    if (req.file) {
      const fileName = `categories/${Date.now()}-${req.file.originalname}`;
      const imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
      imageData = { ...req.body, image: imageUrl };
    }

    const category = await Category.create(imageData);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { error } = categorySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    let updateData = req.body;
    if (req.file) {
      const fileName = `categories/${Date.now()}-${req.file.originalname}`;
      const imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
      updateData = { ...req.body, image: imageUrl };
    }

    await category.update(updateData);
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
