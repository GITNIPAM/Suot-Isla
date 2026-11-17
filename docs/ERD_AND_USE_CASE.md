# Suot Isla — ERD, Use Case Specification & Backend Handover Guide

## 1. Brand Identity Summary (20 Points)
- **Brand Name:** **Suot Isla** — *Island-Born Surf & Beachwear*
- **Origin & Meaning:** Combines *Suot* (Tagalog for "wear" or "attire") and *Isla* (Spanish/Tagalog for "island"), literally translating to **"Island Wear."**
- **Color Palette:**
  - **Deep Lagoon Teal (`#0E6B74`):** Primary buttons, navigation headers, and active states.
  - **Sun-Bleached Coral (`#F27D63`):** Promo tags, sale badges, and low-stock alerts (`≤ 5 units`).
  - **Warm Sand (`#F4EAD5`):** Soft coastal page backgrounds and cards.
  - **Palm Leaf Green (`#2E5A44`) & Seafoam Mist (`#A8D5BA`):** Delivery status pills and secondary accents.
- **Typography Pairing:**
  - **Headings & Wordmark:** `Plus Jakarta Sans` (Bold / ExtraBold rounded geometric sans-serif).
  - **Body & UI Specs:** `DM Sans` + `JetBrains Mono` for SKUs, prices, and order references.

---

## 2. Entity Relationship Diagram (ERD — 10 Points)

All 15 tables with Primary Keys (`PK`), Foreign Keys (`FK`), and Crow's Foot relationships are defined in [schema.sql](schema.sql) for direct import into **FourSys Cloud (`phpMyAdmin`)**.

- `users (user_id PK)` `1 ── 0..N` `user_addresses (address_id PK, user_id FK)`
- `users (user_id PK)` `1 ── 0..N` `orders (order_id PK, user_id FK)`
- `categories (category_id PK)` `1 ── 0..N` `products (product_id PK, category_id FK)`
- `island_series (series_id PK)` `1 ── 0..N` `products (product_id PK, series_id FK)`
- `products (product_id PK)` `1 ── 1..N` `product_variants (variant_id PK, product_id FK)`
- `carts (cart_id PK)` `1 ── 0..N` `cart_items (cart_item_id PK, cart_id FK, variant_id FK)`
- `orders (order_id PK)` `1 ── 1..N` `order_items (order_item_id PK, order_id FK, variant_id FK)`
- `orders (order_id PK)` `1 ── 1` `payments (payment_id PK, order_id FK)`
- `orders (order_id PK)` `1 ── 0..1` `deliveries (delivery_id PK, order_id FK, courier_user_id FK)`
- `orders (order_id PK)` `1 ── 0..N` `return_requests (return_id PK, order_id FK)`
- `orders (order_id PK)` `1 ── 0..N` `email_logs (email_id PK, order_id FK, user_id FK)`

---

## 3. Use Case Lifecycle Specification (15 Points)

### Actors
1. **Customer (Registered User)**
2. **Admin / Staff (Manages Inventory & Orders)**
3. **Delivery Personnel / Courier (Updates Delivery Status)**
4. **Payment Gateway (External System Actor)**
5. **Email Service (External Actor)**

### Stage-by-Stage Use Cases & Include/Extend Relationships
| Stage | Use Cases | Relationships |
|---|---|---|
| **Browsing** | Browse catalog, search products, filter & sort (Category, Island Series, Size, Color, Price), view product details | Queries `products` & `product_variants` |
| **Account** | Register, log in, manage profile & addresses, view order history | `Log In` `<<include>>` `Verify Hashed Password` |
| **Buying** | Add to cart, update cart, apply coupon, checkout, make payment | `Checkout` `<<include>>` `Validate Stock`, `Validate Address`, `Make Payment`; `Apply Coupon` `<<extend>>` `Checkout` |
| **Order Processing** | Receive new order, confirm order, update inventory, pack order, update status | `Confirm Order` `<<include>>` `Update Inventory` & `Send Email` |
| **Delivery** | Assign courier, ship order, track order, confirm delivery | `Ship Order` `<<include>>` `Send Shipping Update Email` |
| **Returns & Refunds** | Request cancellation, request return, approve/reject return, restock item, process refund | `Request Return/Cancel` `<<extend>>` `View Order History`; `Restock Item` & `Process Refund` `<<extend>>` `Approve Return` |
| **Admin Management** | Manage products & categories, manage stock, manage customers & RBAC roles | Enforced by Role-Based Access Control (`admin`, `staff`, `courier`) |
