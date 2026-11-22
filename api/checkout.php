<?php
declare(strict_types=1);
require_once __DIR__ . '/shop.php';

function cartLines(PDO $db, int $cartId, bool $lock = false): array
{
    return query($db, 'SELECT ci.quantity, v.variant_id, v.variant_sku, v.size_label, v.color_name,
        v.stock_qty, p.name, p.slug, p.category_id, p.series_id, (p.is_archived OR v.is_archived OR c.is_archived) AS is_archived,
        COALESCE(v.price_override, p.base_price) AS unit_price
        FROM cart_items ci JOIN product_variants v ON v.variant_id = ci.variant_id
        JOIN products p ON p.product_id = v.product_id JOIN categories c ON c.category_id = p.category_id
        WHERE ci.cart_id = ? ORDER BY v.variant_id' . ($lock ? ' FOR UPDATE' : ''), [$cartId])->fetchAll(PDO::FETCH_ASSOC);
}

function checkStock(PDO $db, array $line, int $quantity): void
{
    if (!$line['is_archived'] && $quantity <= (int) $line['stock_qty']) {
        return;
    }
    $alternatives = query($db, 'SELECT p.name, p.slug, v.variant_id, v.variant_sku, v.size_label, v.color_name
        FROM products p JOIN product_variants v ON v.product_id = p.product_id JOIN categories c ON c.category_id = p.category_id
        WHERE p.is_archived = FALSE AND v.is_archived = FALSE AND c.is_archived = FALSE AND v.stock_qty > 0 AND v.variant_id <> ?
        AND (p.category_id = ? OR p.series_id = ?) ORDER BY p.name, v.variant_id LIMIT 8',
        [$line['variant_id'], $line['category_id'], $line['series_id']])->fetchAll(PDO::FETCH_ASSOC);
    fail(409, 'Insufficient stock for ' . $line['name'] . '.', ['alternatives' => $alternatives]);
}

shop(function (PDO $db, array $user, array $data, string $method): array {
    $userId = (int) $user['user_id'];
    if ($method === 'GET') {
        $cartId = (int) query($db, 'SELECT cart_id FROM carts WHERE user_id = ?', [$userId])->fetchColumn();
        return ['items' => cartLines($db, $cartId)];
    }

    $action = $data['action'] ?? '';
    if (!in_array($action, ['add', 'set', 'validate', 'checkout'], true)) {
        fail(422, 'Invalid cart action.');
    }
    $db->beginTransaction();
    query($db, 'INSERT INTO carts (user_id, session_token) VALUES (?, ?) ON DUPLICATE KEY UPDATE cart_id = cart_id',
        [$userId, bin2hex(random_bytes(24))]);
    $cartId = (int) query($db, 'SELECT cart_id FROM carts WHERE user_id = ? FOR UPDATE', [$userId])->fetchColumn();

    if ($action === 'add' || $action === 'set') {
        query($db, 'UPDATE carts SET updated_at = NOW() WHERE cart_id = ?', [$cartId]);
        $variantId = whole($data, 'variant_id');
        $quantity = whole($data, 'quantity', $action === 'add' ? 1 : 0, 1000);
        if ($quantity === 0) {
            query($db, 'DELETE FROM cart_items WHERE cart_id = ? AND variant_id = ?', [$cartId, $variantId]);
            return ['items' => cartLines($db, $cartId)];
        }
        $variant = query($db, 'SELECT v.variant_id, v.stock_qty, p.name, p.category_id, p.series_id, (p.is_archived OR v.is_archived OR c.is_archived) AS is_archived
            FROM product_variants v JOIN products p ON p.product_id = v.product_id JOIN categories c ON c.category_id = p.category_id WHERE v.variant_id = ? FOR UPDATE',
            [$variantId])->fetch(PDO::FETCH_ASSOC);
        if (!$variant) {
            fail(404, 'Product variant not found.');
        }
        if ($action === 'add') {
            $quantity += (int) query($db, 'SELECT quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?',
                [$cartId, $variantId])->fetchColumn();
        }
        checkStock($db, $variant, $quantity);
        query($db, 'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)', [$cartId, $variantId, $quantity]);
        return ['items' => cartLines($db, $cartId)];
    }

    $lines = cartLines($db, $cartId, true);
    if (!$lines) {
        fail(422, 'Your cart is empty.');
    }
    $subtotal = 0;
    foreach ($lines as $line) {
        checkStock($db, $line, (int) $line['quantity']);
        $subtotal += (int) round((float) $line['unit_price'] * 100) * (int) $line['quantity'];
    }
    $shipping = $subtotal >= 350000 ? 0 : 15000;
    $discount = 0;
    $couponId = null;
    $code = textField($data, 'coupon');
    if ($code !== '') {
        $coupon = query($db, 'SELECT * FROM coupons WHERE code = ? AND is_active = TRUE', [$code])->fetch(PDO::FETCH_ASSOC);
        if (!$coupon || $subtotal < (int) round((float) $coupon['min_spend'] * 100)) {
            fail(422, 'The coupon is unavailable for this cart.');
        }
        $couponId = $coupon['coupon_id'];
        switch ($coupon['discount_type']) {
            case 'free_shipping': $shipping = 0; break;
            case 'percentage': $discount = (int) round($subtotal * (float) $coupon['discount_value'] / 100); break;
            case 'fixed': $discount = (int) round((float) $coupon['discount_value'] * 100); break;
        }
    }
    $discount = max(0, min($subtotal, $discount));
    $totals = [
        'subtotal' => $subtotal / 100,
        'delivery_fee' => $shipping / 100,
        'discount' => $discount / 100,
        'total' => ($subtotal + $shipping - $discount) / 100,
    ];
    if ($action === 'validate') {
        return ['items' => $lines, 'totals' => $totals];
    }

    $payment = $data['payment_method'] ?? '';
    if (!in_array($payment, ['GCash', 'COD'], true)) {
        fail(422, 'Choose GCash or cash on delivery.');
    }
    $address = [];
    foreach (['full_name' => 120, 'phone' => 11, 'street_address' => 255, 'barangay' => 120,
        'city' => 120, 'province' => 120, 'postal_code' => 4] as $key => $max) {
        $address[$key] = field($data, $key, $max);
    }
    if (!preg_match('/\A09[0-9]{9}\z/', $address['phone']) || !preg_match('/\A[0-9]{4}\z/', $address['postal_code'])) {
        fail(422, 'Enter an 11-digit Philippine mobile number and four-digit postal code.');
    }
    $payer = textField($data, 'payer_mobile');
    if ($payment === 'GCash' && !preg_match('/\A09[0-9]{9}\z/', $payer)) {
        fail(422, 'Enter a Philippine mobile number for the mock GCash payment.');
    }
    $billing = implode(', ', $address);
    $alternate = textField($data, 'billing_address');
    if ($alternate !== '') {
        $billing = field($data, 'billing_address', 500);
    }
    $addressArgs = [$userId, ...array_values($address)];
    $addressId = query($db, 'SELECT address_id FROM user_addresses WHERE user_id = ? AND recipient_name = ?
        AND phone = ? AND street_address = ? AND barangay = ? AND city = ? AND province = ? AND postal_code = ? LIMIT 1',
        $addressArgs)->fetchColumn();
    if (!$addressId) {
        query($db, 'INSERT INTO user_addresses (user_id, recipient_name, phone, street_address, barangay, city, province, postal_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)', $addressArgs);
        $addressId = $db->lastInsertId();
    }

    $number = refCode('PENDING-');
    query($db, 'INSERT INTO orders (order_number, user_id, shipping_address_id, shipping_address_snapshot,
        billing_address_snapshot, coupon_id, subtotal, delivery_fee, discount_amount, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [$number, $userId, $addressId, implode(', ', $address), $billing, $couponId, ...array_values($totals)]);
    $orderId = (int) $db->lastInsertId();
    $number = 'SI-' . date('Y') . '-' . str_pad((string) $orderId, 6, '0', STR_PAD_LEFT);
    query($db, 'UPDATE orders SET order_number = ? WHERE order_id = ?', [$number, $orderId]);
    foreach ($lines as $line) {
        $quantity = (int) $line['quantity'];
        $decrement = query($db, 'UPDATE product_variants SET stock_qty = stock_qty - ? WHERE variant_id = ? AND stock_qty >= ?',
            [$quantity, $line['variant_id'], $quantity]);
        if ($decrement->rowCount() !== 1) {
            fail(409, 'Stock changed. Check your shopping bag and try again.');
        }
        query($db, 'INSERT INTO order_items (order_id, variant_id, product_name_snapshot, size_snapshot,
            color_snapshot, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$orderId, $line['variant_id'], $line['name'], $line['size_label'], $line['color_name'], $line['quantity'], $line['unit_price']]);
    }
    query($db, 'INSERT INTO payments (order_id, payment_method, transaction_ref, payer_mobile_last4) VALUES (?, ?, ?, ?)',
        [$orderId, $payment, refCode('SI-PAY-'), $payment === 'GCash' ? substr($payer, -4) : null]);
    query($db, 'INSERT INTO deliveries (order_id, tracking_number) VALUES (?, ?)', [$orderId, refCode('SI-TRK-')]);
    notice($db, $userId, $orderId, 'Confirmation', "Order $number received", 'Your order was received. Payment is pending.');
    query($db, 'DELETE FROM cart_items WHERE cart_id = ?', [$cartId]);
    if (isset($_SESSION['visit_token'])) {
        query($db, 'UPDATE shop_visits SET purchased_at = COALESCE(purchased_at, NOW()) WHERE visit_token = ?',
            [$_SESSION['visit_token']]);
    }
    return ['order_id' => $orderId, 'order_number' => $number, 'payment_status' => 'Pending', 'totals' => $totals];
}, ['customer']);
