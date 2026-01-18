const express = require('express');
const { getVariantOptions, getVariantOption, createVariantOption, updateVariantOption, deleteVariantOption } = require('../controllers/variantOptionController');
const router = express.Router();

router.get('/', getVariantOptions);
router.get('/:id', getVariantOption);
router.post('/', createVariantOption);
router.put('/:id', updateVariantOption);
router.delete('/:id', deleteVariantOption);

module.exports = router;
