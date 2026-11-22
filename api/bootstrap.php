<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function shopConfig(): array
{
    $localPath = __DIR__ . '/config.local.php';
    return is_file($localPath) ? require $localPath : [
        'dsn' => getenv('SUOT_DB_DSN'),
        'user' => getenv('SUOT_DB_USER'),
        'password' => getenv('SUOT_DB_PASSWORD'),
    ];
}

function accountDb(): PDO
{
    $config = shopConfig();
    return new PDO($config['dsn'], $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function startAccountSession(): void
{
    ini_set('session.use_strict_mode', '1');
    session_name('suot_isla_session');
    session_set_cookie_params([
        'path' => rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\') . '/',
        'httponly' => true,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Lax',
    ]);
    session_start();
}

function textField(array $data, string $key): string
{
    return is_string($data[$key] ?? null) ? trim($data[$key]) : '';
}
