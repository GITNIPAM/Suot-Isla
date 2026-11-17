-- ============================================================================
-- Suot Isla — Island-Born Surf & Beachwear
-- MySQL / MariaDB Schema for FourSys Cloud (Starter Cloud Tier)
-- Aligns 100% with the PCU College of Informatics ERD & Use Case Rubric
-- ============================================================================

CREATE DATABASE IF NOT EXISTS suotisla_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE suotisla_db;

-- 1. USERS (Customer, Admin, Staff, Delivery Courier)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    role ENUM('customer', 'admin', 'staff', 'courier') NOT NULL DEFAULT 'customer',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER_ADDRESSES
CREATE TABLE user_addresses (
    address_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    label VARCHAR(60) DEFAULT 'Home',
    recipient_name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    barangay VARCHAR(120) NOT NULL,
    city VARCHAR(120) NOT NULL,
    province VARCHAR(120) NOT NULL,
    postal_code CHAR(4) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. CATEGORIES (4 Official Categories)
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE
);

-- 4. ISLAND_SERIES (4 Official Philippine Island Collections)
CREATE TABLE island_series (
    series_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    tagline VARCHAR(180) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE
);

-- 5. PRODUCTS (16 Official Products)
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    series_id INT NOT NULL,
    sku VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (series_id) REFERENCES island_series(series_id)
);

-- 6. PRODUCT_VARIANTS (Size, Color & Stock Quantity per SKU)
CREATE TABLE product_variants (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_sku VARCHAR(60) NOT NULL UNIQUE,
    size_label VARCHAR(40) NOT NULL,
    color_name VARCHAR(60) NOT NULL,
    color_hex CHAR(7) DEFAULT '#0E6B74',
    stock_qty INT NOT NULL DEFAULT 15,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    price_override DECIMAL(10,2) DEFAULT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 7. CARTS & 8. CART_ITEMS (Persistent Session Cart)
CREATE TABLE carts (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    session_token VARCHAR(128) NOT NULL UNIQUE,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE CASCADE
);

-- 9. COUPONS
CREATE TABLE coupons (
    coupon_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    discount_type ENUM('percentage', 'fixed', 'free_shipping') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_spend DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 10. ORDERS & 11. ORDER_ITEMS
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    shipping_address_id INT DEFAULT NULL,
    shipping_address_snapshot TEXT NOT NULL,
    coupon_id INT DEFAULT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 150.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned') NOT NULL DEFAULT 'Pending',
    placed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (shipping_address_id) REFERENCES user_addresses(address_id) ON DELETE SET NULL,
    FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE SET NULL
);

CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    variant_id INT NOT NULL,
    product_name_snapshot VARCHAR(180) NOT NULL,
    size_snapshot VARCHAR(40) NOT NULL,
    color_snapshot VARCHAR(60) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
);

-- 12. PAYMENTS (Mock Payment Gateway Records)
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    payment_method ENUM('GCash', 'Maya', 'Card', 'COD') NOT NULL,
    transaction_ref VARCHAR(80) NOT NULL,
    payment_status ENUM('Pending', 'Paid', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
    paid_at DATETIME DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- 13. DELIVERIES (Courier Assignment & Tracking)
CREATE TABLE deliveries (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    courier_user_id INT DEFAULT NULL,
    courier_service VARCHAR(120) DEFAULT 'Island Express',
    tracking_number VARCHAR(60) NOT NULL UNIQUE,
    delivery_status ENUM('Assigned', 'Picked_Up', 'In_Transit', 'Out_For_Delivery', 'Delivered') NOT NULL DEFAULT 'Assigned',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (courier_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 14. RETURN_REQUESTS (Cancellations, Returns, Restocking & Refunds)
CREATE TABLE return_requests (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    return_code VARCHAR(40) NOT NULL UNIQUE,
    order_id INT NOT NULL,
    request_type ENUM('Cancellation', 'Return_Refund') NOT NULL,
    reason VARCHAR(180) NOT NULL,
    customer_notes TEXT,
    status ENUM('Pending Review', 'Approved & Completed', 'Rejected') NOT NULL DEFAULT 'Pending Review',
    is_restocked BOOLEAN NOT NULL DEFAULT FALSE,
    is_refunded BOOLEAN NOT NULL DEFAULT FALSE,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- 15. EMAIL_LOGS (Order Confirmation, Shipping Updates, Cancellations)
CREATE TABLE email_logs (
    email_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    order_id INT DEFAULT NULL,
    recipient_email VARCHAR(160) NOT NULL,
    email_type VARCHAR(60) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_preview TEXT NOT NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- Seed 4 Categories & 4 Island Series
INSERT INTO categories (name, slug) VALUES
('Swim & Surf', 'swim-surf'),
('Resort & Loungewear', 'resort-loungewear'),
('Beach Towels & Ponchos', 'beach-towels-ponchos'),
('Island Accessories', 'island-accessories');

INSERT INTO island_series (name, tagline, slug) VALUES
('Siargao', 'High-Performance Surf & Wave Gear', 'siargao'),
('Boracay', 'Breezy Resortwear & Golden-Hour Linen', 'boracay'),
('El Nido', 'Lagoon Swimwear & Island-Hopping Essentials', 'el-nido'),
('La Union', 'Laid-Back Coastal Streetwear & Weekend Casuals', 'la-union');
