const express = require('express');
const { getComments, getComment, createComment, updateComment, deleteComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', getComments);
router.get('/:id', getComment);
router.post('/', auth, createComment);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);

module.exports = router;
