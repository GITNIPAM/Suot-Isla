<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/bootstrap.php';

function smtpSetting(string $key): string
{
    return (string) (shopConfig()['smtp'][strtolower($key)] ?? getenv('SUOT_SMTP_' . $key) ?: '');
}

function sendNotice(array $notice, array $settings): void
{
    $recipient = $notice['recipient_email'];
    if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Invalid recipient.');
    }
    $sender = $settings['FROM'];
    $subject = mb_encode_mimeheader($notice['subject'], 'UTF-8', 'B', "\r\n");
    $message = implode("\r\n", [
        'From: Suot Isla <' . $sender . '>',
        'To: <' . $recipient . '>',
        'Date: ' . date(DATE_RFC2822),
        'Message-ID: <suotisla-' . $notice['email_id'] . '@' . substr(strrchr($sender, '@'), 1) . '>',
        'Subject: ' . $subject,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        chunk_split(base64_encode($notice['body_preview'])),
    ]);
    $url = ($settings['PORT'] === '465' ? 'smtps://' : 'smtp://') . $settings['HOST'] . ':' . $settings['PORT'];
    $smtp = curl_init($url);
    $offset = 0;
    curl_setopt_array($smtp, [
        CURLOPT_USE_SSL => CURLUSESSL_ALL,
        CURLOPT_USERNAME => $settings['USER'],
        CURLOPT_PASSWORD => $settings['PASSWORD'],
        CURLOPT_MAIL_FROM => $sender,
        CURLOPT_MAIL_RCPT => [$recipient],
        CURLOPT_UPLOAD => true,
        CURLOPT_INFILESIZE => strlen($message),
        CURLOPT_READFUNCTION => static function ($handle, $stream, int $length) use ($message, &$offset): string {
            $part = substr($message, $offset, $length);
            $offset += strlen($part);
            return $part;
        },
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 25,
    ]);
    if (curl_exec($smtp) === false) {
        throw new RuntimeException('SMTP rejected or could not deliver the message (cURL ' . curl_errno($smtp) . ').');
    }
}

try {
    $settings = [];
    foreach (['HOST','PORT','FROM','USER','PASSWORD'] as $key) {
        $settings[$key] = smtpSetting($key);
    }
    if (!preg_match('/\A[a-z0-9.-]+\z/i', $settings['HOST']) ||
        !in_array($settings['PORT'], ['465','587'], true) ||
        !filter_var($settings['FROM'], FILTER_VALIDATE_EMAIL) ||
        $settings['USER'] === '' || $settings['PASSWORD'] === '') {
        throw new RuntimeException('Configure SMTP host, port (465 or 587), sender and credentials.');
    }

    $db = accountDb();
    if (!(int) $db->query("SELECT GET_LOCK('suotisla_notice_sender', 0)")->fetchColumn()) {
        throw new RuntimeException('An email worker is already running.');
    }
    try {
        $queue = $db->query('SELECT * FROM email_logs WHERE sent_at IS NULL ORDER BY email_id LIMIT 20')->fetchAll(PDO::FETCH_ASSOC);
        $mark = $db->prepare('UPDATE email_logs SET sent_at = NOW() WHERE email_id = ? AND sent_at IS NULL');
        $failed = 0;
        foreach ($queue as $notice) {
            try {
                sendNotice($notice, $settings);
                $mark->execute([$notice['email_id']]);
                fwrite(STDOUT, "SMTP accepted notice " . $notice['email_id'] . ".\n");
            } catch (Throwable $error) {
                $failed++;
                fwrite(STDERR, "Notice " . $notice['email_id'] . ": " . $error->getMessage() . "\n");
            }
        }
    } finally {
        $db->query("SELECT RELEASE_LOCK('suotisla_notice_sender')");
    }
    exit($failed > 0 ? 1 : 0);
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
}
