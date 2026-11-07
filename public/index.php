<?php

declare(strict_types=1);

require dirname(__DIR__) . '/backend/bootstrap.php';

$path = Http::path();

/* robots.txt 动态输出 */
if ($path === '/robots.txt') {
    Feed::robots();
    exit;
}

/* HTML 不缓存，资产由 hash 文件名负责缓存 */
header('Cache-Control: no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

if (str_starts_with($path, '/admin')) {
    $seo = Seo::adminMeta();
    $entry = 'admin';
    $assets = Seo::assets('admin');
} else {
    $seo = Seo::forPath($path);
    $entry = 'site';
    $assets = Seo::assets('site');
}

require BACKEND_DIR . '/views/shell.php';
