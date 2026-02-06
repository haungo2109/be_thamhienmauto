require("dotenv").config();
const express = require("express");
const { sequelize } = require("./config/database");
const path = require("path");

// --- Libraries ---
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// --- Routes ---
const userRoutes = require("./routes/users");
const categoryRoutes = require("./routes/categories");
const postRoutes = require("./routes/posts");
const postCategoryRoutes = require("./routes/post-categories");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const couponRoutes = require("./routes/coupons");
const commentRoutes = require("./routes/comments");
const postMetaRoutes = require("./routes/post-metas");
const productImageRoutes = require("./routes/product-images");
const productVariantRoutes = require("./routes/product-variants");
const variantOptionRoutes = require("./routes/variant-options");
const orderItemRoutes = require("./routes/order-items");
const authMiddleware = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swagger");
const popupRoutes = require('./routes/popups');
const contactInfoRoutes = require('./routes/contact-info');
const socialLinksRoutes = require('./routes/social-links');
const shippingConfigRoutes = require('./routes/shipping-config');
const shippingPartnersRoutes = require('./routes/shipping-partners');
const cartRoutes = require('./routes/cart');
const addressRoutes = require('./routes/users-addresses');
const paymentMethodRoutes = require('./routes/payment-methods');
const promotionRoutes = require('./routes/promotions');
const dashboardRoutes = require('./routes/dashboard');

// Require associations after models
require("./associations");

const app = express();
// Security Headers (Nên đặt đầu tiên)
app.use(helmet());

// CORS (Cho phép Frontend truy cập)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Cấu hình domain frontend
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Logging (Chỉ log khi không phải môi trường test)
if (process.env.NODE_ENV !== "development") {
  app.use(morgan("dev"));
}

// Rate Limiting (Giới hạn request để chống spam)
// Limiter chung cho toàn bộ app (nới lỏng hơn)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Tăng lên 500 cho thoải mái
  message: "Hệ thống đang bận, vui lòng thử lại sau.",
  standardHeaders: true, // Trả về thông tin RateLimit trong headers
  legacyHeaders: false,
});

// Limiter riêng cho Login/Register (siết chặt)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 1 giờ
  max: 10, // Chỉ cho phép 10 lần thử/giờ
  message: "Bạn đã thử quá nhiều lần, vui lòng quay lại sau 1 giờ.",
});

app.use("/api", generalLimiter); // Áp dụng cho tất cả route bắt đầu bằng /api

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files (Để phục vụ ảnh đã upload)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", authLimiter, userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/post-categories", postCategoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/post-metas", postMetaRoutes);
app.use("/api/product-images", productImageRoutes);
app.use("/api/product-variants", productVariantRoutes);
app.use("/api/variant-options", variantOptionRoutes);
app.use("/api/order-items", orderItemRoutes);
app.use('/api/popups', popupRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/social-links', socialLinksRoutes);
app.use('/api/shipping-config', shippingConfigRoutes);
app.use('/api/shipping-partners', shippingPartnersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/user-addresses', addressRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Swagger docs route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Handle 404 (Route not found)
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

// Error handling
app.use(errorHandler);

// Sync database and start server
// LƯU Ý QUAN TRỌNG: Trong môi trường Production, KHÔNG dùng sequelize.sync()
// Hãy dùng Migrations. sync() chỉ dùng để test nhanh lúc đầu.
const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected...");
    // Chỉ chạy sync khi cần thiết (ví dụ dev mode mới)
    // sequelize.sync({ alter: true });
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = app;