<?php
declare(strict_types=1);
require_once __DIR__ . '/order-actions.php';

shop(function (PDO $db, array $user, array $data, string $method): array {
    $userId = (int) $user['user_id'];
    $role = $user['role'];
    if ($method === 'GET') {
        $filter = match ($role) {
            'customer' => ' WHERE o.user_id = ?',
            'courier' => ' WHERE d.courier_user_id = ?',
            default => '',
        };
        $parameters = $filter ? [$userId] : [];
        $operatorFields = $role === 'customer' ? '' : ', u.full_name AS customer_name, cr.full_name AS courier_name';
        $operatorJoins = $role === 'customer' ? '' : ' JOIN users u ON u.user_id = o.user_id LEFT JOIN users cr ON cr.user_id = d.courier_user_id';
        $orders = query($db, 'SELECT o.*, p.payment_method, p.payment_status,
            d.courier_user_id, d.courier_service, d.tracking_number, d.delivery_status' . $operatorFields . '
            FROM orders o JOIN payments p ON p.order_id = o.order_id JOIN deliveries d ON d.order_id = o.order_id'
            . $operatorJoins . $filter . ' ORDER BY o.order_id DESC', $parameters)->fetchAll(PDO::FETCH_ASSOC);
        if ($role === 'customer') {
            return ['orders' => $orders];
        }

        $items = query($db, 'SELECT i.order_id, i.product_name_snapshot, i.size_snapshot, i.color_snapshot,
            i.quantity, i.unit_price, pr.slug, pr.image_url FROM order_items i
            JOIN orders o ON o.order_id = i.order_id JOIN deliveries d ON d.order_id = o.order_id
            JOIN product_variants v ON v.variant_id = i.variant_id JOIN products pr ON pr.product_id = v.product_id'
            . $filter . ' ORDER BY i.order_item_id', $parameters)->fetchAll(PDO::FETCH_ASSOC);
        $itemsByOrder = [];
        foreach ($items as $item) {
            $itemsByOrder[$item['order_id']][] = $item;
        }
        foreach ($orders as &$order) {
            $order['items'] = $itemsByOrder[$order['order_id']] ?? [];
        }
        unset($order);
        return ['orders' => $orders];
    }

    $orderId = whole($data, 'order_id');
    $action = $data['action'] ?? '';
    $db->beginTransaction();
    $order = lockOrder($db, $orderId);
    $owner = (int) $order['user_id'];
    if (($role === 'customer' && $owner !== $userId) ||
        ($role === 'courier' && (int) $order['courier_user_id'] !== $userId)) {
        fail(404, 'Order not found.');
    }
    $status = $order['order_status'];
    if (in_array($status, ['Cancelled', 'Returned'], true)) {
        fail(409, 'This order is closed.');
    }
    if ($action === 'cancel' && in_array($role, ['customer', 'admin', 'staff'], true)) {
        if ($status === 'Delivered') {
            fail(409, 'Delivered orders require a return request.');
        }
        query($db, "UPDATE orders SET order_status = 'Cancelled' WHERE order_id = ?", [$orderId]);
        restockOrder($db, $orderId);
        if ($order['payment_status'] === 'Paid') {
            query($db, "INSERT INTO return_requests (return_code, order_id, request_type, reason, status, is_restocked)
                VALUES (?, ?, 'Cancellation', 'Order cancelled', 'Approved · Awaiting Refund', TRUE)",
                [refCode('RET-'), $orderId]);
        }
        notice($db, $owner, $orderId, 'Cancellation', 'Order cancelled', 'Your order was cancelled.');
        return ['status' => 'Cancelled'];
    }

    if ($action === 'confirm_mock_gcash' && in_array($role, ['admin', 'staff'], true)) {
        if (getenv('SUOT_MOCK_PAYMENTS') !== '1' && (shopConfig()['mock_payments'] ?? false) !== true) {
            fail(403, 'Mock GCash confirmation is disabled.');
        }
        if ($order['payment_method'] !== 'GCash' || $order['payment_status'] !== 'Pending') {
            fail(409, 'This order has no pending GCash payment.');
        }
        query($db, "UPDATE payments SET payment_status = 'Paid', verification_source = 'Mock', paid_at = NOW() WHERE order_id = ?", [$orderId]);
        return ['payment_status' => 'Paid', 'verification_source' => 'Mock'];
    }

    if ($action === 'advance' && in_array($role, ['admin', 'staff'], true)) {
        $next = match ($status) {
            'Pending' => 'Confirmed',
            'Confirmed' => 'Packed',
            default => null,
        };
        if (!$next || ($order['payment_method'] === 'GCash' && $order['payment_status'] !== 'Paid')) {
            fail(409, 'This order cannot advance yet.');
        }
        query($db, 'UPDATE orders SET order_status = ? WHERE order_id = ?', [$next, $orderId]);
        return ['status' => $next];
    }

    if ($action === 'assign_courier' && in_array($role, ['admin', 'staff'], true)) {
        $courier = whole($data, 'courier_user_id');
        if ($status !== 'Packed' || !query($db, "SELECT 1 FROM users WHERE user_id = ? AND role = 'courier'", [$courier])->fetchColumn()) {
            fail(422, 'Choose a courier for a packed order.');
        }
        query($db, 'UPDATE deliveries SET courier_user_id = ? WHERE order_id = ?', [$courier, $orderId]);
        return ['courier_user_id' => $courier];
    }

    if ($action === 'dispatch' && $role === 'courier' && $status === 'Packed') {
        query($db, "UPDATE orders SET order_status = 'Out for Delivery' WHERE order_id = ?", [$orderId]);
        query($db, "UPDATE deliveries SET delivery_status = 'Out_For_Delivery' WHERE order_id = ?", [$orderId]);
        notice($db, $owner, $orderId, 'Shipping', 'Order out for delivery', 'Your order is out for delivery.');
        return ['status' => 'Out for Delivery'];
    }

    if ($action === 'deliver' && $role === 'courier' && $status === 'Out for Delivery') {
        if ($order['payment_method'] === 'COD' && $order['payment_status'] === 'Pending') {
            if (($data['collected'] ?? false) !== true) {
                fail(422, 'Confirm that cash was collected.');
            }
            query($db, "UPDATE payments SET payment_status = 'Paid', verification_source = 'Courier', paid_at = NOW() WHERE order_id = ?", [$orderId]);
        }
        query($db, "UPDATE orders SET order_status = 'Delivered' WHERE order_id = ?", [$orderId]);
        query($db, "UPDATE deliveries SET delivery_status = 'Delivered' WHERE order_id = ?", [$orderId]);
        return ['status' => 'Delivered'];
    }

    fail(403, 'This operation is unavailable for the current order or account.');
});
