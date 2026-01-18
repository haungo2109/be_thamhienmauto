const PostMeta = require('../models/PostMeta');

exports.getPostMetas = async (req, res) => {
  const postMetas = await PostMeta.findAll({ include: 'Post' });
  res.json(postMetas);
};

exports.getPostMeta = async (req, res) => {
  const postMeta = await PostMeta.findByPk(req.params.id, { include: 'Post' });
  if (!postMeta) return res.status(404).json({ error: 'PostMeta not found' });
  res.json(postMeta);
};

exports.createPostMeta = async (req, res) => {
  const postMeta = await PostMeta.create(req.body);
  res.status(201).json(postMeta);
};

exports.updatePostMeta = async (req, res) => {
  const postMeta = await PostMeta.findByPk(req.params.id);
  if (!postMeta) return res.status(404).json({ error: 'PostMeta not found' });
  await postMeta.update(req.body);
  res.json(postMeta);
};

exports.deletePostMeta = async (req, res) => {
  const postMeta = await PostMeta.findByPk(req.params.id);
  if (!postMeta) return res.status(404).json({ error: 'PostMeta not found' });
  await postMeta.destroy();
  res.json({ message: 'PostMeta deleted' });
};
