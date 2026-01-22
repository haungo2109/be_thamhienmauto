-- =================================================================
-- PHẦN 1: CẤU HÌNH CƠ BẢN & CÁC TYPE (ENUMS)
-- =================================================================

-- Hàm tự động cập nhật thời gian cho cột updated_at (Postgres cần cái này)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Định nghĩa các kiểu dữ liệu ENUM (Danh sách chọn)
CREATE TYPE user_role_type AS ENUM ('admin', 'editor', 'author', 'subscriber');
CREATE TYPE post_status_type AS ENUM ('published', 'draft', 'archived');
CREATE TYPE stock_status_type AS ENUM ('in_stock', 'out_of_stock', 'backorder');
CREATE TYPE order_status_type AS ENUM ('pending', 'processing', 'shipped', 'completed', 'cancelled', 'returned');
CREATE TYPE discount_type_enum AS ENUM ('fixed_cart', 'percent');

-- =================================================================
-- PHẦN 2: NGƯỜI DÙNG & NỘI DUNG (CORE CMS)
-- =================================================================

-- 1. Bảng Người dùng
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(250),
    phone VARCHAR(20),
    role user_role_type DEFAULT 'subscriber',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng Danh mục (Categories)
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    parent_id BIGINT DEFAULT NULL REFERENCES categories(id) ON DELETE SET NULL
);

-- 3. Bảng Bài viết (Posts & Pages)
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    content TEXT,
    excerpt TEXT,
    status post_status_type DEFAULT 'draft',
    category_id INTEGER REFERENCES post_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Danh mục Bài viết
CREATE TABLE post_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES post_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Bình luận
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id BIGINT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(100),
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    parent_id BIGINT DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng Metadata (Cho bài viết)
CREATE TABLE post_meta (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    meta_key VARCHAR(255) NOT NULL,
    meta_value TEXT
);

-- =================================================================
-- PHẦN 3: E-COMMERCE (SẢN PHẨM & BIẾN THỂ)
-- =================================================================

-- 7. Bảng Sản phẩm (Gốc)
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    sale_price DECIMAL(15, 2) DEFAULT NULL,
    stock_quantity INT DEFAULT 0,
    stock_status stock_status_type DEFAULT 'in_stock',
    image_url VARCHAR(255), -- Ảnh đại diện chính (Thumbnail)
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bảng Thư viện ảnh sản phẩm (Nhiều hình ảnh)
CREATE TABLE product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0
);

-- 9. Bảng Biến thể sản phẩm (SKUs - Variants)
-- 9. Bảng Thuộc tính (Attributes)
-- Định nghĩa các thuộc tính như Color, Size, etc.
CREATE TABLE attribute (
    attribute_name VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Bảng Biến thể sản phẩm
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(15, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(255) DEFAULT NULL -- Ảnh riêng cho biến thể này
);

-- 11. Bảng Thuộc tính biến thể
-- Định nghĩa biến thể trên là: Màu=Đỏ, Size=M
CREATE TABLE variant_options (
    id BIGSERIAL PRIMARY KEY,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_name VARCHAR(50) NOT NULL REFERENCES attribute(attribute_name) ON DELETE CASCADE,
    attribute_value VARCHAR(50) NOT NULL,    affects_price BOOLEAN DEFAULT TRUE,    UNIQUE (variant_id, attribute_name)
);

-- =================================================================
-- PHẦN 4: ĐƠN HÀNG & MÃ GIẢM GIÁ
-- =================================================================

-- 12. Bảng Mã giảm giá (Coupons)
CREATE TABLE coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type discount_type_enum DEFAULT 'fixed_cart',
    amount DECIMAL(15, 2) NOT NULL,
    min_spend DECIMAL(15, 2) DEFAULT 0,
    usage_limit INT DEFAULT 0,
    usage_count INT DEFAULT 0,
    expiry_date TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Bảng Đơn hàng (Orders)
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status order_status_type DEFAULT 'pending',
    sub_total DECIMAL(15,2) DEFAULT 0.00,
    shipping_fee DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    coupon_code VARCHAR(50),
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    shipping_name VARCHAR(255) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_email VARCHAR(100),
    note TEXT,
    payment_method_id VARCHAR(50) NOT NULL REFERENCES payment_methods(id),
    shipping_partner_id BIGINT REFERENCES shipping_partners(id),
    tracking_number VARCHAR(100),
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Bảng Chi tiết đơn hàng (Order Items)
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT DEFAULT NULL REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL, -- Giá tại thời điểm mua
    subtotal DECIMAL(15, 2) NOT NULL
);

-- 16. Bảng Giỏ hàng (Cart Items)
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Bảng Địa chỉ người dùng
CREATE TABLE user_addresses (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_name VARCHAR(255) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    address_type VARCHAR(20) CHECK (address_type IN ('home', 'office')) DEFAULT 'home',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Bảng Phương thức thanh toán
CREATE TABLE payment_methods (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'manual',
    "isActive" BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active',
    description TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- PHẦN 5: KÍCH HOẠT TRIGGER (AUTO UPDATE TIME)
-- =================================================================

-- PostgreSQL cần gán trigger thủ công cho từng bảng
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_modtime BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Tạo Index để tăng tốc độ tìm kiếm
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_coupons_code ON coupons(code);

-- Seed mặc định COD
INSERT INTO payment_methods (id, name, type, "isActive", status, description, config)
VALUES ('cod', 'Thanh toán khi nhận hàng (COD)', 'manual', TRUE, 'active', 'Khách hàng thanh toán tiền mặt trực tiếp cho shipper khi nhận hàng.', '{}');