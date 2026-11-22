<?php
declare(strict_types=1);
require_once __DIR__ . '/shop.php';

shop(function (PDO $db, array $user, array $data, string $method): array {
    if ($method !== 'GET') {
        fail(405, 'Method not allowed.');
    }
    $emails = query($db, 'SELECT e.email_type, e.subject, e.recipient_email, e.body_preview,
        e.sent_at, o.order_number FROM email_logs e LEFT JOIN orders o ON o.order_id = e.order_id
        ORDER BY e.email_id DESC LIMIT 50')->fetchAll(PDO::FETCH_ASSOC);
    return ['emails' => $emails];
}, ['admin', 'staff']);
