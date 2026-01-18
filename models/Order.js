const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT },
  order_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled', 'refunded'), defaultValue: 'pending' },
  total_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  coupon_code: { type: DataTypes.STRING(50) },
  discount_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.00 },
  shipping_name: { type: DataTypes.STRING(255), allowNull: false },
  shipping_address: { type: DataTypes.TEXT, allowNull: false },
  shipping_phone: { type: DataTypes.STRING(20), allowNull: false },
  shipping_email: { type: DataTypes.STRING(100) },
  note: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Order;
