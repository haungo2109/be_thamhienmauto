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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 request mỗi IP trong 15 phút
  message: "Too many requests from this IP, please try again later",
});
app.use("/api", limiter); // Áp dụng cho tất cả route bắt đầu bằng /api

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files (Để phục vụ ảnh đã upload)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/post-metas", postMetaRoutes);
app.use("/api/product-images", productImageRoutes);
app.use("/api/product-variants", productVariantRoutes);
app.use("/api/variant-options", variantOptionRoutes);
app.use("/api/order-items", orderItemRoutes);

// Swagger docs route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Protected route example
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

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
    // return sequelize.sync({ alter: true });
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = app;