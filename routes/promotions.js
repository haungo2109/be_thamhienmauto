const express = require('express');
const { 
  getPromotions, 
  getPromotion, 
  createPromotion, 
  updatePromotion, 
  deletePromotion
} = require('../controllers/promotionController');
const adminAuth = require('../middleware/adminAuth');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, getPromotions);
router.get('/:id', auth, getPromotion);
router.post('/', adminAuth, createPromotion);
router.put('/:id', adminAuth, updatePromotion);
router.delete('/:id', adminAuth, deletePromotion);

module.exports = router;
