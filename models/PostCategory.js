const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostCategory = sequelize.define('PostCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  parent_id: { type: DataTypes.INTEGER, allowNull: true }
}, { timestamps: false });

module.exports = PostCategory;