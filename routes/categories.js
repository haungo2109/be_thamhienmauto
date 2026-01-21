const express = require('express');
const { getCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { getProductsByCategory } = require('../controllers/productController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategory);
router.get('/:id/products', getProductsByCategory);
router.post('/', adminAuth, createCategory);
router.put('/:id', adminAuth, updateCategory);
router.delete('/:id', adminAuth, deleteCategory);

module.exports = router;
