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
CREATE TYPE post_type_enum AS ENUM ('post', 'page');
CREATE TYPE stock_status_type AS ENUM ('in_stock', 'out_of_stock', 'backorder');
CREATE TYPE order_status_type AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded');
CREATE TYPE discount_type_enum AS ENUM ('fixed_cart', 'percent');

-- =================================================================
-- PHẦN 2: NGƯỜI DÙNG & NỘI DUNG (CORE CMS)
-- =================================================================

-- 1. Bảng Người dùng
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(250),
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
    post_type post_type_enum DEFAULT 'post',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng trung gian Bài viết - Danh mục
CREATE TABLE post_categories (
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
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
-- Ví dụ: Áo Đỏ Size M (Có ảnh riêng, giá riêng)
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(15, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(255) DEFAULT NULL -- Ảnh riêng cho biến thể này
);

-- 10. Bảng Thuộc tính biến thể
-- Định nghĩa biến thể trên là: Màu=Đỏ, Size=M
CREATE TABLE variant_options (
    id BIGSERIAL PRIMARY KEY,
    variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_name VARCHAR(50) NOT NULL, -- "Color"
    attribute_value VARCHAR(50) NOT NULL -- "Red"
);

-- =================================================================
-- PHẦN 4: ĐƠN HÀNG & MÃ GIẢM GIÁ
-- =================================================================

-- 11. Bảng Mã giảm giá (Coupons)
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
    user_id BIGINT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status order_status_type DEFAULT 'pending',
    
    total_amount DECIMAL(15, 2) NOT NULL,
    
    -- Thông tin giảm giá
    coupon_code VARCHAR(50) DEFAULT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,

    -- Thông tin giao hàng (Snapshot)
    shipping_name VARCHAR(255) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_email VARCHAR(100),
    note TEXT,
    
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

-- =================================================================
-- PHẦN 5: KÍCH HOẠT TRIGGER (AUTO UPDATE TIME)
-- =================================================================

-- PostgreSQL cần gán trigger thủ công cho từng bảng
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_modtime BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tạo Index để tăng tốc độ tìm kiếm
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_coupons_code ON coupons(code);