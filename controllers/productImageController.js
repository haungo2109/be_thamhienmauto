const ProductImage = require('../models/ProductImage');
const Product = require('../models/Product');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');
const { uploadFile, deleteFile } = require('../utils/rustfs');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const productImageSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  image_url: Joi.string().uri().required(),
  display_order: Joi.number().integer().min(0)
});

exports.getProductImages = async (req, res) => {
  try {
    const result = await paginate(ProductImage, {
      req,
      include: [{ model: Product, as: 'Product' }]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProductImage = async (req, res) => {
  try {
    const productImage = await ProductImage.findByPk(req.params.id, {
      include: [{ model: require('../models/Product'), as: 'Product' }]
    });
    if (!productImage) return res.status(404).json({ error: 'ProductImage not found' });
    res.json(productImage);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProductImage = async (req, res) => {
  try {
    const { error } = productImageSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const fileName = `product-images/${Date.now()}-${req.file.originalname}`;
    const imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);

    const productImage = await ProductImage.create({
      ...req.body,
      image_url: imageUrl
    });
    res.status(201).json(productImage);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProductImage = async (req, res) => {
  try {
    const { error } = productImageSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const productImage = await ProductImage.findByPk(req.params.id);
    if (!productImage) return res.status(404).json({ error: 'ProductImage not found' });

    await productImage.update(req.body);
    res.json(productImage);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const productImage = await ProductImage.findByPk(req.params.id);
    if (!productImage) return res.status(404).json({ error: 'ProductImage not found' });

    // Delete from MinIO
    const fileName = productImage.image_url.split('/').pop();
    await deleteFile(`product-images/${fileName}`);

    await productImage.destroy();
    res.json({ message: 'ProductImage deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
