const express = require('express');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, uploadImage } = require('../controllers/productController');
const { getProductVariants } = require('../controllers/productVariantController');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/:id/variants', getProductVariants);
router.post('/', adminAuth, upload.single('image'), createProduct);
router.post('/image', adminAuth, upload.single('image'), uploadImage);
router.put('/:id', adminAuth, upload.single('image'), updateProduct);
router.delete('/:id', adminAuth, deleteProduct);

module.exports = router;
