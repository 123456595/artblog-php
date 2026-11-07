<?php

declare(strict_types=1);

/*
 |--------------------------------------------------------------------------
 | SEO：按路由生成 meta / OG / JSON-LD；读取 Vite manifest
 |--------------------------------------------------------------------------
 */

final class Seo
{
    /**
     * @return array{title:string, description:string, canonical:string,
     *               image:string, type:string, noindex:bool, jsonLd:array}
     */
    public static function forPath(string $path): array
    {
        $site = Content::site();
        $meta = $site['meta'];

        $title = $meta['name'] . ' · 探索 AI 的学生';
        $description = $meta['intro'] !== '' ? $meta['intro'] : 'CodeKpy 的个人博客';
        $image = APP_URL . '/uploads/seed/post-cover-01.jpg';
        $type = 'website';
        $jsonLd = [];

        $seg = array_values(array_filter(explode('/', $path), static fn($s) => $s !== ''));
        $first = $seg[0] ?? '';

        switch ($first) {
            case '':
                $title = $meta['name'] . ' · ' . $meta['role'];
                $jsonLd[] = [
                    '@context' => 'https://schema.org',
                    '@type' => 'WebSite',
                    'name' => $meta['name'],
                    'url' => APP_URL,
                    'description' => $description,
                ];
                $jsonLd[] = [
                    '@context' => 'https://schema.org',
                    '@type' => 'Person',
                    'name' => $meta['name'],
                    'url' => APP_URL,
                    'image' => $meta['avatar'],
                    'description' => $meta['intro'],
                    'sameAs' => array_column($meta['socials'], 'url'),
                ];
                break;

            case 'writing':
                $slug = $seg[1] ?? '';
                $row = db()->prepare(
                    "SELECT title, subtitle, excerpt, cover, published_at, updated_at, seo_title, seo_desc
                     FROM posts WHERE slug = ? AND status = 'published'"
                );
                $row->execute([$slug]);
                $post = $row->fetch();
                if ($post) {
                    $title = ($post['seo_title'] ?: $post['title']) . ' · ' . $meta['name'];
                    $description = (string) ($post['seo_desc'] ?: $post['excerpt'] ?: $description);
                    if (!empty($post['cover'])) {
                        $image = str_starts_with($post['cover'], 'http')
                            ? $post['cover']
                            : APP_URL . $post['cover'];
                    }
                    $type = 'article';
                    $jsonLd[] = [
                        '@context' => 'https://schema.org',
                        '@type' => 'BlogPosting',
                        'headline' => $post['title'],
                        'description' => $description,
                        'image' => $image,
                        'datePublished' => $post['published_at'],
                        'dateModified' => $post['updated_at'] ?? $post['published_at'],
                        'author' => ['@type' => 'Person', 'name' => $meta['name'], 'url' => APP_URL],
                        'mainEntityOfPage' => APP_URL . $path,
                    ];
                    $jsonLd[] = [
                        '@context' => 'https://schema.org',
                        '@type' => 'BreadcrumbList',
                        'itemListElement' => [
                            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => APP_URL],
                            ['@type' => 'ListItem', 'position' => 2, 'name' => 'Writing', 'item' => APP_URL . '/archive'],
                            ['@type' => 'ListItem', 'position' => 3, 'name' => $post['title'], 'item' => APP_URL . $path],
                        ],
                    ];
                } else {
                    $title = '文章未找到 · ' . $meta['name'];
                }
                break;

            case 'work':
                $slug = $seg[1] ?? '';
                $stmt = db()->prepare(
                    "SELECT title, subtitle, cover FROM works WHERE slug = ? AND status = 'published'"
                );
                $stmt->execute([$slug]);
                $work = $stmt->fetch();
                if ($work) {
                    $title = $work['title'] . ' · Works · ' . $meta['name'];
                    $description = (string) ($work['subtitle'] ?: $description);
                    if (!empty($work['cover'])) {
                        $image = str_starts_with($work['cover'], 'http')
                            ? $work['cover']
                            : APP_URL . $work['cover'];
                    }
                    $jsonLd[] = [
                        '@context' => 'https://schema.org',
                        '@type' => 'CreativeWork',
                        'name' => $work['title'],
                        'description' => $description,
                        'url' => APP_URL . $path,
                        'creator' => ['@type' => 'Person', 'name' => $meta['name']],
                    ];
                }
                break;

            case 'works':
                $title = '作品 · ' . $meta['name'];
                $description = 'CodeKpy 的项目与作品索引。';
                break;

            case 'archive':
                $title = '归档 · ' . $meta['name'];
                $description = '全部文章的时间轴归档。';
                break;

            case 'tags':
                $title = '标签 · ' . $meta['name'];
                $description = '按标签浏览全部文章。';
                break;

            case 'tag':
                $slug = $seg[1] ?? '';
                $stmt = db()->prepare('SELECT name FROM tags WHERE slug = ?');
                $stmt->execute([$slug]);
                $tagName = $stmt->fetchColumn();
                $title = ($tagName ? '#' . $tagName : '标签') . ' · ' . $meta['name'];
                $description = $tagName ? '标签「' . $tagName . '」下的全部文章。' : $description;
                break;

            case 'about':
                $title = '关于 · ' . $meta['name'];
                $description = $meta['intro'] !== '' ? $meta['intro'] : $description;
                break;
        }

        return [
            'title' => $title,
            'description' => mb_substr($description, 0, 160),
            'canonical' => APP_URL . ($path === '/' ? '/' : $path),
            'image' => $image,
            'type' => $type,
            'noindex' => false,
            'jsonLd' => $jsonLd,
        ];
    }

    /** 后台外壳 meta（禁止索引） */
    public static function adminMeta(): array
    {
        return [
            'title' => '后台 · ' . APP_NAME,
            'description' => 'ArtBlog 管理后台',
            'canonical' => APP_URL . '/admin',
            'image' => '',
            'type' => 'website',
            'noindex' => true,
            'jsonLd' => [],
        ];
    }

    /**
     * 从 Vite manifest 读取入口资产
     * @return array{js:?string, css:array<int,string>}
     */
    public static function assets(string $entry): array
    {
        $manifestPath = PUBLIC_DIR . '/assets/manifest.json';
        if (!is_file($manifestPath)) {
            return ['js' => null, 'css' => []];
        }
        $manifest = json_decode((string) file_get_contents($manifestPath), true);
        if (!is_array($manifest)) {
            return ['js' => null, 'css' => []];
        }
        $key = 'src/' . $entry . '/main.tsx';
        if (!isset($manifest[$key]['file'])) {
            return ['js' => null, 'css' => []];
        }

        // Vite 会把公共样式（tokens/base/article）抽到共享 chunk，
        // 必须沿 imports 递归收集，否则入口 CSS 里的 var() 全部失效。
        $css = [];
        $seen = [];
        $walk = static function (string $k) use (&$walk, &$seen, &$css, $manifest): void {
            if (isset($seen[$k])) {
                return;
            }
            $seen[$k] = true;
            $item = $manifest[$k] ?? null;
            if (!is_array($item)) {
                return;
            }
            foreach ((array) ($item['imports'] ?? []) as $dep) {
                $walk((string) $dep);
            }
            foreach ((array) ($item['css'] ?? []) as $file) {
                $css[] = '/assets/' . $file;
            }
        };
        $walk($key);

        return [
            'js' => '/assets/' . $manifest[$key]['file'],
            'css' => array_values(array_unique($css)),
        ];
    }
}
