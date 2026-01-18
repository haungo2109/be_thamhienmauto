const express = require('express');
const { getProductVariants, getProductVariant, createProductVariant, updateProductVariant, deleteProductVariant } = require('../controllers/productVariantController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', adminAuth, getProductVariants);
router.get('/:id', adminAuth, getProductVariant);
router.post('/', adminAuth, createProductVariant);
router.put('/:id', adminAuth, updateProductVariant);
router.delete('/:id', adminAuth, deleteProductVariant);

module.exports = router;
