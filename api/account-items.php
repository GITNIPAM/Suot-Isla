<?php
declare(strict_types=1);
require_once __DIR__ . '/shop.php';

shop(function (PDO $db, array $user, array $data, string $method): array {
    if ($method !== 'GET') {
        fail(405, 'Method not allowed.');
    }
    $items = query($db, 'SELECT i.order_id, i.variant_id, i.product_name_snapshot, i.size_snapshot,
        i.color_snapshot, i.quantity, i.unit_price, p.slug, p.image_url
        FROM order_items i JOIN orders o ON o.order_id = i.order_id
        JOIN product_variants v ON v.variant_id = i.variant_id
        JOIN products p ON p.product_id = v.product_id
        WHERE o.user_id = ? ORDER BY i.order_item_id', [(int) $user['user_id']]);
    return ['items' => $items->fetchAll(PDO::FETCH_ASSOC)];
}, ['customer']);
