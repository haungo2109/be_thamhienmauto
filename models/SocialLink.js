const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SocialLink = sequelize.define('SocialLink', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  platform: { type: DataTypes.STRING(50) },
  icon: { type: DataTypes.STRING(50) },
  url: { type: DataTypes.STRING(255) },
  contact_id: { type: DataTypes.BIGINT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = SocialLink;
