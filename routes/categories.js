const express = require('express');
const { getCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', adminAuth, upload.single('image'), createCategory);
router.put('/:id', adminAuth, upload.single('image'), updateCategory);
router.delete('/:id', adminAuth, deleteCategory);

module.exports = router;
