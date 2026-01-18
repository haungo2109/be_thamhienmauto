const express = require('express');
const { getPostMetas, getPostMeta, createPostMeta, updatePostMeta, deletePostMeta } = require('../controllers/postMetaController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', adminAuth, getPostMetas);
router.get('/:id', adminAuth, getPostMeta);
router.post('/', adminAuth, createPostMeta);
router.put('/:id', adminAuth, updatePostMeta);
router.delete('/:id', adminAuth, deletePostMeta);

module.exports = router;
