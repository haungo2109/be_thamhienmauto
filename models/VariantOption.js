const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VariantOption = sequelize.define('VariantOption', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  variant_id: { type: DataTypes.BIGINT, allowNull: false, unique: 'variant_attribute_unique' },
  attribute_name: { 
    type: DataTypes.STRING(50), 
    allowNull: false, 
    unique: 'variant_attribute_unique',
    references: { model: 'Attribute', key: 'attribute_name' } 
  },
  attribute_value: { type: DataTypes.STRING(50), allowNull: false },
  affects_price: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { 
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['variant_id', 'attribute_name']
    }
  ]
});

module.exports = VariantOption;
