const PostMeta = require('../models/PostMeta');
const Post = require('../models/Post');
const Joi = require('joi');
const { paginate } = require('../utils/pagination');

const postMetaSchema = Joi.object({
  post_id: Joi.number().integer().required(),
  meta_key: Joi.string().min(1).max(255).required(),
  meta_value: Joi.string()
});

exports.getPostMetas = async (req, res) => {
  try {
    const result = await paginate(PostMeta, {
      req,
      include: [{ model: Post, as: 'Post' }]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getPostMeta = async (req, res) => {
  try {
    const postMeta = await PostMeta.findByPk(req.params.id, {
      include: [{ model: Post, as: 'Post' }]
    });
    if (!postMeta) return res.status(404).json({ error: 'PostMeta not found' });
    res.json(postMeta);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createPostMeta = async (req, res) => {
  try {
    const { error } = postMetaSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const postMeta = await PostMeta.create(req.body);
    res.status(201).json(postMeta);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updatePostMeta = async (req, res) => {
  try {
    const { error } = postMetaSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const postMeta = await PostMeta.findByPk(req.params.id);
    if (!postMeta) return res.status(404).json({ error: 'PostMeta not found' });

    await postMeta.update(req.body);
    res.json(postMeta);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deletePostMeta = async (req, res) => {
  try {
    const postMeta = await PostMeta.findByPk(req.params.id);
    if (!postMeta) return res.status(404).json({ error: 'PostMeta not found' });

    await postMeta.destroy();
    res.json({ message: 'PostMeta deleted' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};
