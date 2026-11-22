<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

function query(PDO $db, string $sql, array $params = []): PDOStatement
{
    $statement = $db->prepare($sql);
    $statement->execute($params);
    return $statement;
}

final class ShopError extends RuntimeException
{
    public function __construct(int $status, string $message, public array $details = [])
    {
        parent::__construct($message, $status);
    }
}

function fail(int $status, string $message, array $details = []): never
{
    throw new ShopError($status, $message, $details);
}

function shop(callable $handler, array $roles = []): never
{
    $db = null;
    try {
        startAccountSession();
        $method = $_SERVER['REQUEST_METHOD'];
        if (!in_array($method, ['GET', 'POST'], true)) {
            fail(405, 'Method not allowed.');
        }
        $data = [];
        if ($method === 'POST') {
            if (($_SERVER['HTTP_X_SUOT_REQUEST'] ?? '') !== 'shop') {
                fail(403, 'Request rejected.');
            }
            $type = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
            $data = match ($type) {
                'application/json' => json_decode(file_get_contents('php://input', false, null, 0, 65537), true),
                'multipart/form-data' => $_POST,
                default => null,
            };
            if (!is_array($data)) {
                fail(400, 'Invalid request.');
            }
        }
        $userId = (int) ($_SESSION['user_id'] ?? 0);
        session_write_close();
        if (!$userId) {
            fail(401, 'Please sign in first.');
        }
        $db = accountDb();
        $user = query($db, 'SELECT user_id, email, role FROM users WHERE user_id = ?', [$userId])->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            fail(401, 'Please sign in again.');
        }
        if ($roles && !in_array($user['role'], $roles, true)) {
            fail(403, 'You don’t have access to this operation.');
        }
        $result = $handler($db, $user, $data, $method);
        if ($db->inTransaction()) {
            $db->commit();
        }
        respond(200, $result);
    } catch (Throwable $error) {
        if ($db?->inTransaction()) {
            $db->rollBack();
        }
        if ($error instanceof ShopError) {
            respond($error->getCode(), ['message' => $error->getMessage()] + $error->details);
        }
        if ($error instanceof PDOException && ($error->errorInfo[1] ?? null) === 1062) {
            respond(409, ['message' => 'That name, slug or SKU is already in use.']);
        }
        error_log('Suot Isla shop request failed: ' . $error::class . ' ' . $error->getCode());
        respond(500, ['message' => 'The store could not complete your request.']);
    }
}

function field(array $data, string $key, int $max): string
{
    $value = textField($data, $key);
    if ($value === '' || mb_strlen($value) > $max) {
        fail(422, "Invalid $key.");
    }
    return $value;
}

function whole(array $data, string $key, int $min = 1, int $max = 2147483647): int
{
    $value = $data[$key] ?? null;
    if ((!is_int($value) && !is_string($value)) ||
        filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => $min, 'max_range' => $max]]) === false) {
        fail(422, "Invalid $key.");
    }
    return (int) $value;
}

function notice(PDO $db, int $userId, int $orderId, string $kind, string $subject, string $body): void
{
    query($db, 'INSERT INTO email_logs (user_id, order_id, recipient_email, email_type, subject, body_preview)
                SELECT user_id, ?, email, ?, ?, ? FROM users WHERE user_id = ?',
        [$orderId, $kind, $subject, $body, $userId]);
}

function refCode(string $prefix): string
{
    return $prefix . strtoupper(bin2hex(random_bytes(12)));
}
