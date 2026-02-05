const express = require('express');
const { getVariantOptions, getVariantOption, createVariantOption, updateVariantOption, deleteVariantOption, getBrands, getModelsByBrand } = require('../controllers/variantOptionController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/brands', getBrands);
router.get('/models', getModelsByBrand);
router.get('/', adminAuth, getVariantOptions);
router.get('/:id', adminAuth, getVariantOption);
router.post('/', adminAuth, createVariantOption);
router.put('/:id', adminAuth, updateVariantOption);
router.delete('/:id', adminAuth, deleteVariantOption);

module.exports = router;
