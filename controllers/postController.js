const Post = require('../models/Post');
const User = require('../models/User');
const PostCategory = require('../models/PostCategory');
const Joi = require('joi');
const slugify = require('slugify');
const { paginate } = require('../utils/pagination');

const postSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  content: Joi.string(),
  excerpt: Joi.string().max(500),
  status: Joi.string().valid('published', 'draft', 'archived'),
  category_id: Joi.number().integer()
});

exports.getPosts = async (req, res) => {
  try {
    const result = await paginate(Post, {
      req,
      include: [
        { model: User, as: 'User', attributes: ['id', 'name'] },
        { model: PostCategory, as: 'PostCategory' }
      ]
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'name'] },
        { model: PostCategory, as: 'PostCategory' }
      ]
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { error } = postSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { title, ...data } = req.body;
    const slug = slugify(title, { lower: true });
    const post = await Post.create({
      ...data,
      title,
      slug,
      author_id: req.user.id
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { error } = postSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { title, ...data } = req.body;
    if (title) data.slug = slugify(title, { lower: true });
    await post.update(data);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    await post.destroy();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: `Internal server error ${JSON.stringify(error)}` });
  }
};
