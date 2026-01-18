const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const VariantOption = require('../models/VariantOption');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');
const { uploadFile, deleteFile } = require('../utils/minio');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const productVariantSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  sku: Joi.string().max(100),
  price: Joi.number().positive().required(),
  stock_quantity: Joi.number().integer().min(0),
  image_url: Joi.string().uri()
});

exports.getProductVariants = async (req, res) => {
  try {
    const result = await paginate(ProductVariant, {
      req,
      include: [
        { model: Product, as: 'Product' },
        { model: VariantOption, as: 'VariantOptions' }
      ]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProductVariant = async (req, res) => {
  try {
    const productVariant = await ProductVariant.findByPk(req.params.id, {
      include: [
        { model: require('../models/Product'), as: 'Product' },
        { model: require('../models/VariantOption'), as: 'VariantOptions' }
      ]
    });
    if (!productVariant) return res.status(404).json({ error: 'ProductVariant not found' });
    res.json(productVariant);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProductVariant = async (req, res) => {
  try {
    const { error } = productVariantSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let imageUrl = req.body.image_url;
    if (req.file) {
      const fileName = `product-variants/${Date.now()}-${req.file.originalname}`;
      imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
    }

    const productVariant = await ProductVariant.create({
      ...req.body,
      image_url: imageUrl
    });
    res.status(201).json(productVariant);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProductVariant = async (req, res) => {
  try {
    const { error } = productVariantSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const productVariant = await ProductVariant.findByPk(req.params.id);
    if (!productVariant) return res.status(404).json({ error: 'ProductVariant not found' });

    await productVariant.update(req.body);
    res.json(productVariant);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteProductVariant = async (req, res) => {
  try {
    const productVariant = await ProductVariant.findByPk(req.params.id);
    if (!productVariant) return res.status(404).json({ error: 'ProductVariant not found' });

    // Delete image from MinIO if exists
    if (productVariant.image_url) {
      const fileName = productVariant.image_url.split('/').pop();
      await deleteFile(`product-variants/${fileName}`);
    }

    await productVariant.destroy();
    res.json({ message: 'ProductVariant deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
