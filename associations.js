const User = require('./models/User');
const Category = require('./models/Category');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const PostMeta = require('./models/PostMeta');
const Product = require('./models/Product');
const ProductImage = require('./models/ProductImage');
const ProductVariant = require('./models/ProductVariant');
const VariantOption = require('./models/VariantOption');
const Coupon = require('./models/Coupon');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');

// User associations
User.hasMany(Post, { foreignKey: 'author_id', as: 'posts' });
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

// Category associations
// --- Category ---
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });
Category.hasMany(Category, { as: 'children', foreignKey: 'parent_id' });
// Dùng through là tên bảng string 'post_categories' khớp với SQL
Category.belongsToMany(Post, { through: 'post_categories', foreignKey: 'category_id', otherKey: 'post_id', as: 'posts' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

// Post associations
Post.belongsTo(User, { foreignKey: 'author_id', as: 'author' }); // Quan trọng: as 'author'
Post.belongsToMany(Category, { through: 'post_categories', foreignKey: 'post_id', otherKey: 'category_id', as: 'categories' });
Post.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Post.hasMany(PostMeta, { foreignKey: 'post_id', as: 'meta' });

// Comment associations
Comment.belongsTo(Post, { foreignKey: 'post_id', as: 'post' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' }); // Comment cũng có tác giả
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parent_id' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parent_id' });

// PostMeta associations
PostMeta.belongsTo(Post, { foreignKey: 'post_id' });

// Product associations
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
Product.hasMany(OrderItem, { foreignKey: 'product_id' }); // Không cần as ở đây lắm vì ít khi query ngược từ Product ra OrderItem để hiển thị

// ProductImage associations
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

// ProductVariant associations
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductVariant.hasMany(VariantOption, { foreignKey: 'variant_id', as: 'options' });

// VariantOption associations
VariantOption.belongsTo(ProductVariant, { foreignKey: 'variant_id' });

// Order associations
Order.belongsTo(User, { foreignKey: 'user_id', as: 'customer' }); // as 'customer' nghe hay hơn user
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
