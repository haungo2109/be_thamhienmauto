const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  discount_type: { type: DataTypes.ENUM('fixed_cart', 'percent', 'free_ship'), defaultValue: 'fixed_cart' },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  min_spend: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  usage_limit: { type: DataTypes.INTEGER, defaultValue: 0 },
  usage_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  expiry_date: { type: DataTypes.DATE },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Coupon;
