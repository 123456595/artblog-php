<?php

declare(strict_types=1);

/*
 |--------------------------------------------------------------------------
 | ArtBlog · 引导文件
 |--------------------------------------------------------------------------
 */

define('ROOT', dirname(__DIR__));
define('BACKEND_DIR', ROOT . DIRECTORY_SEPARATOR . 'backend');
define('PUBLIC_DIR', ROOT . DIRECTORY_SEPARATOR . 'public');
define('STORAGE_DIR', ROOT . DIRECTORY_SEPARATOR . 'storage');
define('UPLOAD_DIR', PUBLIC_DIR . DIRECTORY_SEPARATOR . 'uploads');

/* ---------- .env ---------- */
function env_load(string $file): void
{
    if (!is_file($file)) {
        return;
    }
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $pos = strpos($line, '=');
        if ($pos === false) {
            continue;
        }
        $key = trim(substr($line, 0, $pos));
        $value = trim(substr($line, $pos + 1));
        $value = trim($value, "\"'");
        $_ENV[$key] = $value;
        /* 不少虚拟主机在 disable_functions 里禁用 putenv；写进 $_ENV 即可正常读取 */
        if (function_exists('putenv')) {
            @putenv($key . '=' . $value);
        }
    }
}

/** 兼容 disable_functions 环境：被禁用时静默跳过 */
function ini_set_safe(string $key, string $value): void
{
    if (function_exists('ini_set')) {
        @ini_set($key, $value);
    }
}

function env_get(string $key, string $default = ''): string
{
    $value = $_ENV[$key] ?? getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }
    return (string) $value;
}

env_load(ROOT . DIRECTORY_SEPARATOR . '.env');

define('APP_NAME', env_get('APP_NAME', 'CodeKpy'));
define('APP_URL', rtrim(env_get('APP_URL', 'http://127.0.0.1:8080'), '/'));
define('APP_ENV', env_get('APP_ENV', 'production'));
define('APP_TIMEZONE', env_get('APP_TIMEZONE', 'Asia/Shanghai'));
define('DB_PATH', ROOT . DIRECTORY_SEPARATOR . env_get('DB_PATH', 'storage/blog.sqlite'));
define('ADMIN_USER', env_get('ADMIN_USER', 'admin'));
define('ADMIN_PASSWORD', env_get('ADMIN_PASSWORD', ''));

date_default_timezone_set(APP_TIMEZONE);

if (APP_ENV === 'local') {
    error_reporting(E_ALL);
    ini_set_safe('display_errors', '1');
} else {
    error_reporting(0);
    ini_set_safe('display_errors', '0');
}

/* ---------- 会话目录（不依赖系统临时目录权限） ---------- */
$sessionDir = STORAGE_DIR . DIRECTORY_SEPARATOR . 'sessions';
if (!is_dir($sessionDir)) {
    @mkdir($sessionDir, 0775, true);
}
if (is_writable($sessionDir)) {
    ini_set_safe('session.save_path', $sessionDir);
}

/* ---------- 自动加载 ---------- */
spl_autoload_register(function (string $class): void {
    $file = BACKEND_DIR . DIRECTORY_SEPARATOR . $class . '.php';
    if (is_file($file)) {
        require $file;
    }
});

/* ---------- 数据库单例 ---------- */
function db(): PDO
{
    return Database::pdo();
}

/* ---------- 杂项 ---------- */
function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

if (!function_exists('str_starts_with')) {
    // PHP < 8.0 兜底；8.0+ 使用内置实现
    function str_starts_with(string $haystack, string $needle): bool
    {
        return $needle === '' || strpos($haystack, $needle) === 0;
    }
}
