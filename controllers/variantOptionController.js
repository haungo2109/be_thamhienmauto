const VariantOption = require('../models/VariantOption');
const ProductVariant = require('../models/ProductVariant');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');
const { Op, fn, col } = require('sequelize');

const variantOptionSchema = Joi.object({
  variant_id: Joi.number().integer().required(),
  attribute_name: Joi.string().min(1).max(50).required(),
  attribute_value: Joi.string().min(1).max(50).required()
});

exports.getBrands = async (req, res) => {
  try {
    const brands = await VariantOption.findAll({
      attributes: [[fn('DISTINCT', col('attribute_value')), 'name']],
      where: { attribute_name: 'Hãng xe' },
      raw: true
    });
    res.json(brands.map(b => b.name));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getModelsByBrand = async (req, res) => {
  try {
    const { brand } = req.query;
    if (!brand) return res.status(400).json({ error: 'Brand is required' });

    const variantsWithBrand = await VariantOption.findAll({
      attributes: ['variant_id'],
      where: { 
        attribute_name: 'Hãng xe', 
        attribute_value: brand 
      },
      raw: true
    });

    const variantIds = variantsWithBrand.map(v => v.variant_id);
    if (variantIds.length === 0) return res.json([]);

    const models = await VariantOption.findAll({
      attributes: [[fn('DISTINCT', col('attribute_value')), 'name']],
      where: {
        variant_id: { [Op.in]: variantIds },
        attribute_name: 'Dòng xe'
      },
      raw: true
    });

    res.json(models.map(m => m.name));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getVariantOptions = async (req, res) => {
  try {
    const result = await paginate(VariantOption, {
      req,
      include: [
        { model: ProductVariant, as: 'ProductVariant' }
      ]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getVariantOption = async (req, res) => {
  try {
    const variantOption = await VariantOption.findByPk(req.params.id, {
      include: [
        { model: ProductVariant, as: 'ProductVariant' }
      ]
    });
    if (!variantOption) return res.status(404).json({ error: 'VariantOption not found' });
    res.json(variantOption);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createVariantOption = async (req, res) => {
  try {
    const { error } = variantOptionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const variantOption = await VariantOption.create(req.body);
    res.status(201).json(variantOption);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updateVariantOption = async (req, res) => {
  try {
    const { error } = variantOptionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const variantOption = await VariantOption.findByPk(req.params.id);
    if (!variantOption) return res.status(404).json({ error: 'VariantOption not found' });

    await variantOption.update(req.body);
    res.json(variantOption);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deleteVariantOption = async (req, res) => {
  try {
    const variantOption = await VariantOption.findByPk(req.params.id);
    if (!variantOption) return res.status(404).json({ error: 'VariantOption not found' });

    await variantOption.destroy();
    res.json({ message: 'VariantOption deleted' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};
