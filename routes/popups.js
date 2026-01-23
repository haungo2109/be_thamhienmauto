const express = require('express');
const { getPopups, getPopup, getActivePopup, createPopup, updatePopup, deletePopup } = require('../controllers/popupController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', auth, getPopups);
router.get('/active', getActivePopup); // Public route for website to load active popup
router.get('/:id', auth, getPopup);
router.post('/', adminAuth, upload.single('image'), createPopup);
router.put('/:id', adminAuth, upload.single('image'), updatePopup);
router.delete('/:id', adminAuth, deletePopup);

module.exports = router;
