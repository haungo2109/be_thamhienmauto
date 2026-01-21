const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserAddress = sequelize.define('UserAddress', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  receiver_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  receiver_phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  address_type: {
    type: DataTypes.ENUM('home', 'office'),
    defaultValue: 'home'
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false
});

module.exports = UserAddress;
