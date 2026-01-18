const Comment = require('../models/Comment');

exports.getComments = async (req, res) => {
  const comments = await Comment.findAll({ include: ['Post', 'User', 'parent'] });
  res.json(comments);
};

exports.getComment = async (req, res) => {
  const comment = await Comment.findByPk(req.params.id, { include: ['Post', 'User', 'parent'] });
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  res.json(comment);
};

exports.createComment = async (req, res) => {
  const comment = await Comment.create(req.body);
  res.status(201).json(comment);
};

exports.updateComment = async (req, res) => {
  const comment = await Comment.findByPk(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  await comment.update(req.body);
  res.json(comment);
};

exports.deleteComment = async (req, res) => {
  const comment = await Comment.findByPk(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  await comment.destroy();
  res.json({ message: 'Comment deleted' });
};
