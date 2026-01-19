const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShippingConfig = sequelize.define('ShippingConfig', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  base_fee: { type: DataTypes.INTEGER, defaultValue: 30000 },
  free_shipping_threshold: { type: DataTypes.INTEGER, defaultValue: 500000 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = ShippingConfig;
