const express = require('express');
const { getPosts, getPost, createPost, updatePost, deletePost } = require('../controllers/postController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', adminAuth, createPost);
router.put('/:id', adminAuth, updatePost);
router.delete('/:id', adminAuth, deletePost);

module.exports = router;
