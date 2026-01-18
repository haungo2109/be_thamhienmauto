const Post = require('../models/Post');

exports.getPosts = async (req, res) => {
  const posts = await Post.findAll({ include: ['User', 'Categories'] });
  res.json(posts);
};

exports.createPost = async (req, res) => {
  const post = await Post.create(req.body);
  res.status(201).json(post);
};
