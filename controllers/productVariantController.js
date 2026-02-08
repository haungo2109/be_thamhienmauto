const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const VariantOption = require('../models/VariantOption');
const Joi = require('joi');
const { uploadFile, deleteFile } = require('../utils/rustfs');
const { syncProductPriceWithVariants } = require('./productController');
const { sequelize } = require('../config/database');
const { parseOptions, calculateSalePrice } = require('../utils/helper');

// Schema validation mở rộng thêm mảng options
const productVariantSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  sku: Joi.string().max(100),
  price: Joi.number().positive().required(),
  stock_quantity: Joi.number().integer().min(0),
  image_url: Joi.string().uri().allow('', null),
  // Frontend gửi dạng: [{"attribute_name": "Color", "attribute_value": "Red"}, ...]
  options: Joi.alternatives().try(
    Joi.string(), // Trường hợp gửi form-data stringified
    Joi.array().items(
      Joi.object({
        attribute_name: Joi.string().required(),
        attribute_value: Joi.string().required()
      })
    )
  ).optional()
});

// Schema validation cho Sync
const syncVariantsSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  // Mảng các item thêm mới (giống schema createBulk)
  created: Joi.array().items(
    Joi.object({
      price: Joi.number().positive().required(),
      stock_quantity: Joi.number().integer().min(0),
      image_url: Joi.string().uri().allow('', null),
      options: Joi.array().items(
        Joi.object({
          attribute_name: Joi.string().required(),
          attribute_value: Joi.string().required()
        })
      ).min(1).required()
    })
  ).default([]),

  // Mảng các item cần update (giống schema updateBulk)
  updated: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(), // Phải có ID
      price: Joi.number().positive(),
      stock_quantity: Joi.number().integer().min(0),
      image_url: Joi.string().uri().allow('', null),
      options: Joi.array().items(
        Joi.object({
          attribute_name: Joi.string().required(),
          attribute_value: Joi.string().required()
        })
      ).optional()
    })
  ).default([]),

  // Mảng ID cần xóa
  deleted_ids: Joi.array().items(Joi.number().integer()).default([])
});

exports.syncBulkVariants = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // 1. Validate
    const { error } = syncVariantsSchema.validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.details[0].message });
    }

    const { product_id, created, updated, deleted_ids } = req.body;

    // Lấy thông tin Promotion/Product cha để tính giá chung cho Create/Update
    const product = await Product.findByPk(product_id, {
      include: [{ model: Promotion, as: 'Promotion' }],
      transaction: t
    });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    // --- PHASE 1: DELETE (Xóa trước cho nhẹ DB) ---
    if (deleted_ids.length > 0) {
      // Lấy danh sách ảnh để xóa file sau khi commit (nếu cần kỹ)
      // const variantsToDelete = await ProductVariant.findAll({ where: { id: deleted_ids } });

      // Xóa Options trước
      await VariantOption.destroy({
        where: { variant_id: deleted_ids },
        transaction: t
      });
      // Xóa Variants
      await ProductVariant.destroy({
        where: { id: deleted_ids },
        transaction: t
      });
    }

    // --- PHASE 2: UPDATE ---
    if (updated.length > 0) {
      for (const item of updated) {
        const variant = await ProductVariant.findByPk(item.id, { transaction: t });
        if (!variant) continue;

        const updateData = { ...item };
        if (item.price !== undefined) {
          updateData.sale_price = calculateSalePrice(parseFloat(item.price), product);
        }

        await variant.update(updateData, { transaction: t });

        // Update Options: Xóa cũ tạo mới
        if (item.options && item.options.length > 0) {
          await VariantOption.destroy({ where: { variant_id: variant.id }, transaction: t });
          const opts = item.options.map(o => ({
            variant_id: variant.id,
            attribute_name: o.attribute_name,
            attribute_value: o.attribute_value
          }));
          await VariantOption.bulkCreate(opts, { transaction: t });
        }
      }
    }

    // --- PHASE 3: CREATE ---
    if (created.length > 0) {
      const newVariantsData = created.map(item => ({
        product_id,
        sku: item.sku,
        price: item.price,
        sale_price: calculateSalePrice(parseFloat(item.price), product),
        stock_quantity: item.stock_quantity || 0,
        image_url: item.image_url,
        _options: item.options // Lưu tạm
      }));

      const createdRecords = await ProductVariant.bulkCreate(newVariantsData, {
        transaction: t,
        returning: true
      });

      // Map options với ID vừa tạo
      let newOptionsData = [];
      createdRecords.forEach((rec, idx) => {
        const opts = newVariantsData[idx]._options;
        if (opts) {
          opts.forEach(o => {
            newOptionsData.push({
              variant_id: rec.id,
              attribute_name: o.attribute_name,
              attribute_value: o.attribute_value
            });
          });
        }
      });

      if (newOptionsData.length > 0) {
        await VariantOption.bulkCreate(newOptionsData, { transaction: t });
      }
    }

    // --- COMMIT ---
    await t.commit();

    // Side effect: Sync price range for product
    try {
      await syncProductPriceWithVariants(product_id);
    } catch (e) { console.error("Sync price warning:", e); }

    res.json({ message: 'Sync variants successfully' });

  } catch (error) {
    if (t) await t.rollback();
    console.error('Sync variants error:', error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getProductVariants = async (req, res) => {
  try {
    const product_id = req.params.id;
    const variants = await ProductVariant.findAll({
      where: { product_id },
      include: [
        { model: VariantOption, as: 'VariantOptions' } // Lấy kèm options để hiển thị
      ],
      order: [['id', 'ASC']]
    });
    res.json(variants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
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
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createProductVariant = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // 1. Validate
    const { error } = productVariantSchema.validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.details[0].message });
    }

    // 2. Xử lý ảnh
    let imageUrl = req.body.image_url || null;
    if (req.file) {
      const fileName = `products/${Date.now()}-${req.file.originalname}`;
      imageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
    }

    // 3. Logic tính giá
    let salePrice = req.body.price;
    const originalPrice = parseFloat(req.body.price);

    const product = await Product.findByPk(req.body.product_id, {
      include: [{ model: Promotion, as: 'Promotion' }],
      transaction: t
    });

    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.Promotion && product.Promotion.is_active) {
      const { discount_type, discount_value } = product.Promotion;
      const val = parseFloat(discount_value);
      if (discount_type === 'percentage') {
        salePrice = originalPrice - (originalPrice * (val / 100));
      } else {
        salePrice = originalPrice - val;
      }
      salePrice = Math.max(0, salePrice);
    }

    // 4. Tạo Variant
    const productVariant = await ProductVariant.create({
      ...req.body,
      image_url: imageUrl,
      sale_price: salePrice
    }, { transaction: t });

    // 5. Tạo Variant Options (QUAN TRỌNG)
    // Tự động thêm options ngay trong lúc tạo variant
    const optionsRaw = parseOptions(req.body.options);
    if (optionsRaw && optionsRaw.length > 0) {
      const optionsData = optionsRaw.map(opt => ({
        variant_id: productVariant.id,
        attribute_name: opt.attribute_name,
        attribute_value: opt.attribute_value
      }));

      await VariantOption.bulkCreate(optionsData, { transaction: t });
    }

    await t.commit();

    // 6. Sync side effect
    try {
      await syncProductPriceWithVariants(productVariant.product_id);
    } catch (e) { console.error("Sync price error:", e); }

    // Trả về data đầy đủ bao gồm cả options vừa tạo
    const result = await ProductVariant.findByPk(productVariant.id, {
      include: [{ model: VariantOption, as: 'VariantOptions' }]
    });

    res.status(201).json(result);

  } catch (error) {
    if (t) await t.rollback();
    console.error(error);
    // Xử lý lỗi unique constraint (ví dụ trùng SKU hoặc trùng Option)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'SKU or Option combination already exists.' });
    }
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updateProductVariant = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { error } = productVariantSchema.validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.details[0].message });
    }

    const productVariant = await ProductVariant.findByPk(req.params.id, {
      include: [{
        model: Product,
        as: 'Product', // Sửa lại alias cho khớp với model definition (thường là PascalCase nếu không define khác)
        include: [{ model: Promotion, as: 'Promotion' }]
      }],
      transaction: t
    });

    if (!productVariant) {
      await t.rollback();
      return res.status(404).json({ error: 'ProductVariant not found' });
    }

    const updateData = { ...req.body };

    // 1. Xử lý ảnh
    if (req.file) {
      const fileName = `products/${Date.now()}-${req.file.originalname}`;
      const newImageUrl = await uploadFile(fileName, req.file.buffer, req.file.mimetype);
      updateData.image_url = newImageUrl;
      if (productVariant.image_url) {
        // Fire and forget delete old file
        deleteFile(productVariant.image_url).catch(e => console.error(e));
      }
    }

    // 2. Tính giá lại nếu price thay đổi
    if (req.body.price !== undefined) {
      const originalPrice = parseFloat(req.body.price);
      const product = productVariant.Product;
      const promotion = product ? product.Promotion : null;
      let newSalePrice = originalPrice;

      if (promotion && promotion.is_active) {
        const discountValue = parseFloat(promotion.discount_value);
        if (promotion.discount_type === 'percentage') {
          newSalePrice = originalPrice - (originalPrice * (discountValue / 100));
        } else {
          newSalePrice = originalPrice - discountValue;
        }
        newSalePrice = Math.max(0, newSalePrice);
      }
      updateData.sale_price = newSalePrice;
    }

    // 3. Update Variant Info
    await productVariant.update(updateData, { transaction: t });

    // 4. Update Options (QUAN TRỌNG: Replace strategy)
    // Nếu client gửi options lên, ta xóa cũ đi tạo mới (đơn giản và an toàn nhất cho biến thể)
    const optionsRaw = parseOptions(req.body.options);
    if (req.body.options !== undefined) { // Chỉ update nếu trường options có tồn tại trong request
      // Xóa hết options cũ của variant này
      await VariantOption.destroy({
        where: { variant_id: productVariant.id },
        transaction: t
      });

      if (optionsRaw.length > 0) {
        const optionsData = optionsRaw.map(opt => ({
          variant_id: productVariant.id,
          attribute_name: opt.attribute_name,
          attribute_value: opt.attribute_value
        }));
        await VariantOption.bulkCreate(optionsData, { transaction: t });
      }
    }

    await t.commit();

    try {
      await syncProductPriceWithVariants(productVariant.product_id);
    } catch (syncError) { console.error("Sync price warning:", syncError); }

    // Trả về data mới nhất kèm options
    const updatedVariant = await ProductVariant.findByPk(req.params.id, {
      include: [{ model: VariantOption, as: 'VariantOptions' }]
    });

    res.json(updatedVariant);

  } catch (error) {
    if (t) await t.rollback();
    console.error('Update variant error:', error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deleteProductVariant = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const productVariant = await ProductVariant.findByPk(req.params.id, { transaction: t });
    if (!productVariant) {
      await t.rollback();
      return res.status(404).json({ error: 'ProductVariant not found' });
    }

    // 1. Xóa ảnh
    if (productVariant.image_url) {
      const fileName = productVariant.image_url.split('/').pop();
      // Không cần await delete file để tránh block main thread lâu, lỗi file rác xử lý sau
      deleteFile(`product-variants/${fileName}`).catch(console.error);
    }

    // 2. Xóa Options trước (Dù database có thể có cascade, xóa code cho chắc chắn logic)
    await VariantOption.destroy({
      where: { variant_id: req.params.id },
      transaction: t
    });

    // 3. Xóa Variant
    const productId = productVariant.product_id; // Lưu lại để sync
    await productVariant.destroy({ transaction: t });

    await t.commit();

    // 4. Sync lại giá min/max của Product cha
    try {
      await syncProductPriceWithVariants(productId);
    } catch (e) { console.error(e); }

    res.json({ message: 'ProductVariant deleted' });
  } catch (error) {
    if (t) await t.rollback();
    console.error(error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};