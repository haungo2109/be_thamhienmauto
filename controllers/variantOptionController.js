const VariantOption = require('../models/VariantOption');

exports.getVariantOptions = async (req, res) => {
  const variantOptions = await VariantOption.findAll({ include: 'ProductVariant' });
  res.json(variantOptions);
};

exports.getVariantOption = async (req, res) => {
  const variantOption = await VariantOption.findByPk(req.params.id, { include: 'ProductVariant' });
  if (!variantOption) return res.status(404).json({ error: 'VariantOption not found' });
  res.json(variantOption);
};

exports.createVariantOption = async (req, res) => {
  const variantOption = await VariantOption.create(req.body);
  res.status(201).json(variantOption);
};

exports.updateVariantOption = async (req, res) => {
  const variantOption = await VariantOption.findByPk(req.params.id);
  if (!variantOption) return res.status(404).json({ error: 'VariantOption not found' });
  await variantOption.update(req.body);
  res.json(variantOption);
};

exports.deleteVariantOption = async (req, res) => {
  const variantOption = await VariantOption.findByPk(req.params.id);
  if (!variantOption) return res.status(404).json({ error: 'VariantOption not found' });
  await variantOption.destroy();
  res.json({ message: 'VariantOption deleted' });
};
