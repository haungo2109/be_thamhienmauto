const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Popup = sequelize.define('Popup', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  image_url: { type: DataTypes.STRING(255) },
  discount_code: { type: DataTypes.STRING(50) },
  frequency: { type: DataTypes.STRING(50), defaultValue: '1 lần/phiên' },
  button_text: { type: DataTypes.STRING(100), allowNull: false },
  button_link: { type: DataTypes.STRING(255), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Popup;
