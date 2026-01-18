const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  post_id: { type: DataTypes.BIGINT, allowNull: false },
  user_id: { type: DataTypes.BIGINT },
  author_name: { type: DataTypes.STRING(255) },
  author_email: { type: DataTypes.STRING(100) },
  content: { type: DataTypes.TEXT, allowNull: false },
  is_approved: { type: DataTypes.BOOLEAN, defaultValue: false },
  parent_id: { type: DataTypes.BIGINT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false });

// Remove associations here

module.exports = Comment;
