<?php
declare(strict_types=1);
require_once __DIR__ . '/shop.php';

shop(function (PDO $db, array $user, array $data, string $method): array {
    $id = (int) $user['user_id'];
    if ($method === 'GET') {
        return [
            'profile' => query($db, 'SELECT full_name, email, phone FROM users WHERE user_id = ?', [$id])->fetch(PDO::FETCH_ASSOC),
            'addresses' => query($db, 'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY address_id DESC', [$id])->fetchAll(PDO::FETCH_ASSOC),
            'emails' => query($db, 'SELECT * FROM email_logs WHERE user_id = ? ORDER BY email_id DESC', [$id])->fetchAll(PDO::FETCH_ASSOC),
        ];
    }

    $action = $data['action'] ?? '';
    if ($action === 'delete_address') {
        query($db, 'DELETE FROM user_addresses WHERE address_id = ? AND user_id = ?', [whole($data,'address_id'), $id]);
        return ['message' => 'Address removed.'];
    }
    $name = field($data, 'full_name', 120);
    $phone = field($data, 'phone', 11);
    if (!preg_match('/\A09[0-9]{9}\z/', $phone)) {
        fail(422, 'Enter an 11-digit Philippine mobile number.');
    }
    if ($action === 'profile') {
        query($db, 'UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?', [$name, $phone, $id]);
        return ['message' => 'Profile updated.'];
    }
    if ($action !== 'save_address') {
        fail(422, 'Invalid account action.');
    }
    $zip = field($data,'postal_code',4);
    if (!preg_match('/\A[0-9]{4}\z/', $zip)) {
        fail(422, 'Enter a four-digit postal code.');
    }
    $values = [$name, $phone, field($data,'street_address',255), field($data,'barangay',120),
        field($data,'city',120), field($data,'province',120), $zip];
    if (empty($data['address_id'])) {
        query($db, 'INSERT INTO user_addresses (recipient_name,phone,street_address,barangay,city,province,postal_code,user_id)
            VALUES (?,?,?,?,?,?,?,?)', [...$values,$id]);
    } else {
        query($db, 'UPDATE user_addresses SET recipient_name=?,phone=?,street_address=?,barangay=?,city=?,province=?,postal_code=?
            WHERE address_id=? AND user_id=?', [...$values,whole($data,'address_id'),$id]);
    }
    return ['message' => 'Address saved.'];
}, ['customer']);
