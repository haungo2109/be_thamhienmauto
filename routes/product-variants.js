const express = require('express');
const { getProductVariants, getProductVariant, createProductVariant, updateProductVariant, deleteProductVariant } = require('../controllers/productVariantController');
const router = express.Router();

router.get('/', getProductVariants);
router.get('/:id', getProductVariant);
router.post('/', createProductVariant);
router.put('/:id', updateProductVariant);
router.delete('/:id', deleteProductVariant);

module.exports = router;
