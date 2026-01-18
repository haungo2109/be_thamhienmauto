const express = require('express');
const { getPostCategories, getPostCategory, createPostCategory, updatePostCategory, deletePostCategory } = require('../controllers/postCategoryController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', auth, getPostCategories);
router.get('/:id', auth, getPostCategory);
router.post('/', adminAuth, createPostCategory);
router.put('/:id', adminAuth, updatePostCategory);
router.delete('/:id', adminAuth, deletePostCategory);

module.exports = router;