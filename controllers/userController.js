const User = require('../models/User');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(1).max(100).required(),
  phone: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  password: Joi.string().min(6),
  name: Joi.string().min(1).max(100),
  phone: Joi.string().optional(),
  role: Joi.string().valid('user', 'admin') // Chỉ admin có thể thay đổi role
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

exports.getUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const where = {};
    if (q) {
      where.name = { [Op.iLike]: `%${q}%` };
    }

    const result = await paginate(User, {
      req,
      where,
      attributes: { 
        exclude: ['password_hash'],
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "Orders"
              WHERE "Orders".user_id = "User".id
            )`),
            'total_orders'
          ],
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(total_amount), 0)
              FROM "Orders"
              WHERE "Orders".user_id = "User".id
            )`),
            'total_spending'
          ]
        ]
      }
    });
    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { 
        exclude: ['password_hash'],
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "Orders"
              WHERE "Orders".user_id = "User".id
            )`),
            'total_orders'
          ],
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(total_amount), 0)
              FROM "Orders"
              WHERE "Orders".user_id = "User".id
            )`),
            'total_spending'
          ]
        ]
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { error } = createUserSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password, name, phone } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash, name, phone, role: 'subscriber' });
    const { password_hash: _, ...userWithoutPassword } = user.toJSON();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { error } = updateUserSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Kiểm tra quyền: chỉ admin hoặc chính user
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Nếu không phải admin, không cho thay đổi role
    if (req.user.role !== 'admin' && req.body.role) {
      return res.status(403).json({ error: 'Cannot change role' });
    }

    const { password, ...updateData } = req.body;
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);
    const { password_hash: _, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    const { password_hash: _, ...userInfo } = user.toJSON();
    res.json({ token, ...userInfo });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { error } = changePasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user || !await bcrypt.compare(oldPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Incorrect old password' });
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};
