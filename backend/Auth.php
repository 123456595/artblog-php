<?php

declare(strict_types=1);

/*
 |--------------------------------------------------------------------------
 | 认证：单账号 + Session + CSRF + 登录限流
 |--------------------------------------------------------------------------
 */

final class Auth
{
    private const SESSION_NAME = 'ARTBLOG_SESSID';
    private const WINDOW_SECONDS = 600; // 限流窗口 10 分钟
    private const MAX_FAILS = 5;

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        session_name(self::SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    public static function csrf(): string
    {
        self::start();
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return (string) $_SESSION['csrf'];
    }

    public static function check(): bool
    {
        self::start();
        return !empty($_SESSION['admin']);
    }

    public static function require(): void
    {
        if (!self::check()) {
            Http::error(401, '未登录或会话已过期');
        }
    }

    /** 非 GET 的后台请求必须携带 X-CSRF-Token */
    public static function verifyCsrf(): void
    {
        if (Http::method() === 'GET') {
            return;
        }
        $token = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        $session = self::csrf();
        if ($token === '' || !hash_equals($session, $token)) {
            Http::error(403, 'CSRF 校验失败');
        }
    }

    public static function login(string $user, string $password): void
    {
        self::start();
        $ip = Http::ip();
        $pdo = db();

        $since = date('Y-m-d H:i:s', time() - self::WINDOW_SECONDS);
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND ok = 0 AND created_at >= ?'
        );
        $stmt->execute([$ip, $since]);
        if ((int) $stmt->fetchColumn() >= self::MAX_FAILS) {
            Http::error(429, '尝试过于频繁，请 10 分钟后再试');
        }

        $ok = hash_equals(ADMIN_USER, $user) && hash_equals(ADMIN_PASSWORD, $password);

        $log = $pdo->prepare('INSERT INTO login_attempts (ip, created_at, ok) VALUES (?, ?, ?)');
        $log->execute([$ip, date('Y-m-d H:i:s'), $ok ? 1 : 0]);

        if (!$ok) {
            Http::error(401, '账号或密码错误');
        }

        session_regenerate_id(true);
        $_SESSION['admin'] = $user;
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], (string) $p['domain'], (bool) $p['secure'], (bool) $p['httponly']);
        }
        session_destroy();
    }

    public static function user(): ?string
    {
        self::start();
        $user = $_SESSION['admin'] ?? null;
        return is_string($user) ? $user : null;
    }
}
