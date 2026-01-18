const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostMeta = sequelize.define('PostMeta', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  post_id: { type: DataTypes.BIGINT, allowNull: false },
  meta_key: { type: DataTypes.STRING(255), allowNull: false },
  meta_value: { type: DataTypes.TEXT },
}, { timestamps: false });

module.exports = PostMeta;
