const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const auth = require('../middleware/auth');
const router = express.Router();

// All cart routes require authentication
router.use(auth);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
