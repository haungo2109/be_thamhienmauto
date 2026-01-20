const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Joi = require('joi');

const cartItemSchema = Joi.object({
  product_id: Joi.number().required(),
  product_variant_id: Joi.number().optional().allow(null),
  quantity: Joi.number().integer().min(1).required()
});

exports.getCart = async (req, res) => {
  try {
    const items = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [
        { 
          model: Product,
          attributes: ['id', 'name', 'price', 'slug', 'image_url']
        },
        {
          model: ProductVariant,
          attributes: ['id', 'variant_name', 'price', 'stock_quantity']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { error } = cartItemSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { product_id, product_variant_id, quantity } = req.body;

    // Check if product exists
    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Find if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: {
        user_id: req.user.id,
        product_id,
        product_variant_id: product_variant_id || null
      }
    });

    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        user_id: req.user.id,
        product_id,
        product_variant_id,
        quantity
      });
    }

    res.status(201).json(cartItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const cartItem = await CartItem.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!cartItem) return res.status(404).json({ error: 'Cart item not found' });

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json(cartItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const deleted = await CartItem.destroy({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!deleted) return res.status(404).json({ error: 'Cart item not found' });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await CartItem.destroy({
      where: { user_id: req.user.id }
    });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
