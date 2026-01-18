const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');

const Post = sequelize.define('Post', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  author_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: User, key: 'id' } },
  title: { type: DataTypes.TEXT, allowNull: false },
  slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  content: { type: DataTypes.TEXT },
  excerpt: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('published', 'draft', 'archived'), defaultValue: 'draft' },
  post_type: { type: DataTypes.ENUM('post', 'page'), defaultValue: 'post' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

Post.belongsTo(User, { foreignKey: 'author_id' });
Post.belongsToMany(Category, { through: 'post_categories', foreignKey: 'post_id' });

module.exports = Post;
