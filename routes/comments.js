const express = require('express');
const { getComments, getComment, createComment, updateComment, deleteComment } = require('../controllers/commentController');
const router = express.Router();

router.get('/', getComments);
router.get('/:id', getComment);
router.post('/', createComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
