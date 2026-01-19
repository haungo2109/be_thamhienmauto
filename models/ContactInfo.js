const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactInfo = sequelize.define('ContactInfo', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  hotline: { type: DataTypes.STRING(50) },
  email: { type: DataTypes.STRING(100) },
  address: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = ContactInfo;
