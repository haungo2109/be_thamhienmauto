const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductVariant = sequelize.define('ProductVariant', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.BIGINT, allowNull: false },
  sku: { type: DataTypes.STRING(100), unique: true },
  price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  image_url: { type: DataTypes.STRING(255) },
}, { timestamps: false });

module.exports = ProductVariant;
