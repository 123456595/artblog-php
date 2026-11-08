<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/backend/bootstrap.php';

$path = Http::path();

/* 独立入口兜底：服务器没有伪静态规则时也能正确分发 */
if (preg_match('#^/api(/|$)#', $path)) {
    require __DIR__ . '/api.php';
    exit;
}
if ($path === '/sitemap.xml') {
    require __DIR__ . '/sitemap.php';
    exit;
}
if ($path === '/rss.xml') {
    require __DIR__ . '/rss.php';
    exit;
}

/* 静态资源缺失时不要回退成 HTML */
if (preg_match('#^/(assets|uploads)/#', $path)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo '404 Not Found';
    exit;
}

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
