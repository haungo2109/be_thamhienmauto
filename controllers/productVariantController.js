const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const VariantOption = require('../models/VariantOption');
const Joi = require('joi');
const { uploadFile, deleteFile } = require('../utils/rustfs');
const { syncProductPriceWithVariants } = require('./productController');
const { sequelize } = require('../config/database');

const productVariantSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  sku: Joi.string().max(100),
  price: Joi.number().positive().required(),
  stock_quantity: Joi.number().integer().min(0),
  image_url: Joi.string().uri()
});

exports.getProductVariants = async (req, res) => {
  try {
    const product_id = req.params.id;
    
    const variants = await ProductVariant.findAll({
      where: { product_id },
      include: [
        { model: VariantOption, as: 'VariantOptions' }
      ]
    });
    res.json(variants);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProductVariant = async (req, res) => {
  try {
    const productVariant = await ProductVariant.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'Product' },
        { model: VariantOption, as: 'VariantOptions' }
      ]
    });
    if (!productVariant) return res.status(404).json({ error: 'ProductVariant not found' });
    res.json(productVariant);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProductVariant = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { error } = productVariantSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // 1. Xử lý ảnh
    let imageUrl = req.body.image_url;
    if (req.file) {
      const fileName = `product-variants/${Date.now()}-${req.file.originalname}`;
      imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
    }

    // 2. Logic tính giá (BẮT BUỘC PHẢI CÓ KHI CREATE)
    let salePrice = req.body.price; // Mặc định sale bằng price
    const originalPrice = parseFloat(req.body.price);

    // Lấy thông tin Product cha và Promotion để tính giá ngay lập tức
    const product = await Product.findByPk(req.body.product_id, {
      include: [{ model: Promotion, as: 'promotion' }],
      transaction: t
    });

    if (!product) {
        await t.rollback();
        return res.status(404).json({ error: 'Product not found' });
    }

    if (product.promotion && product.promotion.is_active) {
       const { discount_type, discount_value } = product.promotion;
       const val = parseFloat(discount_value);
       
       if (discount_type === 'percentage') {
         salePrice = originalPrice - (originalPrice * (val / 100));
       } else {
         salePrice = originalPrice - val;
       }
       salePrice = Math.max(0, salePrice);
    }

    // 3. Tạo record
    const productVariant = await ProductVariant.create({
      ...req.body,
      image_url: imageUrl,
      sale_price: salePrice // Lưu giá đã tính
    }, { transaction: t });
    
    await t.commit();

    // 4. Sync ra ngoài (Side effect)
    try {
        await syncProductPriceWithVariants(productVariant.product_id);
    } catch (e) { console.error(e); }
    
    res.status(201).json(productVariant);

  } catch (error) {
    if (t) await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProductVariant = async (req, res) => {
  const t = await sequelize.transaction(); // Dùng transaction để an toàn

  try {
    const { error } = productVariantSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // 1. Tối ưu Query: Lấy Variant kèm luôn Product và Promotion
    const productVariant = await ProductVariant.findByPk(req.params.id, {
      include: [{
        model: Product,
        as: 'product', // Nhớ check alias trong model definition
        include: [{
          model: Promotion,
          as: 'promotion' // Nhớ check alias
        }]
      }],
      transaction: t // Đọc trong transaction
    });

    if (!productVariant) {
      await t.rollback();
      return res.status(404).json({ error: 'ProductVariant not found' });
    }

    const updateData = { ...req.body };
    
    // 1. Xử lý ảnh mới (Nếu có upload ảnh mới)
    if (req.file) {
      const fileName = `product-variants/${Date.now()}-${req.file.originalname}`;
      const newImageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
      updateData.image_url = newImageUrl;

      // (Optional) TODO: Xóa ảnh cũ trên S3/Cloudinary để tiết kiệm dung lượng
      if (productVariant.image_url) deleteFile(productVariant.image_url);
    }

    // 2. Logic tính giá chuẩn
    if (req.body.price !== undefined) {
      const originalPrice = parseFloat(req.body.price);
      const product = productVariant.product;
      const promotion = product ? product.promotion : null;

      // Mặc định: Nếu không có khuyến mãi, giá bán = giá gốc
      let newSalePrice = originalPrice;

      // Nếu có khuyến mãi Active, tính toán lại
      if (promotion && promotion.is_active) {
        const discountValue = parseFloat(promotion.discount_value);
        if (promotion.discount_type === 'percentage') {
          newSalePrice = originalPrice - (originalPrice * (discountValue / 100));
        } else {
          newSalePrice = originalPrice - discountValue;
        }
        // Đảm bảo không âm
        newSalePrice = Math.max(0, newSalePrice);
      }

      updateData.sale_price = newSalePrice;
    }

    // 3. Update Variant
    await productVariant.update(updateData, { transaction: t });

    // 4. Commit transaction trước khi làm việc phụ (sync)
    // Hoặc nếu syncProductPriceWithVariants có support transaction thì truyền t vào
    await t.commit(); 

    // 5. Sync giá ra bảng cha (Nên bọc try catch riêng hoặc để chạy background)
    // Lưu ý: Nếu hàm này lỗi thì transaction trên đã commit rồi, data variants vẫn đúng.
    try {
        await syncProductPriceWithVariants(productVariant.product_id);
    } catch (syncError) {
        console.error("Sync price warning:", syncError);
        // Không throw lỗi ở đây để tránh client nhận 500 khi đã update variant thành công
    }
    
    // Trả về data mới nhất
    res.json(productVariant);

  } catch (error) {
    if (t) await t.rollback();
    console.error('Update variant error:', error);
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
