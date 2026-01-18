require('dotenv').config();
const express = require('express');
const { sequelize } = require('./config/database');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const postRoutes = require('./routes/posts');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

const app = express();
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);

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