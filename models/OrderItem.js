const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.BIGINT,
    allowNull: false
    // References sẽ được setup trong file index associations
  },
  product_id: {
    type: DataTypes.BIGINT,
    allowNull: true // Cho phép null nếu sản phẩm gốc bị xóa
  },
  // --- SNAPSHOT DATA ---
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  variant_id: {
    type: DataTypes.BIGINT,
    allowNull: true // Null nếu sản phẩm không có biến thể
  },
  variant_name: {
    type: DataTypes.STRING(255),
    allowNull: true // VD: "Màu sắc: Đỏ, Đời xe: 2018" chỉ lưu ds tên thuộc tính và giá trị của nó với affects_price=true
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // --- FINANCIAL DATA ---
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_price: { // Giá của 1 sản phẩm
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  subtotal: { // = quantity * unit_price
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = OrderItem;
