<?php
declare(strict_types=1);
require_once __DIR__ . '/order-actions.php';

shop(function (PDO $db, array $user, array $data, string $method): array {
    $owner = (int) $user['user_id'];
    $customer = $user['role'] === 'customer';
    if ($method === 'GET') {
        return ['returns' => query($db, 'SELECT r.*, o.order_number FROM return_requests r
            JOIN orders o ON o.order_id = r.order_id' . ($customer ? ' WHERE o.user_id = ?' : '')
            . ' ORDER BY r.return_id DESC', $customer ? [$owner] : [])->fetchAll(PDO::FETCH_ASSOC)];
    }

    $action = $data['action'] ?? '';
    $db->beginTransaction();
    if ($customer && $action === 'request') {
        $orderId = whole($data, 'order_id');
        $order = lockOrder($db, $orderId);
        if ((int) $order['user_id'] !== $owner) {
            fail(404, 'Order not found.');
        }
        if ($order['order_status'] !== 'Delivered' ||
            query($db, "SELECT 1 FROM return_requests WHERE order_id = ? AND status <> 'Rejected'", [$orderId])->fetchColumn()) {
            fail(409, 'This order is not eligible for another return.');
        }
        $code = refCode('RET-');
        query($db, "INSERT INTO return_requests (return_code, order_id, request_type, reason, customer_notes)
            VALUES (?, ?, 'Return_Refund', ?, ?)", [$code, $orderId, field($data, 'reason', 180),
            mb_substr(textField($data, 'notes'), 0, 2000)]);
        return ['return_code' => $code, 'status' => 'Pending Review'];
    }
    if ($customer || !in_array($action, ['approve', 'reject', 'confirm_refund'], true)) {
        fail(403, 'This operation is unavailable.');
    }

    $id = whole($data, 'return_id');
    $orderId = (int) query($db, 'SELECT order_id FROM return_requests WHERE return_id = ?', [$id])->fetchColumn();
    $order = lockOrder($db, $orderId);
    $request = query($db, 'SELECT * FROM return_requests WHERE return_id = ? FOR UPDATE', [$id])->fetch(PDO::FETCH_ASSOC);
    if (!$request) {
        fail(404, 'Return request not found.');
    }

    if ($action === 'confirm_refund') {
        if ($request['status'] !== 'Approved · Awaiting Refund' || $request['is_refunded'] || $order['payment_status'] !== 'Paid') {
            fail(409, 'This return is not awaiting a refund.');
        }
        $channel = $data['refund_channel'] ?? '';
        $reference = field($data, 'refund_reference', 80);
        if (!in_array($channel, ['GCash', 'Cash'], true) || mb_strlen($reference) < 6) {
            fail(422, 'Choose a refund channel and provide a reference of at least six characters.');
        }
        query($db, "UPDATE return_requests SET status = 'Refunded & Completed', is_refunded = TRUE,
            refund_channel = ?, refund_reference = ?, refunded_at = NOW() WHERE return_id = ?", [$channel, $reference, $id]);
        query($db, "UPDATE payments SET payment_status = 'Refunded' WHERE order_id = ?", [$orderId]);
        notice($db, (int) $order['user_id'], $orderId, 'Refund', 'Refund confirmed', 'Your refund was recorded.');
        return ['status' => 'Refunded & Completed'];
    }

    if ($request['status'] !== 'Pending Review') {
        fail(409, 'This return has already been reviewed.');
    }
    if ($action === 'reject') {
        query($db, "UPDATE return_requests SET status = 'Rejected' WHERE return_id = ?", [$id]);
        return ['status' => 'Rejected'];
    }
    if ($order['order_status'] !== 'Delivered' || $request['is_restocked'] ||
        ($order['payment_status'] !== 'Paid' && $order['payment_method'] !== 'COD')) {
        fail(409, 'This order is no longer eligible for approval.');
    }
    restockOrder($db, $orderId);
    query($db, "UPDATE orders SET order_status = 'Returned' WHERE order_id = ?", [$orderId]);
    $status = $order['payment_status'] === 'Paid' ? 'Approved · Awaiting Refund' : 'Approved & Closed (Unpaid COD)';
    query($db, 'UPDATE return_requests SET status = ?, is_restocked = TRUE WHERE return_id = ?', [$status, $id]);
    return ['status' => $status];
}, ['customer', 'admin', 'staff']);
