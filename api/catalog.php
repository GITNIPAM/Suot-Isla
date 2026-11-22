<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, ['message' => 'Method not allowed.']);
}
try {
    startAccountSession();
    $_SESSION['visit_token'] ??= bin2hex(random_bytes(24));
    $token = $_SESSION['visit_token'];
    session_write_close();
    $db = accountDb();
    $visit = $db->prepare('INSERT IGNORE INTO shop_visits (visit_token) VALUES (?)');
    $visit->execute([$token]);
    $products = $db->query("SELECT p.slug, p.name, p.description, p.image_url,
        c.name AS category, s.name AS series, v.variant_id, v.variant_sku, v.size_label, v.color_name, v.stock_qty,
        COALESCE(v.price_override, p.base_price) AS unit_price, COALESCE(sold.units_sold, 0) AS units_sold
        FROM products p JOIN categories c ON c.category_id = p.category_id
        JOIN island_series s ON s.series_id = p.series_id
        JOIN product_variants v ON v.product_id = p.product_id
        LEFT JOIN (SELECT i.variant_id, SUM(i.quantity) AS units_sold FROM order_items i
          JOIN orders o ON o.order_id = i.order_id JOIN payments pay ON pay.order_id = o.order_id
          WHERE o.order_status NOT IN ('Cancelled','Returned') AND pay.payment_status <> 'Refunded' GROUP BY i.variant_id
        ) sold ON sold.variant_id = v.variant_id
        WHERE p.is_archived = FALSE AND v.is_archived = FALSE AND c.is_archived = FALSE
        ORDER BY p.product_id, v.variant_id")->fetchAll(PDO::FETCH_ASSOC);
    respond(200, ['variants' => $products]);
} catch (Throwable $error) {
    error_log('Suot Isla catalog failed: ' . $error::class);
    respond(500, ['message' => 'The catalog is unavailable.']);
}
