const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  sku: { type: DataTypes.STRING(100), unique: true },
  price: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
  sale_price: { type: DataTypes.DECIMAL(15, 2) },
  stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  stock_status: { type: DataTypes.ENUM('in_stock', 'out_of_stock', 'backorder'), defaultValue: 'in_stock' },
  image_url: { type: DataTypes.STRING(255) },
  category_id: { type: DataTypes.BIGINT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Product;
