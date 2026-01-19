const express = require('express');
const { getPopups, getPopup, createPopup, updatePopup, deletePopup } = require('../controllers/popupController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.get('/', auth, getPopups);
router.get('/:id', auth, getPopup);
router.post('/', adminAuth, createPopup);
router.put('/:id', adminAuth, updatePopup);
router.delete('/:id', adminAuth, deletePopup);

module.exports = router;
