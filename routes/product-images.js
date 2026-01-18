const express = require('express');
const { getProductImages, getProductImage, createProductImage, updateProductImage, deleteProductImage } = require('../controllers/productImageController');
const router = express.Router();

router.get('/', getProductImages);
router.get('/:id', getProductImage);
router.post('/', createProductImage);
router.put('/:id', updateProductImage);
router.delete('/:id', deleteProductImage);

module.exports = router;
