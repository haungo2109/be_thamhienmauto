const Attribute = require('../models/Attribute');
const VariantOption = require('../models/VariantOption');
const { Op, fn, col } = require('sequelize');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const attributeSchema = Joi.object({
  attribute_name: Joi.string().min(1).max(50).required()
});

exports.getAttributes = async (req, res) => {
  try {
    const result = await paginate(Attribute, { req });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.attribute_name);
    if (!attribute) return res.status(404).json({ error: 'Attribute not found' });
    res.json(attribute);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createAttribute = async (req, res) => {
  try {
    const { error } = attributeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const attribute = await Attribute.create(req.body);
    res.status(201).json(attribute);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateAttribute = async (req, res) => {
  try {
    const { error } = attributeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const attribute = await Attribute.findByPk(req.params.attribute_name);
    if (!attribute) return res.status(404).json({ error: 'Attribute not found' });

    await attribute.update(req.body);
    res.json(attribute);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
    res.status(500).json({ error: 'Internal server error' });
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
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteAttribute = async (req, res) => {
  try {
    const attribute = await Attribute.findByPk(req.params.attribute_name);
    if (!attribute) return res.status(404).json({ error: 'Attribute not found' });

    await attribute.destroy();
    res.json({ message: 'Attribute deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};