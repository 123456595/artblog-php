<?php

declare(strict_types=1);

/*
 |--------------------------------------------------------------------------
 | API 路由分发
 |--------------------------------------------------------------------------
 */

final class Api
{
    public static function dispatch(): void
    {
        $method = Http::method();
        $path = Http::path();

        // 去掉 /api 前缀
        $path = preg_replace('#^/api#', '', $path) ?: '/';
        $seg = array_values(array_filter(explode('/', $path), static fn($s) => $s !== ''));

        try {
            if (($seg[0] ?? '') === 'admin') {
                self::admin($method, array_slice($seg, 1));
                return;
            }
            self::public($method, $seg);
        } catch (PDOException $e) {
            if (APP_ENV === 'local') {
                Http::error(500, '数据库错误：' . $e->getMessage());
            }
            Http::error(500, '服务器开小差了');
        } catch (Throwable $e) {
            if (APP_ENV === 'local') {
                Http::error(500, get_class($e) . '：' . $e->getMessage());
            }
            Http::error(500, '服务器开小差了');
        }
    }

    /* ---------- 公共 API ---------- */
    private static function public(string $method, array $seg): void
    {
        $resource = $seg[0] ?? '';
        $param = $seg[1] ?? null;

        switch ($resource) {
            case 'site':
                self::needGet($method);
                Http::json(Content::site());
                break;

            case 'posts':
                self::needGet($method);
                if ($param !== null) {
                    Http::json(Content::post($param));
                }
                Http::json(Content::posts(
                    (int) ($_GET['page'] ?? 1),
                    (int) ($_GET['per_page'] ?? 10),
                    isset($_GET['tag']) ? (string) $_GET['tag'] : null,
                    isset($_GET['q']) ? (string) $_GET['q'] : null
                ));
                break;

            case 'works':
                self::needGet($method);
                if ($param !== null) {
                    Http::json(Content::work($param));
                }
                Http::json(Content::works());
                break;

            case 'gallery':
                self::needGet($method);
                Http::json(Content::gallery());
                break;

            case 'tags':
                self::needGet($method);
                Http::json(['tags' => Content::tags()]);
                break;

            case 'archive':
                self::needGet($method);
                Http::json(Content::archive());
                break;

            case 'subscribe':
                if ($method !== 'POST') {
                    Http::error(405, 'Method Not Allowed');
                }
                $body = Http::body();
                Content::subscribe((string) ($body['email'] ?? ''), Http::ip());
                Http::json(['ok' => true]);
                break;

            default:
                Http::error(404, '接口不存在');
        }
    }

    /* ---------- 后台 API ---------- */
    private static function admin(string $method, array $seg): void
    {
        $resource = $seg[0] ?? '';
        $param = $seg[1] ?? null;

        // 登录放行（内部自带限流）
        if ($resource === 'login' && $method === 'POST') {
            $body = Http::body();
            Auth::login((string) ($body['user'] ?? ''), (string) ($body['password'] ?? ''));
            Http::json(['user' => Auth::user(), 'csrf' => Auth::csrf()]);
            return;
        }

        if ($resource === 'logout' && $method === 'POST') {
            Auth::logout();
            Http::json(['ok' => true]);
            return;
        }

        Auth::require();
        Auth::verifyCsrf();

        switch ($resource) {
            case 'me':
                self::needGet($method);
                Http::json(['user' => Auth::user(), 'csrf' => Auth::csrf()]);
                break;

            case 'stats':
                self::needGet($method);
                $stats = Content::stats();
                $recent = Content::adminPosts(null, null, 1, 5);
                Http::json($stats + ['recentPosts' => $recent['posts']]);
                break;

            case 'posts':
                if ($method === 'GET') {
                    if ($param !== null) {
                        Http::json(Content::adminPost((int) $param));
                    }
                    Http::json(Content::adminPosts(
                        isset($_GET['q']) ? (string) $_GET['q'] : null,
                        isset($_GET['status']) ? (string) $_GET['status'] : null,
                        (int) ($_GET['page'] ?? 1),
                        (int) ($_GET['per_page'] ?? 20)
                    ));
                }
                $body = Http::body();
                if ($method === 'POST' && $param === 'batch') {
                    Http::json(Content::batchPosts($body));
                }
                if ($method === 'POST') {
                    $id = Content::savePost($body, null);
                    Http::json(['id' => $id], 201);
                }
                if ($method === 'PUT' && $param !== null) {
                    Content::savePost($body, (int) $param);
                    Http::json(['id' => (int) $param]);
                }
                if ($method === 'DELETE' && $param !== null) {
                    Content::deletePost((int) $param);
                    Http::noContent();
                }
                break;

            case 'works':
            case 'gallery':
            case 'now':
            case 'tools':
                self::crud($resource, $method, $param);
                break;

            case 'settings':
                if ($method === 'GET') {
                    Http::json(['settings' => Content::settings()]);
                }
                if ($method === 'PUT') {
                    $body = Http::body();
                    $kv = $body['settings'] ?? $body;
                    if (!is_array($kv)) {
                        Http::error(422, '参数格式错误');
                    }
                    Content::saveSettings($kv);
                    Http::json(['ok' => true]);
                }
                break;

            case 'subscribers':
                self::needGet($method, true);
                if ($method === 'GET') {
                    Http::json(Content::subscribers());
                }
                if ($method === 'DELETE' && $param !== null) {
                    Content::deleteSubscriber((int) $param);
                    Http::noContent();
                }
                break;

            case 'media':
                if ($method === 'GET') {
                    Http::json(Content::mediaList());
                }
                if ($method === 'DELETE' && $param !== null) {
                    Content::deleteMedia((int) $param);
                    Http::noContent();
                }
                break;

            case 'preview':
                if ($method !== 'POST') {
                    Http::error(405, 'Method Not Allowed');
                }
                $body = Http::body();
                $render = Markdown::render((string) ($body['markdown'] ?? ''));
                Http::json(['html' => $render['html'], 'readingTime' => $render['readingTime']]);
                break;

            case 'upload':
                if ($method !== 'POST') {
                    Http::error(405, 'Method Not Allowed');
                }
                if (empty($_FILES['file'])) {
                    Http::error(422, '没有收到文件');
                }
                Http::json(Upload::handle($_FILES['file']), 201);
                break;

            default:
                Http::error(404, '接口不存在');
        }
    }

    private static function crud(string $resource, string $method, ?string $param): void
    {
        $map = [
            'works' => ['adminWorks', 'saveWork', 'deleteWork'],
            'gallery' => ['adminGallery', 'saveGalleryItem', 'deleteGalleryItem'],
            'now' => ['adminNow', 'saveNow', 'deleteNow'],
            'tools' => ['adminTools', 'saveTool', 'deleteTool'],
        ];
        [$listFn, $saveFn, $deleteFn] = $map[$resource];

        if ($method === 'GET') {
            Http::json(Content::$listFn());
        }
        if ($method === 'POST') {
            $id = Content::$saveFn(Http::body(), null);
            Http::json(['id' => $id], 201);
        }
        if ($method === 'PUT' && $param !== null) {
            Content::$saveFn(Http::body(), (int) $param);
            Http::json(['id' => (int) $param]);
        }
        if ($method === 'DELETE' && $param !== null) {
            Content::$deleteFn((int) $param);
            Http::noContent();
        }
        Http::error(405, 'Method Not Allowed');
    }

    private static function needGet(string $method, bool $allowDelete = false): void
    {
        if ($method === 'GET') {
            return;
        }
        if ($allowDelete && $method === 'DELETE') {
            return;
        }
        Http::error(405, 'Method Not Allowed');
    }
}
