<?php
declare(strict_types=1);
require_once __DIR__ . '/shop.php';

function lockOrder(PDO $db, int $orderId): array
{
    $order = query($db, 'SELECT o.*, p.payment_method, p.payment_status, d.courier_user_id, d.delivery_status
        FROM orders o JOIN payments p ON p.order_id = o.order_id
        JOIN deliveries d ON d.order_id = o.order_id WHERE o.order_id = ? FOR UPDATE', [$orderId])->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        fail(404, 'Order not found.');
    }
    return $order;
}

function restockOrder(PDO $db, int $orderId): void
{
    query($db, 'UPDATE product_variants v JOIN (
        SELECT variant_id, SUM(quantity) AS qty FROM order_items WHERE order_id = ? GROUP BY variant_id
        ) restored ON restored.variant_id = v.variant_id SET v.stock_qty = v.stock_qty + restored.qty', [$orderId]);
}
