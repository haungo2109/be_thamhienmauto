const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attribute = sequelize.define('Attribute', {
  attribute_name: { type: DataTypes.STRING(50), primaryKey: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Attribute;