require('dotenv').config();
const express = require('express');
const { sequelize } = require('./config/database');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const postRoutes = require('./routes/posts');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const commentRoutes = require('./routes/comments');
const postMetaRoutes = require('./routes/post-metas');
const productImageRoutes = require('./routes/product-images');
const productVariantRoutes = require('./routes/product-variants');
const variantOptionRoutes = require('./routes/variant-options');
const orderItemRoutes = require('./routes/order-items');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

// Require associations after models
require('./associations');

const app = express();
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/post-metas', postMetaRoutes);
app.use('/api/product-images', productImageRoutes);
app.use('/api/product-variants', productVariantRoutes);
app.use('/api/variant-options', variantOptionRoutes);
app.use('/api/order-items', orderItemRoutes);

// Swagger docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Protected route example
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected route', user: req.user });
});

// Error handling
app.use(errorHandler);

// Sync database and start server
sequelize.sync().then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port 3000');
  });
});

module.exports = app;