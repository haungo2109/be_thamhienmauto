const ProductImage = require('../models/ProductImage');

exports.getProductImages = async (req, res) => {
  const productImages = await ProductImage.findAll({ include: 'Product' });
  res.json(productImages);
};

exports.getProductImage = async (req, res) => {
  const productImage = await ProductImage.findByPk(req.params.id, { include: 'Product' });
  if (!productImage) return res.status(404).json({ error: 'ProductImage not found' });
  res.json(productImage);
};

exports.createProductImage = async (req, res) => {
  const productImage = await ProductImage.create(req.body);
  res.status(201).json(productImage);
};

exports.updateProductImage = async (req, res) => {
  const productImage = await ProductImage.findByPk(req.params.id);
  if (!productImage) return res.status(404).json({ error: 'ProductImage not found' });
  await productImage.update(req.body);
  res.json(productImage);
};

exports.deleteProductImage = async (req, res) => {
  const productImage = await ProductImage.findByPk(req.params.id);
  if (!productImage) return res.status(404).json({ error: 'ProductImage not found' });
  await productImage.destroy();
  res.json({ message: 'ProductImage deleted' });
};
