
/**
 * Helper để parse options khi gửi qua multipart/form-data
 * Vì form-data biến mọi thứ thành string, nên array object sẽ bị stringify.
 */
export const parseOptions = (optionsData) => {
  if (!optionsData) return [];
  if (typeof optionsData === 'string') {
    try {
      return JSON.parse(optionsData);
    } catch (e) {
      return [];
    }
  }
  return optionsData;
};

// Helper tính giá
export const calculateSalePrice = (originalPrice) => {
  let salePrice = originalPrice;
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
  return salePrice;
};