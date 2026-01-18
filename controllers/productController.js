const Product = require('../models/Product');
const Category = require('../models/Category');
const Joi = require('joi');
const slugify = require('slugify');
const { paginate } = require('../utils/pagination');

const productSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000),
  price: Joi.number().positive().required(),
  sale_price: Joi.number().positive().less(Joi.ref('price')),
  stock_quantity: Joi.number().integer().min(0),
  stock_status: Joi.string().valid('in_stock', 'out_of_stock', 'backorder'),
  image_url: Joi.string().uri(),
  category_id: Joi.number().integer()
});

exports.getProducts = async (req, res) => {
  try {
    const result = await paginate(Product, {
      req,
      include: [{ model: Category, as: 'Category' }]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: require('../models/Category'), as: 'Category' }]
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, ...data } = req.body;
    const slug = slugify(name, { lower: true });
    const product = await Product.create({ ...data, name, slug });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { name, ...data } = req.body;
    if (name) data.slug = slugify(name, { lower: true });
    await product.update(data);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
