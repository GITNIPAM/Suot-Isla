<?php
declare(strict_types=1);
require_once __DIR__ . "/bootstrap.php";
function accountView(array $row): array
{
    return ['name' => $row['full_name'], 'email' => $row['email'], 'role' => $row['role']];
}

try {
    startAccountSession();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!isset($_SESSION['user_id'])) {
            respond(200, ['user' => null]);
        }
        $query = accountDb()->prepare('SELECT full_name, email, role FROM users WHERE user_id = ?');
        $query->execute([$_SESSION['user_id']]);
        $row = $query->fetch(PDO::FETCH_ASSOC);
        respond(200, ['user' => $row ? accountView($row) : null]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: GET, POST');
        respond(405, ['message' => 'Method not allowed.']);
    }

    // JSON plus a custom header prevents cross-site HTML form submissions.
    if (($_SERVER['HTTP_X_SUOT_REQUEST'] ?? '') !== 'account' ||
        strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
        respond(403, ['message' => 'Request rejected.']);
    }

    $data = json_decode(file_get_contents('php://input', false, null, 0, 8192), true);
    if (!is_array($data)) {
        respond(400, ['message' => 'Invalid request.']);
    }

    $action = ($accountAction ?? null) ?? ($data['action'] ?? null);
    if ($action === 'logout') {
        $_SESSION = [];
        $cookie = session_get_cookie_params();
        unset($cookie['lifetime']);
        setcookie(session_name(), '', ['expires' => time() - 3600] + $cookie);
        session_destroy();
        respond(200, ['user' => null]);
    }

    if ($action !== 'register' && $action !== 'login') {
        respond(400, ['message' => 'Invalid account action.']);
    }

    $email = strtolower(textField($data, 'email'));
    $password = is_string($data['password'] ?? null) ? $data['password'] : '';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 160 ||
        strlen($password) < 8 || strlen($password) > 72 || str_contains($password, "\0")) {
        respond(422, ['message' => 'Enter a valid email and a password between 8 and 72 bytes.']);
    }

    $db = accountDb();
    if ($action === 'register') {
        $name = textField($data, 'full_name');
        $phone = textField($data, 'phone');
        if ($name === '' || mb_strlen($name) > 120 || !preg_match('/\A09[0-9]{9}\z/', $phone)) {
            respond(422, ['message' => 'Enter your name and a valid phone number.']);
        }

        $query = $db->prepare('INSERT INTO users (full_name, email, phone, password_hash, role)
                               VALUES (?, ?, ?, ?, ?)');
        try {
            $query->execute([$name, $email, $phone, password_hash($password, PASSWORD_BCRYPT), 'customer']);
        } catch (PDOException $error) {
            if (($error->errorInfo[1] ?? null) === 1062) {
                respond(409, ['message' => 'An account already exists for that email.']);
            }
            throw $error;
        }
        $row = ['user_id' => $db->lastInsertId(), 'full_name' => $name, 'email' => $email, 'role' => 'customer'];
    } else {
        $query = $db->prepare('SELECT user_id, full_name, email, role, password_hash FROM users WHERE email = ?');
        $query->execute([$email]);
        $row = $query->fetch(PDO::FETCH_ASSOC);
        if (!$row || !password_verify($password, $row['password_hash'])) {
            respond(401, ['message' => 'The email or password is incorrect.']);
        }
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $row['user_id'];
    $_SESSION['role'] = $row['role'];
    respond($action === 'register' ? 201 : 200, ['user' => accountView($row)]);
} catch (Throwable $error) {
    error_log('Suot Isla account request failed: ' . $error::class);
    respond(500, ['message' => 'Accounts are temporarily unavailable.']);
}
