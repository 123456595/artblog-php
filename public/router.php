<?php

declare(strict_types=1);

/*
 | php -S 内置服务器路由：
 |   php -d extension=pdo_sqlite -d extension=sqlite3 -S 127.0.0.1:8080 -t public public/router.php
 */

$path = (string) (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');

/* 已存在的静态文件直接透传（assets / uploads / favicon 等） */
if ($path !== '/' && is_file(__DIR__ . $path)) {
    return false;
}

if (preg_match('#^/api(/|$)#', $path)) {
    require __DIR__ . '/api.php';
    return true;
}
if ($path === '/sitemap.xml') {
    require __DIR__ . '/sitemap.php';
    return true;
}
if ($path === '/rss.xml') {
    require __DIR__ . '/rss.php';
    return true;
}

require __DIR__ . '/index.php';
return true;
