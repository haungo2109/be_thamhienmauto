const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.BIGINT },
  order_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  status: { 
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled', 'returned'), 
    defaultValue: 'pending' 
  },
  sub_total: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.00 },
  shipping_fee: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.00 },
  tax_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.00 },
  coupon_code: { type: DataTypes.STRING(50) },
  discount_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.00 },
  total_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  shipping_name: { type: DataTypes.STRING(255), allowNull: false },
  shipping_address: { type: DataTypes.TEXT, allowNull: false },
  shipping_phone: { type: DataTypes.STRING(20), allowNull: false },
  shipping_email: { type: DataTypes.STRING(100) },
  note: { type: DataTypes.TEXT },
  payment_method_id: { type: DataTypes.STRING(50), allowNull: false },
  shipping_partner_id: { type: DataTypes.BIGINT }, 
  tracking_number: { type: DataTypes.STRING(100) },
  cancelled_at: { type: DataTypes.DATE },
  completed_at: { type: DataTypes.DATE },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Order;
