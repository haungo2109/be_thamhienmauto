const Product = require('../models/Product');
const Category = require('../models/Category');
const ProductImage = require('../models/ProductImage');
const ProductVariant = require('../models/ProductVariant');
const VariantOption = require('../models/VariantOption');
const { sequelize } = require('../config/database');
const Joi = require('joi');
const slugify = require('slugify');
const { paginate } = require('../utils/pagination');
const { uploadFile, deleteFile } = require('../utils/rustfs');
const multer = require('multer');
const { Op } = require('sequelize');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

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
    const { category_id, q, stock_status, min_price, max_price, sort, brand, model } = req.query;
    let where = {};

    if (category_id) where.category_id = category_id;
    if (stock_status) where.stock_status = stock_status;
    
    if (q) {
      where.name = { [Op.iLike]: `%${q}%` };
    }

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = parseFloat(min_price);
      if (max_price) where.price[Op.lte] = parseFloat(max_price);
    }

    if (brand || model) {
      const brandFilter = brand ? `AND EXISTS (SELECT 1 FROM "${VariantOption.getTableName()}" AS vo WHERE vo.variant_id = pv.id AND vo.attribute_name = 'Hãng xe' AND vo.attribute_value = ${sequelize.escape(brand)})` : '';
      const modelFilter = model ? `AND EXISTS (SELECT 1 FROM "${VariantOption.getTableName()}" AS vo WHERE vo.variant_id = pv.id AND vo.attribute_name = 'Dòng xe' AND vo.attribute_value = ${sequelize.escape(model)})` : '';
      
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(sequelize.literal(`EXISTS (
        SELECT 1 FROM "${ProductVariant.getTableName()}" AS pv
        WHERE pv.product_id = "Product".id
        ${brandFilter}
        ${modelFilter}
      )`));
    }

    let order = [['created_at', 'DESC']];
    if (sort) {
      switch (sort) {
        case 'price_asc': order = [['price', 'ASC']]; break;
        case 'price_desc': order = [['price', 'DESC']]; break;
        case 'oldest': order = [['created_at', 'ASC']]; break;
        case 'best_selling': order = [['created_at', 'DESC']]; break; // Cần thêm field sales_count để thực tế hơn
        default: order = [['created_at', 'DESC']];
      }
    }

    const result = await paginate(Product, {
      req,
      where,
      include: [{ model: Category, as: 'Category' }],
      order
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { q, stock_status, min_price, max_price, sort, brand, model } = req.query;
    
    let categoryWhere = isNaN(id) ? { slug: id } : { id: id };
    const category = await Category.findOne({ where: categoryWhere });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    let where = { category_id: category.id };
    if (stock_status) where.stock_status = stock_status;
    if (q) where.name = { [Op.iLike]: `%${q}%` };

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = parseFloat(min_price);
      if (max_price) where.price[Op.lte] = parseFloat(max_price);
    }

    if (brand || model) {
      const brandFilter = brand ? `AND EXISTS (SELECT 1 FROM "${VariantOption.getTableName()}" AS vo WHERE vo.variant_id = pv.id AND vo.attribute_name = 'Hãng xe' AND vo.attribute_value = ${sequelize.escape(brand)})` : '';
      const modelFilter = model ? `AND EXISTS (SELECT 1 FROM "${VariantOption.getTableName()}" AS vo WHERE vo.variant_id = pv.id AND vo.attribute_name = 'Dòng xe' AND vo.attribute_value = ${sequelize.escape(model)})` : '';
      
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(sequelize.literal(`EXISTS (
        SELECT 1 FROM "${ProductVariant.getTableName()}" AS pv
        WHERE pv.product_id = "Product".id
        ${brandFilter}
        ${modelFilter}
      )`));
    }

    let order = [['created_at', 'DESC']];
    if (sort) {
      switch (sort) {
        case 'price_asc': order = [['price', 'ASC']]; break;
        case 'price_desc': order = [['price', 'DESC']]; break;
        case 'oldest': order = [['created_at', 'ASC']]; break;
        case 'best_selling': order = [['created_at', 'DESC']]; break;
        default: order = [['created_at', 'DESC']];
      }
    }

    const result = await paginate(Product, {
      req,
      where,
      include: [{ model: Category, as: 'Category' }],
      order
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const where = isNaN(id) ? { slug: id } : { id: id };

    const product = await Product.findOne({
      where,
      include: [
        { model: Category, as: 'Category' },
        { 
          model: ProductImage, 
          as: 'ProductImages',
        }
      ],
      order: [
        [{ model: ProductImage, as: 'ProductImages' }, 'display_order', 'ASC']
      ]
    });
    
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Transform ProductImages to simple string array
    const productData = product.toJSON();
    productData.images = (productData.ProductImages || []).map(img => img.image_url);
    delete productData.ProductImages;

    res.json(productData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { error } = productSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let image_url = req.body.image_url;
    if (req.file) {
      image_url = await uploadFile(req.file, 'products');
    }

    const { name, ...data } = req.body;
    const slug = slugify(name, { lower: true });
    const product = await Product.create({ ...data, name, slug, image_url });
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

    let image_url = req.body.image_url || product.image_url;
    if (req.file) {
      // Delete old file if exists
      if (product.image_url) {
        await deleteFile(product.image_url);
      }
      // Upload new file
      image_url = await uploadFile(req.file, 'products');
    }

    const { name, ...data } = req.body;
    if (name) data.slug = slugify(name, { lower: true });
    data.image_url = image_url;
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

    // Delete associated file if exists
    if (product.image_url) {
      await deleteFile(product.image_url);
    }

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
