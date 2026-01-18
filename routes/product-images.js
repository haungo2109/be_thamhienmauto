const express = require('express');
const { getProductImages, getProductImage, createProductImage, updateProductImage, deleteProductImage } = require('../controllers/productImageController');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', adminAuth, getProductImages);
router.get('/:id', adminAuth, getProductImage);
router.post('/', adminAuth, upload.single('image'), createProductImage);
router.put('/:id', adminAuth, updateProductImage);
router.delete('/:id', adminAuth, deleteProductImage);

module.exports = router;
