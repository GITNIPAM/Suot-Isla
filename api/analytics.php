<?php
declare(strict_types=1);
require_once __DIR__ . '/shop.php';

shop(function (PDO $db, array $user, array $data, string $method): array {
    if ($method !== 'GET') {
        fail(405, 'Method not allowed.');
    }
    $eligible = " WHERE o.order_status NOT IN ('Cancelled', 'Returned') AND pay.payment_status <> 'Refunded'";
    $orders = ' FROM orders o JOIN payments pay ON pay.order_id = o.order_id';
    $items = $orders . ' JOIN order_items i ON i.order_id = o.order_id
        JOIN product_variants v ON v.variant_id = i.variant_id JOIN products p ON p.product_id = v.product_id';
    $visits = query($db, 'SELECT COUNT(*) AS visits, COUNT(purchased_at) AS conversions
        FROM shop_visits WHERE viewed_at >= NOW() - INTERVAL 7 DAY')->fetch(PDO::FETCH_ASSOC);
    $carts = query($db, 'SELECT COUNT(*) AS open_carts,
        COALESCE(SUM(c.updated_at < NOW() - INTERVAL 1 DAY), 0) AS abandoned
        FROM carts c WHERE EXISTS (SELECT 1 FROM cart_items i WHERE i.cart_id = c.cart_id)')->fetch(PDO::FETCH_ASSOC);
    $conversion = $visits['visits'] ? round(100 * $visits['conversions'] / $visits['visits'], 1) . '%' : 'No data';
    $abandonment = $carts['open_carts'] ? round(100 * $carts['abandoned'] / $carts['open_carts'], 1) . '%' : 'No data';
    return [
        'low_stock' => query($db, 'SELECT p.name, v.variant_sku, v.stock_qty, v.low_stock_threshold
            FROM product_variants v JOIN products p ON p.product_id = v.product_id
            JOIN categories c ON c.category_id = p.category_id
            WHERE NOT v.is_archived AND NOT p.is_archived AND NOT c.is_archived
            AND v.stock_qty <= v.low_stock_threshold ORDER BY v.stock_qty, p.name')->fetchAll(PDO::FETCH_ASSOC),
        'funnel' => ['summary' => "7-day visit conversion: $conversion. Open carts inactive over 24 hours: $abandonment."],
        'totals' => query($db, "SELECT COALESCE(SUM(CASE WHEN pay.payment_status = 'Paid' THEN o.total_amount ELSE 0 END), 0) AS revenue,
            COALESCE(SUM(CASE WHEN pay.payment_method = 'COD' AND pay.payment_status = 'Pending' THEN o.total_amount ELSE 0 END), 0) AS pending_cod,
            COALESCE(SUM(CASE WHEN pay.payment_method = 'COD' AND pay.payment_status = 'Paid' THEN o.total_amount ELSE 0 END), 0) AS collected_cod"
            . $orders . $eligible)->fetch(PDO::FETCH_ASSOC),
        'series' => query($db, 'SELECT s.name, ROUND(SUM(i.quantity * i.unit_price *
            CASE WHEN o.subtotal = 0 THEN 0 ELSE (o.subtotal - o.discount_amount) / o.subtotal END), 2) AS merchandise_revenue'
            . $items . ' JOIN island_series s ON s.series_id = p.series_id' . $eligible
            . " AND pay.payment_status = 'Paid' GROUP BY s.series_id, s.name ORDER BY merchandise_revenue DESC")->fetchAll(PDO::FETCH_ASSOC),
        'top_products' => query($db, 'SELECT p.product_id, p.name, SUM(i.quantity) AS units_sold' . $items . $eligible
            . " AND (pay.payment_status = 'Paid' OR pay.payment_method = 'COD')
            GROUP BY p.product_id, p.name ORDER BY units_sold DESC, p.product_id LIMIT 5")->fetchAll(PDO::FETCH_ASSOC),
    ];
}, ['admin', 'staff']);
