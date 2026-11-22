<?php
declare(strict_types=1);
require_once __DIR__ . '/shop.php';

shop(function (PDO $db, array $user, array $data, string $method): array {
    if ($method === 'GET') {
        $couriers = query($db, "SELECT user_id, full_name FROM users WHERE role = 'courier' ORDER BY full_name")->fetchAll(PDO::FETCH_ASSOC);
        $users = $user['role'] === 'admin'
            ? query($db, 'SELECT u.user_id, u.full_name, u.email, u.phone, u.created_at, u.role,
                (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.user_id) AS orders_placed FROM users u ORDER BY u.full_name')->fetchAll(PDO::FETCH_ASSOC)
            : [];
        return ['couriers' => $couriers, 'users' => $users];
    }
    if ($user['role'] !== 'admin') {
        fail(403, 'Only an administrator can change roles.');
    }
    $id = whole($data, 'user_id');
    $role = $data['role'] ?? null;
    if ($id === (int) $user['user_id'] || !in_array($role, ['customer', 'staff', 'courier', 'admin'], true)) {
        fail(422, 'Choose a valid role for another account.');
    }
    query($db, 'UPDATE users SET role = ? WHERE user_id = ?', [$role, $id]);
    return ['message' => 'Role updated.'];
}, ['admin', 'staff']);
