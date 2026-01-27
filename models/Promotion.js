const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Promotion = sequelize.define('Promotion', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  type: { 
    type: DataTypes.ENUM('flash_sale', 'discount_program'), 
    allowNull: false 
  },
  start_date: { type: DataTypes.DATE, allowNull: false },
  end_date: { type: DataTypes.DATE, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  discount_type: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false, defaultValue: 'percentage' },
  discount_value: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  description: { type: DataTypes.TEXT },
}, { 
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at' });

module.exports = Promotion;
