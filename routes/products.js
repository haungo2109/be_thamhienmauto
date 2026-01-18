const express = require('express');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', adminAuth, upload.single('image'), createProduct);
router.put('/:id', adminAuth, upload.single('image'), updateProduct);
router.delete('/:id', adminAuth, deleteProduct);

module.exports = router;
