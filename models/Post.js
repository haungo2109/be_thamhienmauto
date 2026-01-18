const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  author_id: { type: DataTypes.BIGINT, allowNull: false },
  title: { type: DataTypes.TEXT, allowNull: false },
  slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  content: { type: DataTypes.TEXT },
  excerpt: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('published', 'draft', 'archived'), defaultValue: 'draft' },
  category_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

module.exports = Post;
