const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductImage = sequelize.define('ProductImage', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.BIGINT, allowNull: false },
  image_url: { type: DataTypes.STRING(255), allowNull: false },
  display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { timestamps: false });

module.exports = ProductImage;
