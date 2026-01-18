const express = require('express');
const { getProductVariants, getProductVariant, createProductVariant, updateProductVariant, deleteProductVariant } = require('../controllers/productVariantController');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', adminAuth, getProductVariants);
router.get('/:id', adminAuth, getProductVariant);
router.post('/', adminAuth, upload.single('image'), createProductVariant);
router.put('/:id', adminAuth, updateProductVariant);
router.delete('/:id', adminAuth, deleteProductVariant);

module.exports = router;
