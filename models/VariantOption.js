const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VariantOption = sequelize.define('VariantOption', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  variant_id: { type: DataTypes.BIGINT, allowNull: false },
  attribute_name: { type: DataTypes.STRING(50), allowNull: false },
  attribute_value: { type: DataTypes.STRING(50), allowNull: false },
}, { timestamps: false });

module.exports = VariantOption;
