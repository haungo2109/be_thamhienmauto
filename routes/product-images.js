const express = require('express');
const { getProductImages, getProductImage, createProductImage, updateProductImage, deleteProductImage } = require('../controllers/productImageController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', adminAuth, getProductImages);
router.get('/:id', adminAuth, getProductImage);
router.post('/', adminAuth, createProductImage);
router.put('/:id', adminAuth, updateProductImage);
router.delete('/:id', adminAuth, deleteProductImage);

module.exports = router;
