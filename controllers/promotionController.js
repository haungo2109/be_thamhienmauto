const Promotion = require('../models/Promotion');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

const promotionSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  type: Joi.string().valid('flash_sale', 'discount_program').required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().greater(Joi.ref('start_date')).required(),
  is_active: Joi.boolean(),
  description: Joi.string().allow('', null),
  discount_type: Joi.string().valid('percentage', 'fixed').required(),
  discount_value: Joi.number().min(0).required(),
  product_ids: Joi.array().items(Joi.number()).default([])
});

const updateProductsPromotion = async (promotion, productIds, discountType, discountValue, t) => {
  // ==========================================
  // 1. RESET CODE (Xử lý hàng loạt)
  // ==========================================
  // Tìm các sản phẩm đang áp dụng promotion này nhưng KHÔNG nằm trong danh sách mới (nếu muốn giữ lại cái cũ)
  // Hoặc đơn giản là Reset hết các sản phẩm đang dính promotion.id này
  
  // Reset Variants của các Product cũ về giá gốc (= price)
  // Logic: Update bảng Variant nơi mà product_id nằm trong danh sách products có promotion_id cũ
  await ProductVariant.update(
    { 
      sale_price: Sequelize.col('price') // Reset về bằng giá gốc
    },
    {
      where: {
        product_id: {
          [Op.in]: Sequelize.literal(`(SELECT id FROM "Products" WHERE promotion_id = ${promotion.id})`)
        }
      },
      transaction: t
    }
  );

  // Reset Products cũ về giá gốc
  await Product.update(
    { 
      promotion_id: null, 
      sale_price: Sequelize.col('price') // Reset về bằng giá gốc
    },
    { 
      where: { promotion_id: promotion.id },
      transaction: t
    }
  );

  // ==========================================
  // 2. APPLY CODE (Tính toán trực tiếp bằng SQL)
  // ==========================================
  if (productIds && productIds.length > 0) {
    
    let priceFormula;

    // Xây dựng công thức tính giá cho SQL
    if (discountType === 'percentage') {
      // Giá = Giá - (Giá * value / 100)
      // Dùng GREATEST(0, ...) để đảm bảo không âm
      priceFormula = Sequelize.literal(`GREATEST(0, price - (price * ${discountValue} / 100))`);
    } else {
      // Giá = Giá - value
      priceFormula = Sequelize.literal(`GREATEST(0, price - ${discountValue})`);
    }

    // 2.1. Update Variants trước (Update hàng loạt 1 lệnh duy nhất)
    await ProductVariant.update(
      { sale_price: priceFormula },
      { 
        where: { product_id: { [Op.in]: productIds } },
        transaction: t
      }
    );

    // 2.2. Update Products (Update hàng loạt 1 lệnh duy nhất)
    // Lưu ý: Logic này giả định promotion áp lên giá gốc của Product
    // Nếu logic của bạn là Product.sale_price phải lấy MIN từ Variant, thì đoạn này cần query phức tạp hơn chút.
    // Nhưng tạm thời áp dụng công thức vào Product luôn cho đồng bộ:
    await Product.update(
      { 
        promotion_id: promotion.id,
        sale_price: priceFormula 
      },
      { 
        where: { id: { [Op.in]: productIds } },
        transaction: t
      }
    );
  }
};

exports.getPromotions = async (req, res) => {
  try {
    const result = await paginate(Promotion, {
      req,
      order: [['created_at', 'DESC']]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByPk(req.params.id, {
      include: [{
        model: Product,
        as: 'Products',
        attributes: ['id', 'name', 'price', 'image_url', 'sale_price'],
      }]
    });
    if (!promotion) return res.status(404).json({ error: 'Promotion not found' });
    res.json(promotion);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createPromotion = async (req, res) => {
  // 1. Khởi tạo transaction
  const t = await sequelize.transaction();

  try {
    const { error } = promotionSchema.validate(req.body);
    if (error) {
      // Validate fail thì chưa có gì xảy ra với DB nên ko cần rollback, 
      // nhưng nên commit/rollback empty transaction hoặc đơn giản là return
      await t.rollback(); 
      return res.status(400).json({ error: error.details[0].message });
    }

    const { product_ids, ...promotionData } = req.body;

    // 2. Pass transaction "t" vào hàm create
    const promotion = await Promotion.create(promotionData, { transaction: t });
    
    // 3. Pass transaction "t" vào hàm update logic
    // LƯU Ý: Bạn cần sửa hàm updateProductsPromotion để nhận tham số transaction
    await updateProductsPromotion(
        promotion, 
        product_ids, 
        promotion.discount_type, 
        promotion.discount_value, 
        t // <--- Truyền transaction vào đây
    );

    // 4. Nếu mọi thứ OK, commit transaction (Lưu chính thức)
    await t.commit();

    res.status(201).json(promotion);

  } catch (error) {
    // 5. Có lỗi -> Rollback (Xóa Promotion vừa tạo, hoàn tác giá sản phẩm)
    console.error('Create promotion error:', error);
    await t.rollback();
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updatePromotion = async (req, res) => {
  // 1. Bắt đầu Transaction
  const t = await sequelize.transaction();

  try {
    const { error } = promotionSchema.validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.details[0].message });
    }

    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion) {
      await t.rollback();
      return res.status(404).json({ error: 'Promotion not found' });
    }

    const { product_ids, ...promotionData } = req.body;

    // 2. Kiểm tra xem có cần thiết phải tính lại giá không?
    // Chỉ tính lại khi: Thay đổi loại giảm giá, giá trị giảm, hoặc danh sách sản phẩm
    const needRecalculatePrice = 
      promotionData.discount_type !== promotion.discount_type ||
      promotionData.discount_value !== promotion.discount_value ||
      (product_ids && product_ids.length > 0); // Hoặc logic check xem mảng cũ/mới có khác nhau k

    // 3. Update thông tin Promotion
    await promotion.update(promotionData, { transaction: t });

    // 4. Chỉ chạy tính toán nặng nếu cần thiết
    if (needRecalculatePrice) {
       // Lưu ý: updateProductsPromotion phải hỗ trợ tham số transaction (t)
       // Hàm này sẽ tự động reset các sp cũ ko còn trong list và apply cho sp mới
       await updateProductsPromotion(
         promotion, 
         product_ids, 
         promotion.discount_type, 
         promotion.discount_value, 
         t
       );
    }

    // 5. Commit thành công
    await t.commit();
    res.json(promotion);

  } catch (error) {
    // 6. Rollback nếu có lỗi bất kỳ đâu
    await t.rollback();
    console.error('Update promotion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deletePromotion = async (req, res) => {
  const t = await sequelize.transaction(); // Bắt buộc dùng Transaction để an toàn

  try {
    const promotionId = req.params.id;
    const promotion = await Promotion.findByPk(promotionId);

    if (!promotion) {
      await t.rollback();
      return res.status(404).json({ error: 'Promotion not found' });
    }

    // BƯỚC 1: Reset giá của VARIANTS về giá gốc (price)
    // Logic: Tìm tất cả variants thuộc về các products đang dính promotion này
    await ProductVariant.update(
      { 
        sale_price: Sequelize.col('price') // Copy giá trị cột price sang sale_price
      },
      {
        where: {
          product_id: {
            [Op.in]: Sequelize.literal(`(SELECT id FROM "Products" WHERE promotion_id = ${promotionId})`)
          }
        },
        transaction: t
      }
    );

    // BƯỚC 2: Reset giá của PRODUCTS về giá gốc và gỡ promotion_id
    await Product.update(
      { 
        promotion_id: null, 
        sale_price: Sequelize.col('price') // Reset về giá gốc
      }, 
      { 
        where: { promotion_id: promotionId },
        transaction: t
      }
    );
    
    // BƯỚC 3: Xóa Promotion
    await promotion.destroy({ transaction: t });

    await t.commit(); // Lưu tất cả thay đổi
    res.json({ message: 'Promotion deleted and prices reverted' });

  } catch (error) {
    await t.rollback(); // Hoàn tác nếu lỗi
    console.error('Delete promotion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
