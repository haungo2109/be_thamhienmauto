const express = require('express');
const { getPostMetas, getPostMeta, createPostMeta, updatePostMeta, deletePostMeta } = require('../controllers/postMetaController');
const router = express.Router();

router.get('/', getPostMetas);
router.get('/:id', getPostMeta);
router.post('/', createPostMeta);
router.put('/:id', updatePostMeta);
router.delete('/:id', deletePostMeta);

module.exports = router;
