const PostCategory = require('../models/PostCategory');
const Joi = require('joi');
const slugify = require('slugify');
const { paginate } = require('../utils/pagination');

const postCategorySchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  parent_id: Joi.number().integer().allow(null)
});

exports.getPostCategories = async (req, res) => {
  try {
    const result = await paginate(PostCategory, {
      req,
      include: [
        { model: PostCategory, as: 'Parent' },
        { model: PostCategory, as: 'Children' }
      ]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getPostCategory = async (req, res) => {
  try {
    const category = await PostCategory.findByPk(req.params.id, {
      include: [
        { model: PostCategory, as: 'Parent' },
        { model: PostCategory, as: 'Children' }
      ]
    });
    if (!category) return res.status(404).json({ error: 'Post category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createPostCategory = async (req, res) => {
  try {
    const { error } = postCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, ...data } = req.body;
    const slug = slugify(name, { lower: true });
    const category = await PostCategory.create({ ...data, name, slug });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updatePostCategory = async (req, res) => {
  try {
    const { error } = postCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const category = await PostCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Post category not found' });

    const { name, ...data } = req.body;
    if (name) data.slug = slugify(name, { lower: true });
    await category.update(data);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deletePostCategory = async (req, res) => {
  try {
    const category = await PostCategory.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Post category not found' });

    await category.destroy();
    res.json({ message: 'Post category deleted' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};