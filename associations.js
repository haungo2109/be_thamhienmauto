const User = require("./models/User");
const Category = require("./models/Category");
const Post = require("./models/Post");
const PostCategory = require("./models/PostCategory");
const Comment = require("./models/Comment");
const PostMeta = require("./models/PostMeta");
const Product = require("./models/Product");
const ProductImage = require("./models/ProductImage");
const ProductVariant = require("./models/ProductVariant");
const VariantOption = require("./models/VariantOption");
const Attribute = require("./models/Attribute");
const Coupon = require("./models/Coupon");
const Order = require("./models/Order");
const OrderItem = require("./models/OrderItem");
const ContactInfo = require("./models/ContactInfo");
const SocialLink = require("./models/SocialLink");
const ShippingPartner = require("./models/ShippingPartner");
const CartItem = require("./models/CartItem");
const UserAddress = require("./models/UserAddress");

// User associations
User.hasMany(Post, { foreignKey: "author_id" });
User.hasMany(Comment, { foreignKey: "user_id" });
User.hasMany(Order, { foreignKey: "user_id" });
User.hasMany(CartItem, { foreignKey: "user_id" });
User.hasMany(UserAddress, { foreignKey: "user_id" });

// Category associations
// --- Category ---
Category.belongsTo(Category, { foreignKey: "parent_id" });
Category.hasMany(Category, { foreignKey: "parent_id" });
Category.hasMany(Product, { foreignKey: "category_id" });

// PostCategory associations
PostCategory.belongsTo(PostCategory, { as: 'Parent', foreignKey: 'parent_id' });
PostCategory.hasMany(PostCategory, { as: 'Children', foreignKey: 'parent_id' });
PostCategory.hasMany(Post, { foreignKey: 'category_id' });

// Post associations
Post.belongsTo(User, { foreignKey: "author_id" }); // Quan trọng: as 'author'
Post.belongsTo(PostCategory, { foreignKey: 'category_id' });
Post.hasMany(Comment, { foreignKey: "post_id" });
Post.hasMany(PostMeta, { foreignKey: "post_id" });

// Comment associations
Comment.belongsTo(Post, { foreignKey: "post_id" });
Comment.belongsTo(User, { foreignKey: "user_id" }); // Comment cũng có tác giả
Comment.belongsTo(Comment, { foreignKey: "parent_id" });
Comment.hasMany(Comment, { foreignKey: "parent_id" });

// PostMeta associations
PostMeta.belongsTo(Post, { foreignKey: "post_id" });

// Product associations
Product.belongsTo(Category, { foreignKey: "category_id" });
Product.hasMany(ProductImage, { foreignKey: "product_id", as: 'ProductImages' });
Product.hasMany(ProductVariant, { foreignKey: "product_id", as: 'ProductVariants' });
Product.hasMany(OrderItem, { foreignKey: "product_id" }); // Không cần as ở đây lắm vì ít khi query ngược từ Product ra OrderItem để hiển thị

// ProductImage associations
ProductImage.belongsTo(Product, { foreignKey: "product_id" });

// ProductVariant associations
ProductVariant.belongsTo(Product, { foreignKey: "product_id" });
ProductVariant.hasMany(VariantOption, { foreignKey: "variant_id", as: 'VariantOptions' });

// VariantOption associations
VariantOption.belongsTo(ProductVariant, { foreignKey: "variant_id" });
VariantOption.belongsTo(Attribute, { foreignKey: "attribute_name", targetKey: "attribute_name", as: 'Attribute' });

// Attribute associations
Attribute.hasMany(VariantOption, { foreignKey: "attribute_name", sourceKey: "attribute_name" });

// Order associations
Order.belongsTo(User, { foreignKey: "user_id" }); // as 'customer' nghe hay hơn user
Order.hasMany(OrderItem, { foreignKey: "order_id" });
Order.belongsTo(ShippingPartner, { foreignKey: 'shipping_partner_id' }); // New association

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: "order_id" });
OrderItem.belongsTo(Product, { foreignKey: "product_id" });

// CartItem associations
CartItem.belongsTo(User, { foreignKey: "user_id" });
CartItem.belongsTo(Product, { foreignKey: "product_id" });
CartItem.belongsTo(ProductVariant, { foreignKey: "product_variant_id" });

// UserAddress associations
UserAddress.belongsTo(User, { foreignKey: "user_id" });

// ContactInfo associations
ContactInfo.hasMany(SocialLink, { foreignKey: 'contact_id', onDelete: 'CASCADE' });

// SocialLink associations
SocialLink.belongsTo(ContactInfo, { foreignKey: 'contact_id' });

// ShippingPartner associations
ShippingPartner.hasMany(Order, { foreignKey: 'shipping_partner_id' }); // New association
