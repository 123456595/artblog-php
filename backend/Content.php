<?php

declare(strict_types=1);

/*
 |--------------------------------------------------------------------------
 | 内容：查询与写入（文章 / 作品 / 图墙 / Now / 工具箱 / 设置 / 订阅 / 媒体）
 |--------------------------------------------------------------------------
 */

final class Content
{
    /* ================================================================
     * 公共查询
     * ============================================================== */

    public static function site(): array
    {
        $s = self::settings();
        $socials = json_decode((string) ($s['socials'] ?? '[]'), true);

        return [
            'meta' => [
                'name' => $s['name'] ?? APP_NAME,
                'role' => $s['role'] ?? '',
                'status' => $s['status'] ?? '',
                'intro' => $s['intro'] ?? '',
                'bio' => $s['bio'] ?? '',
                'avatar' => $s['avatar'] ?? '',
                'since' => $s['since'] ?? '',
                'location' => $s['location'] ?? '',
                'email' => $s['email'] ?? '',
                'socials' => is_array($socials) ? $socials : [],
                'footerNote' => $s['footerNote'] ?? '',
                'newsletterNote' => $s['newsletterNote'] ?? '',
            ],
            'stats' => [
                'posts' => self::countWhere('posts', "status = 'published'"),
                'works' => self::countWhere('works', "status = 'published'"),
                'tags' => self::countWhere('tags'),
                'words' => self::totalWords(),
            ],
            'now' => self::nowItems(),
            'tools' => self::toolItems(),
            'tags' => self::tags(),
        ];
    }

    public static function posts(int $page, int $perPage, ?string $tag, ?string $q): array
    {
        $page = max(1, $page);
        $perPage = min(50, max(1, $perPage));

        $where = ["p.status = 'published'"];
        $params = [];
        $join = '';

        if ($tag !== null && $tag !== '') {
            $join .= ' JOIN post_tags pt ON pt.post_id = p.id JOIN tags t ON t.id = pt.tag_id';
            $where[] = 't.slug = ?';
            $params[] = $tag;
        }
        if ($q !== null && $q !== '') {
            $where[] = '(p.title LIKE ? OR p.subtitle LIKE ? OR p.excerpt LIKE ? OR p.content_md LIKE ?)';
            $like = '%' . $q . '%';
            array_push($params, $like, $like, $like, $like);
        }

        $whereSql = implode(' AND ', $where);

        $total = (int) self::run(
            "SELECT COUNT(DISTINCT p.id) FROM posts p{$join} WHERE {$whereSql}",
            $params
        )->fetchColumn();

        $pages = max(1, (int) ceil($total / $perPage));
        $page = min($page, $pages);
        $offset = ($page - 1) * $perPage;

        $rows = self::run(
            "SELECT DISTINCT p.* FROM posts p{$join} WHERE {$whereSql}
             ORDER BY p.published_at DESC, p.id DESC LIMIT ? OFFSET ?",
            array_merge($params, [$perPage, $offset])
        )->fetchAll();

        return [
            'posts' => array_map([self::class, 'mapPostSummary'], $rows),
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'pages' => $pages,
        ];
    }

    public static function post(string $slug): array
    {
        $row = self::run(
            "SELECT * FROM posts WHERE slug = ? AND status = 'published'",
            [$slug]
        )->fetch();

        if (!$row) {
            Http::error(404, '文章不存在');
        }

        db()->prepare('UPDATE posts SET views = views + 1 WHERE id = ?')->execute([(int) $row['id']]);

        $render = Markdown::render((string) $row['content_md']);

        $prev = self::run(
            "SELECT slug, title FROM posts WHERE status = 'published' AND published_at < ?
             ORDER BY published_at DESC LIMIT 1",
            [$row['published_at']]
        )->fetch();
        $next = self::run(
            "SELECT slug, title FROM posts WHERE status = 'published' AND published_at > ?
             ORDER BY published_at ASC LIMIT 1",
            [$row['published_at']]
        )->fetch();

        // 相关：共享标签，按共享数量排序
        $related = self::run(
            "SELECT p.*, COUNT(pt2.tag_id) AS shared FROM posts p
             JOIN post_tags pt2 ON pt2.post_id = p.id
             WHERE p.status = 'published' AND p.id != ?
               AND pt2.tag_id IN (SELECT tag_id FROM post_tags WHERE post_id = ?)
             GROUP BY p.id ORDER BY shared DESC, p.published_at DESC LIMIT 3",
            [(int) $row['id'], (int) $row['id']]
        )->fetchAll();

        $detail = self::mapPostSummary($row);
        $detail['html'] = $render['html'];
        $detail['seoTitle'] = $row['seo_title'];
        $detail['seoDesc'] = $row['seo_desc'];
        $detail['views'] = (int) $row['views'] + 1;
        $detail['prev'] = $prev ? ['slug' => $prev['slug'], 'title' => $prev['title']] : null;
        $detail['next'] = $next ? ['slug' => $next['slug'], 'title' => $next['title']] : null;
        $detail['related'] = array_map([self::class, 'mapPostSummary'], $related);

        return $detail;
    }

    public static function works(): array
    {
        $rows = self::run(
            "SELECT * FROM works WHERE status = 'published' ORDER BY sort ASC, id ASC"
        )->fetchAll();
        return ['works' => array_map([self::class, 'mapWork'], $rows)];
    }

    public static function work(string $slug): array
    {
        $row = self::run(
            "SELECT * FROM works WHERE slug = ? AND status = 'published'",
            [$slug]
        )->fetch();
        if (!$row) {
            Http::error(404, '作品不存在');
        }
        return self::mapWork($row);
    }

    public static function gallery(): array
    {
        $rows = self::run('SELECT * FROM gallery ORDER BY sort ASC, id ASC')->fetchAll();
        return [
            'items' => array_map(static function (array $r): array {
                return [
                    'id' => (int) $r['id'],
                    'src' => $r['src'],
                    'caption' => $r['caption'],
                    'location' => $r['location'],
                    'takenAt' => $r['taken_at'],
                ];
            }, $rows),
        ];
    }

    public static function archive(): array
    {
        $rows = self::run(
            "SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC"
        )->fetchAll();

        $years = [];
        foreach ($rows as $row) {
            $year = substr((string) $row['published_at'], 0, 4) ?: '未标年';
            $years[$year][] = self::mapPostSummary($row);
        }
        $out = [];
        foreach ($years as $year => $posts) {
            $out[] = ['year' => $year, 'posts' => $posts];
        }
        return ['years' => $out];
    }

    public static function tags(): array
    {
        $rows = self::run(
            "SELECT t.slug, t.name, COUNT(pt.post_id) AS cnt FROM tags t
             JOIN post_tags pt ON pt.tag_id = t.id
             JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
             GROUP BY t.id ORDER BY cnt DESC, t.name ASC"
        )->fetchAll();
        return array_map(static function (array $r): array {
            return ['slug' => $r['slug'], 'name' => $r['name'], 'count' => (int) $r['cnt']];
        }, $rows);
    }

    public static function subscribe(string $email, string $ip): void
    {
        $email = mb_strtolower(trim($email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Http::error(422, '邮箱格式不正确');
        }
        try {
            db()->prepare('INSERT INTO subscribers (email, ip, created_at) VALUES (?, ?, ?)')
                ->execute([$email, $ip, date('Y-m-d H:i:s')]);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'UNIQUE') !== false) {
                Http::error(409, '这个邮箱已经订阅过了');
            }
            throw $e;
        }
    }

    /* ================================================================
     * 后台 · 文章
     * ============================================================== */

    public static function adminPosts(?string $q, ?string $status, int $page, int $perPage): array
    {
        $page = max(1, $page);
        $perPage = min(100, max(1, $perPage));

        $where = ['1=1'];
        $params = [];
        if ($status === 'draft' || $status === 'published') {
            $where[] = 'status = ?';
            $params[] = $status;
        }
        if ($q !== null && $q !== '') {
            $where[] = '(title LIKE ? OR slug LIKE ?)';
            array_push($params, '%' . $q . '%', '%' . $q . '%');
        }
        $whereSql = implode(' AND ', $where);

        $total = (int) self::run("SELECT COUNT(*) FROM posts WHERE {$whereSql}", $params)->fetchColumn();
        $pages = max(1, (int) ceil($total / $perPage));
        $page = min($page, $pages);

        $rows = self::run(
            "SELECT * FROM posts WHERE {$whereSql}
             ORDER BY COALESCE(published_at, updated_at) DESC, id DESC LIMIT ? OFFSET ?",
            array_merge($params, [$perPage, ($page - 1) * $perPage])
        )->fetchAll();

        return [
            'posts' => array_map(static function (array $r): array {
                return [
                    'id' => (int) $r['id'],
                    'slug' => $r['slug'],
                    'title' => $r['title'],
                    'subtitle' => $r['subtitle'],
                    'cover' => $r['cover'],
                    'status' => $r['status'],
                    'featured' => (bool) $r['featured'],
                    'publishedAt' => $r['published_at'],
                    'views' => (int) $r['views'],
                    'updatedAt' => $r['updated_at'],
                    'tags' => self::postTagNames((int) $r['id']),
                ];
            }, $rows),
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'pages' => $pages,
        ];
    }

    public static function adminPost(int $id): array
    {
        $row = self::run('SELECT * FROM posts WHERE id = ?', [$id])->fetch();
        if (!$row) {
            Http::error(404, '文章不存在');
        }
        return [
            'id' => (int) $row['id'],
            'slug' => $row['slug'],
            'title' => $row['title'],
            'subtitle' => $row['subtitle'],
            'excerpt' => $row['excerpt'],
            'contentMd' => $row['content_md'],
            'cover' => $row['cover'],
            'status' => $row['status'],
            'featured' => (bool) $row['featured'],
            'publishedAt' => $row['published_at'],
            'seoTitle' => $row['seo_title'],
            'seoDesc' => $row['seo_desc'],
            'views' => (int) $row['views'],
            'tags' => self::postTagNames((int) $row['id']),
        ];
    }

    public static function savePost(array $d, ?int $id): int
    {
        $title = trim((string) ($d['title'] ?? ''));
        $slug = trim((string) ($d['slug'] ?? ''));
        $content = (string) ($d['contentMd'] ?? '');
        if ($title === '') {
            Http::error(422, '标题不能为空');
        }
        if ($slug === '') {
            Http::error(422, 'slug 不能为空');
        }
        if (!preg_match('/^[a-z0-9][a-z0-9\-]*$/', $slug)) {
            Http::error(422, 'slug 只能包含小写字母、数字和中划线');
        }

        $status = ($d['status'] ?? 'draft') === 'published' ? 'published' : 'draft';
        $featured = !empty($d['featured']) ? 1 : 0;
        $publishedAt = trim((string) ($d['publishedAt'] ?? ''));
        if ($status === 'published' && $publishedAt === '') {
            $publishedAt = date('Y-m-d H:i:s');
        }
        if ($status === 'draft') {
            $publishedAt = $publishedAt === '' ? null : $publishedAt;
        }

        $excerpt = trim((string) ($d['excerpt'] ?? ''));
        if ($excerpt === '' && $content !== '') {
            $excerpt = Markdown::render($content)['excerpt'];
        }

        $fields = [
            'slug' => $slug,
            'title' => $title,
            'subtitle' => self::nullIfEmpty($d['subtitle'] ?? null),
            'excerpt' => $excerpt === '' ? null : $excerpt,
            'content_md' => $content,
            'cover' => self::nullIfEmpty($d['cover'] ?? null),
            'status' => $status,
            'featured' => $featured,
            'published_at' => $publishedAt === '' ? null : $publishedAt,
            'seo_title' => self::nullIfEmpty($d['seoTitle'] ?? null),
            'seo_desc' => self::nullIfEmpty($d['seoDesc'] ?? null),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        $pdo = db();
        try {
            if ($id === null) {
                $fields['created_at'] = date('Y-m-d H:i:s');
                $cols = implode(', ', array_keys($fields));
                $marks = implode(', ', array_fill(0, count($fields), '?'));
                $pdo->prepare("INSERT INTO posts ({$cols}) VALUES ({$marks})")
                    ->execute(array_values($fields));
                $id = (int) $pdo->lastInsertId();
            } else {
                $set = implode(' = ?, ', array_keys($fields)) . ' = ?';
                $pdo->prepare("UPDATE posts SET {$set} WHERE id = ?")
                    ->execute(array_merge(array_values($fields), [$id]));
            }
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'UNIQUE') !== false) {
                Http::error(409, 'slug 已被占用');
            }
            throw $e;
        }

        if (isset($d['tags']) && is_array($d['tags'])) {
            self::syncPostTags($id, $d['tags']);
        }

        return $id;
    }

    public static function deletePost(int $id): void
    {
        db()->prepare('DELETE FROM posts WHERE id = ?')->execute([$id]);
    }

    /* ================================================================
     * 后台 · 作品 / 图墙 / Now / 工具箱
     * ============================================================== */

    public static function adminWorks(): array
    {
        $rows = self::run('SELECT * FROM works ORDER BY sort ASC, id ASC')->fetchAll();
        return [
            'works' => array_map(static function (array $r): array {
                $w = self::mapWork($r);
                $w['descriptionMd'] = $r['description_md'];
                $w['status'] = $r['status'];
                return $w;
            }, $rows),
        ];
    }

    public static function saveWork(array $d, ?int $id): int
    {
        $title = trim((string) ($d['title'] ?? ''));
        $slug = trim((string) ($d['slug'] ?? ''));
        if ($title === '' || $slug === '') {
            Http::error(422, '标题和 slug 不能为空');
        }
        if (!preg_match('/^[a-z0-9][a-z0-9\-]*$/', $slug)) {
            Http::error(422, 'slug 只能包含小写字母、数字和中划线');
        }

        $stack = $d['stack'] ?? [];
        if (is_string($stack)) {
            $stack = array_values(array_filter(array_map('trim', explode(',', $stack))));
        }
        if (!is_array($stack)) {
            $stack = [];
        }

        $fields = [
            'slug' => $slug,
            'title' => $title,
            'subtitle' => self::nullIfEmpty($d['subtitle'] ?? null),
            'cover' => self::nullIfEmpty($d['cover'] ?? null),
            'description_md' => self::nullIfEmpty($d['descriptionMd'] ?? null),
            'link' => self::nullIfEmpty($d['link'] ?? null),
            'link_label' => self::nullIfEmpty($d['linkLabel'] ?? null),
            'year' => self::nullIfEmpty($d['year'] ?? null),
            'stack' => implode(',', $stack),
            'sort' => (int) ($d['sort'] ?? 0),
            'status' => ($d['status'] ?? 'published') === 'hidden' ? 'hidden' : 'published',
        ];

        $pdo = db();
        try {
            if ($id === null) {
                $cols = implode(', ', array_keys($fields));
                $marks = implode(', ', array_fill(0, count($fields), '?'));
                $pdo->prepare("INSERT INTO works ({$cols}) VALUES ({$marks})")->execute(array_values($fields));
                return (int) $pdo->lastInsertId();
            }
            $set = implode(' = ?, ', array_keys($fields)) . ' = ?';
            $pdo->prepare("UPDATE works SET {$set} WHERE id = ?")
                ->execute(array_merge(array_values($fields), [$id]));
            return $id;
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'UNIQUE') !== false) {
                Http::error(409, 'slug 已被占用');
            }
            throw $e;
        }
    }

    public static function deleteWork(int $id): void
    {
        db()->prepare('DELETE FROM works WHERE id = ?')->execute([$id]);
    }

    public static function adminGallery(): array
    {
        $rows = self::run('SELECT * FROM gallery ORDER BY sort ASC, id ASC')->fetchAll();
        return [
            'items' => array_map(static function (array $r): array {
                return [
                    'id' => (int) $r['id'],
                    'src' => $r['src'],
                    'caption' => $r['caption'],
                    'location' => $r['location'],
                    'takenAt' => $r['taken_at'],
                    'sort' => (int) $r['sort'],
                ];
            }, $rows),
        ];
    }

    public static function saveGalleryItem(array $d, ?int $id): int
    {
        $src = trim((string) ($d['src'] ?? ''));
        if ($src === '') {
            Http::error(422, '图片地址不能为空');
        }
        $fields = [
            'src' => $src,
            'caption' => self::nullIfEmpty($d['caption'] ?? null),
            'location' => self::nullIfEmpty($d['location'] ?? null),
            'taken_at' => self::nullIfEmpty($d['takenAt'] ?? null),
            'sort' => (int) ($d['sort'] ?? 0),
        ];
        return self::saveSimple('gallery', $fields, $id);
    }

    public static function deleteGalleryItem(int $id): void
    {
        db()->prepare('DELETE FROM gallery WHERE id = ?')->execute([$id]);
    }

    public static function adminNow(): array
    {
        $rows = self::run('SELECT * FROM now_items ORDER BY sort ASC, id ASC')->fetchAll();
        return [
            'items' => array_map(static function (array $r): array {
                return [
                    'id' => (int) $r['id'],
                    'label' => $r['label'],
                    'value' => $r['value'],
                    'note' => $r['note'],
                    'sort' => (int) $r['sort'],
                ];
            }, $rows),
        ];
    }

    public static function saveNow(array $d, ?int $id): int
    {
        $label = trim((string) ($d['label'] ?? ''));
        $value = trim((string) ($d['value'] ?? ''));
        if ($label === '' || $value === '') {
            Http::error(422, '标签和内容不能为空');
        }
        $fields = [
            'label' => $label,
            'value' => $value,
            'note' => self::nullIfEmpty($d['note'] ?? null),
            'sort' => (int) ($d['sort'] ?? 0),
        ];
        return self::saveSimple('now_items', $fields, $id);
    }

    public static function deleteNow(int $id): void
    {
        db()->prepare('DELETE FROM now_items WHERE id = ?')->execute([$id]);
    }

    public static function adminTools(): array
    {
        $rows = self::run('SELECT * FROM tools ORDER BY sort ASC, id ASC')->fetchAll();
        return [
            'items' => array_map(static function (array $r): array {
                return [
                    'id' => (int) $r['id'],
                    'name' => $r['name'],
                    'category' => $r['category'],
                    'note' => $r['note'],
                    'url' => $r['url'],
                    'sort' => (int) $r['sort'],
                ];
            }, $rows),
        ];
    }

    public static function saveTool(array $d, ?int $id): int
    {
        $name = trim((string) ($d['name'] ?? ''));
        if ($name === '') {
            Http::error(422, '名称不能为空');
        }
        $fields = [
            'name' => $name,
            'category' => self::nullIfEmpty($d['category'] ?? null),
            'note' => self::nullIfEmpty($d['note'] ?? null),
            'url' => self::nullIfEmpty($d['url'] ?? null),
            'sort' => (int) ($d['sort'] ?? 0),
        ];
        return self::saveSimple('tools', $fields, $id);
    }

    public static function deleteTool(int $id): void
    {
        db()->prepare('DELETE FROM tools WHERE id = ?')->execute([$id]);
    }

    /* ================================================================
     * 后台 · 设置 / 订阅者 / 媒体 / 统计
     * ============================================================== */

    private const SETTING_KEYS = [
        'name', 'role', 'status', 'intro', 'bio', 'avatar', 'since',
        'location', 'email', 'socials', 'footerNote', 'newsletterNote',
    ];

    public static function settings(): array
    {
        $rows = self::run('SELECT key, value FROM settings')->fetchAll();
        $out = [];
        foreach ($rows as $r) {
            $out[$r['key']] = $r['value'];
        }
        return $out;
    }

    public static function saveSettings(array $kv): void
    {
        $stmt = db()->prepare(
            'INSERT INTO settings (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value'
        );
        foreach (self::SETTING_KEYS as $key) {
            if (array_key_exists($key, $kv)) {
                $value = $kv[$key];
                if (is_array($value)) {
                    $value = json_encode($value, JSON_UNESCAPED_UNICODE);
                }
                $stmt->execute([$key, (string) $value]);
            }
        }
    }

    public static function subscribers(): array
    {
        $rows = self::run('SELECT * FROM subscribers ORDER BY id DESC LIMIT 500')->fetchAll();
        return [
            'items' => array_map(static function (array $r): array {
                return [
                    'id' => (int) $r['id'],
                    'email' => $r['email'],
                    'ip' => $r['ip'],
                    'createdAt' => $r['created_at'],
                ];
            }, $rows),
        ];
    }

    public static function deleteSubscriber(int $id): void
    {
        db()->prepare('DELETE FROM subscribers WHERE id = ?')->execute([$id]);
    }

    public static function mediaList(): array
    {
        $rows = self::run('SELECT * FROM media ORDER BY id DESC LIMIT 500')->fetchAll();
        return [
            'items' => array_map(static function (array $r): array {
                return [
                    'id' => (int) $r['id'],
                    'path' => $r['path'],
                    'filename' => $r['filename'],
                    'width' => $r['width'] === null ? null : (int) $r['width'],
                    'height' => $r['height'] === null ? null : (int) $r['height'],
                    'size' => $r['size'] === null ? null : (int) $r['size'],
                    'mime' => $r['mime'],
                    'createdAt' => $r['created_at'],
                ];
            }, $rows),
        ];
    }

    public static function addMedia(array $row): int
    {
        db()->prepare(
            'INSERT INTO media (path, filename, width, height, size, mime, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $row['path'], $row['filename'], $row['width'], $row['height'],
            $row['size'], $row['mime'], date('Y-m-d H:i:s'),
        ]);
        return (int) db()->lastInsertId();
    }

    public static function deleteMedia(int $id): void
    {
        $row = self::run('SELECT * FROM media WHERE id = ?', [$id])->fetch();
        if (!$row) {
            return;
        }
        $path = (string) $row['path'];
        if (str_starts_with($path, '/uploads/')) {
            $full = realpath(PUBLIC_DIR . $path);
            $uploads = realpath(UPLOAD_DIR);
            if ($full !== false && $uploads !== false && str_starts_with($full, $uploads)) {
                @unlink($full);
                $thumb = preg_replace('/\.[a-z]+$/i', '', $full) . '_480w.webp';
                if (is_file($thumb)) {
                    @unlink($thumb);
                }
            }
        }
        db()->prepare('DELETE FROM media WHERE id = ?')->execute([$id]);
    }

    public static function stats(): array
    {
        return [
            'posts' => self::countWhere('posts', "status = 'published'"),
            'drafts' => self::countWhere('posts', "status = 'draft'"),
            'works' => self::countWhere('works'),
            'gallery' => self::countWhere('gallery'),
            'subscribers' => self::countWhere('subscribers'),
            'words' => self::totalWords(),
        ];
    }

    /* ================================================================
     * 内部工具
     * ============================================================== */

    private static function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    private static function countWhere(string $table, string $where = '1=1'): int
    {
        return (int) db()->query("SELECT COUNT(*) FROM {$table} WHERE {$where}")->fetchColumn();
    }

    private static function totalWords(): int
    {
        $rows = db()->query("SELECT content_md FROM posts WHERE status = 'published'")->fetchAll();
        $total = 0;
        foreach ($rows as $r) {
            $text = (string) $r['content_md'];
            preg_match_all('/[\x{4e00}-\x{9fff}]/u', $text, $cjk);
            $latin = str_word_count(preg_replace('/[\x{4e00}-\x{9fff}]/u', ' ', $text) ?? '');
            $total += count($cjk[0]) + $latin;
        }
        return $total;
    }

    private static function postTagNames(int $postId): array
    {
        $rows = self::run(
            'SELECT t.slug, t.name FROM tags t JOIN post_tags pt ON pt.tag_id = t.id
             WHERE pt.post_id = ? ORDER BY t.name ASC',
            [$postId]
        )->fetchAll();
        return array_map(static function (array $r): array {
            return ['slug' => $r['slug'], 'name' => $r['name']];
        }, $rows);
    }

    private static function syncPostTags(int $postId, array $tags): void
    {
        $pdo = db();
        $pdo->prepare('DELETE FROM post_tags WHERE post_id = ?')->execute([$postId]);
        $find = $pdo->prepare('SELECT id FROM tags WHERE slug = ?');
        $insert = $pdo->prepare('INSERT INTO tags (slug, name) VALUES (?, ?)');
        $link = $pdo->prepare('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)');

        foreach ($tags as $tag) {
            if (is_array($tag)) {
                $name = trim((string) ($tag['name'] ?? ''));
                $slug = trim((string) ($tag['slug'] ?? ''));
            } else {
                $name = trim((string) $tag);
                $slug = '';
            }
            if ($name === '') {
                continue;
            }
            if ($slug === '') {
                $slug = Markdown::slugify($name);
            }
            $find->execute([$slug]);
            $tagId = $find->fetchColumn();
            if ($tagId === false) {
                $insert->execute([$slug, $name]);
                $tagId = $pdo->lastInsertId();
            }
            $link->execute([$postId, (int) $tagId]);
        }
    }

    private static function mapPostSummary(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'slug' => $row['slug'],
            'title' => $row['title'],
            'subtitle' => $row['subtitle'],
            'excerpt' => $row['excerpt'],
            'cover' => $row['cover'],
            'featured' => (bool) $row['featured'],
            'publishedAt' => $row['published_at'],
            'readingTime' => Markdown::render((string) $row['content_md'])['readingTime'],
            'tags' => self::postTagNames((int) $row['id']),
        ];
    }

    private static function mapWork(array $row): array
    {
        $descHtml = null;
        if (!empty($row['description_md'])) {
            $descHtml = Markdown::html((string) $row['description_md']);
        }
        $stack = [];
        if (!empty($row['stack'])) {
            $stack = array_values(array_filter(array_map('trim', explode(',', (string) $row['stack']))));
        }
        return [
            'id' => (int) $row['id'],
            'slug' => $row['slug'],
            'title' => $row['title'],
            'subtitle' => $row['subtitle'],
            'cover' => $row['cover'],
            'descriptionHtml' => $descHtml,
            'link' => $row['link'],
            'linkLabel' => $row['link_label'],
            'year' => $row['year'],
            'stack' => $stack,
            'sort' => (int) $row['sort'],
        ];
    }

    private static function nowItems(): array
    {
        $rows = self::run('SELECT * FROM now_items ORDER BY sort ASC, id ASC')->fetchAll();
        return array_map(static function (array $r): array {
            return [
                'id' => (int) $r['id'],
                'label' => $r['label'],
                'value' => $r['value'],
                'note' => $r['note'],
            ];
        }, $rows);
    }

    private static function toolItems(): array
    {
        $rows = self::run('SELECT * FROM tools ORDER BY sort ASC, id ASC')->fetchAll();
        return array_map(static function (array $r): array {
            return [
                'id' => (int) $r['id'],
                'name' => $r['name'],
                'category' => $r['category'],
                'note' => $r['note'],
                'url' => $r['url'],
            ];
        }, $rows);
    }

    private static function saveSimple(string $table, array $fields, ?int $id): int
    {
        $pdo = db();
        if ($id === null) {
            $cols = implode(', ', array_keys($fields));
            $marks = implode(', ', array_fill(0, count($fields), '?'));
            $pdo->prepare("INSERT INTO {$table} ({$cols}) VALUES ({$marks})")->execute(array_values($fields));
            return (int) $pdo->lastInsertId();
        }
        $set = implode(' = ?, ', array_keys($fields)) . ' = ?';
        $pdo->prepare("UPDATE {$table} SET {$set} WHERE id = ?")
            ->execute(array_merge(array_values($fields), [$id]));
        return $id;
    }

    /** @param mixed $value */
    private static function nullIfEmpty($value): ?string
    {
        if ($value === null) {
            return null;
        }
        $v = trim((string) $value);
        return $v === '' ? null : $v;
    }
}
