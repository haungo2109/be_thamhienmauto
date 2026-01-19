const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const commentSchema = Joi.object({
  post_id: Joi.number().integer().required(),
  content: Joi.string().min(1).max(1000).required(),
  parent_id: Joi.number().integer()
});

exports.getComments = async (req, res) => {
  try {
    const result = await paginate(Comment, {
      req,
      include: [
        { model: Post, as: 'Post' },
        { model: User, as: 'User', attributes: ['id', 'username', 'name'] },
        { model: Comment, as: 'parent' }
      ]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id, {
      include: [
        { model: Post, as: 'Post' },
        { model: User, as: 'User', attributes: ['id', 'username', 'name'] },
        { model: Comment, as: 'parent' }
      ]
    });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { error } = commentSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const comment = await Comment.create({
      ...req.body,
      user_id: req.user.id,
      is_approved: true
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { error } = commentSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await comment.update(req.body);
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
