const ProductVariant = require('../models/ProductVariant');

exports.getProductVariants = async (req, res) => {
  const productVariants = await ProductVariant.findAll({ include: ['Product', 'VariantOptions'] });
  res.json(productVariants);
};

exports.getProductVariant = async (req, res) => {
  const productVariant = await ProductVariant.findByPk(req.params.id, { include: ['Product', 'VariantOptions'] });
  if (!productVariant) return res.status(404).json({ error: 'ProductVariant not found' });
  res.json(productVariant);
};

exports.createProductVariant = async (req, res) => {
  const productVariant = await ProductVariant.create(req.body);
  res.status(201).json(productVariant);
};

exports.updateProductVariant = async (req, res) => {
  const productVariant = await ProductVariant.findByPk(req.params.id);
  if (!productVariant) return res.status(404).json({ error: 'ProductVariant not found' });
  await productVariant.update(req.body);
  res.json(productVariant);
};

exports.deleteProductVariant = async (req, res) => {
  const productVariant = await ProductVariant.findByPk(req.params.id);
  if (!productVariant) return res.status(404).json({ error: 'ProductVariant not found' });
  await productVariant.destroy();
  res.json({ message: 'ProductVariant deleted' });
};
