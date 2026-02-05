const Product = require('../models/Product');
const Category = require('../models/Category');
const ProductImage = require('../models/ProductImage');
const ProductVariant = require('../models/ProductVariant');
const VariantOption = require('../models/VariantOption');
const Promotion = require('../models/Promotion');
const { sequelize } = require('../config/database');
const Joi = require('joi');
const slugify = require('slugify');
const { paginate } = require('../utils/pagination');
const { uploadFile, deleteFile } = require('../utils/rustfs');
const multer = require('multer');
const { Op } = require('sequelize');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to sync product price with its variants
exports.syncProductPriceWithVariants = async (productId) => {
  const minVariant = await ProductVariant.findOne({
    where: { product_id: productId },
    order: [['price', 'ASC']]
  });

  if (minVariant) {
    await Product.update({
      price: minVariant.price,
      sale_price: minVariant.sale_price
    }, {
      where: { id: productId }
    });
  }
};

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
    const { categoryIdOrSlug, q, stock_status, min_price, max_price, sort, brand, model, promotion_type } = req.query;
    let where = {};
    let include = [{ model: Category, as: 'Category' }];

    if (categoryIdOrSlug) {
      let categoryWhere = isNaN(categoryIdOrSlug) ? { slug: categoryIdOrSlug } : { id: categoryIdOrSlug };
      const category = await Category.findOne({ where: categoryWhere });
      if (!category) return res.json({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
      where.category_id = category.id;
    }
    
    if (stock_status) where.stock_status = stock_status;
    
    if (q) {
      where.name = { [Op.iLike]: `%${q}%` };
    }

    if (min_price || max_price) {
      where.sale_price = {};
      if (min_price) where.sale_price[Op.gte] = parseFloat(min_price);
      if (max_price) where.sale_price[Op.lte] = parseFloat(max_price);
    }

    if (promotion_type) {
      include.push({
        model: Promotion, as: 'Promotion',
        where: {
          type: promotion_type,
          is_active: true,
          end_date: { [Op.gte]: new Date() }
        },
        required: true // INNER JOIN to filter products that have this promotion
      });
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
        case 'price_asc': order = [['sale_price', 'ASC']]; break;
        case 'price_desc': order = [['sale_price', 'DESC']]; break;
        case 'oldest': order = [['created_at', 'ASC']]; break;
        case 'best_selling': order = [['created_at', 'DESC']]; break; // Cần thêm field sales_count để thực tế hơn
        default: order = [['created_at', 'DESC']];
      }
    }

    const result = await paginate(Product, {
      req,
      where,
      include,
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
      const fileName = `products/${Date.now()}-${req.file.originalname}`;
      image_url = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
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
  // Dùng transaction để đảm bảo an toàn
  const t = await sequelize.transaction(); 

  try {
    // 1. Validate Input
    const { error } = productSchema.validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.details[0].message });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price, ...data } = req.body;

    // 2. Xử lý Ảnh (Upload trước - Xóa sau)
    let newImageUrl = null;
    if (req.file) {
      // Upload ảnh mới trước
      const fileName = `products/${Date.now()}-${req.file.originalname}`;
      newImageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);

      data.image_url = newImageUrl;
    }

    // 3. Xử lý Slug
    if (name) data.slug = slugify(name, { lower: true });

    // 4. Xử lý Giá (Quan trọng)
    if (price !== undefined) {
      // 4.1. Kiểm tra xem có Variant không?
      // Nếu có variant, KHÔNG cho phép sửa giá ở bảng Product (vì giá phải lấy từ min variant)
      const variantCount = await ProductVariant.count({ where: { product_id: product.id } });
      
      if (variantCount > 0) {
        // Option A: Báo lỗi
        // await t.rollback();
        // return res.status(400).json({ error: 'Cannot update price directly. Please update product variants.' });
        
        // Option B (Mềm mỏng): Bỏ qua field price, chỉ update thông tin khác
        console.warn(`[UpdateProduct] Ignored price update for product ${product.id} because it has variants.`);
      } else {
        // 4.2. Logic cho Simple Product
        data.price = price;
        
        // MẶC ĐỊNH: Reset sale_price về bằng price mới
        data.sale_price = price; 

        // Nếu có promotion, tính lại sale_price
        if (product.promotion_id) {
          const promotion = await Promotion.findByPk(product.promotion_id);
          // Check thêm logic ngày hết hạn nếu cần
          if (promotion && promotion.is_active) {
            const discountValue = parseFloat(promotion.discount_value);
            const originalPrice = parseFloat(price);

            if (promotion.discount_type === 'percentage') {
              data.sale_price = Math.max(0, originalPrice - (originalPrice * (discountValue / 100)));
            } else {
              data.sale_price = Math.max(0, originalPrice - discountValue);
            }
          }
        }
      }
    }

    // 5. Update Database
    await product.update(data, { transaction: t });

    await t.commit(); // Commit transaction

    // 6. Dọn dẹp: Xóa ảnh cũ (Chỉ làm khi mọi thứ đã thành công)
    if (newImageUrl && product.image_url) {
      // Không cần await để tránh block response, hoặc catch error để không crash
      deleteFile(product.image_url).catch(err => console.error("Failed to delete old image:", err));
    }

    res.json(product);

  } catch (error) {
    await t.rollback();
    console.error("Update product error:", error);
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
    console.error("Delete product error:", error);
    res.status(500).json({ error: 'Internal server error when delete product' });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.' });
    }

    const fileName = `products/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
    const imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);

    res.status(200).json({
      message: 'Upload successful',
      url: imageUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};