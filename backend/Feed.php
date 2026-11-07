<?php

declare(strict_types=1);

/*
 |--------------------------------------------------------------------------
 | Feed：sitemap.xml / rss.xml / robots.txt
 |--------------------------------------------------------------------------
 */

final class Feed
{
    public static function sitemap(): void
    {
        $urls = [
            ['loc' => APP_URL . '/', 'priority' => '1.0', 'changefreq' => 'weekly'],
            ['loc' => APP_URL . '/archive', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['loc' => APP_URL . '/works', 'priority' => '0.7', 'changefreq' => 'monthly'],
            ['loc' => APP_URL . '/tags', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['loc' => APP_URL . '/about', 'priority' => '0.5', 'changefreq' => 'monthly'],
        ];

        $posts = db()->query(
            "SELECT slug, published_at, updated_at FROM posts WHERE status = 'published' ORDER BY published_at DESC"
        )->fetchAll();
        foreach ($posts as $p) {
            $urls[] = [
                'loc' => APP_URL . '/writing/' . $p['slug'],
                'lastmod' => substr((string) ($p['updated_at'] ?: $p['published_at']), 0, 10),
                'priority' => '0.8',
                'changefreq' => 'monthly',
            ];
        }

        $works = db()->query("SELECT slug FROM works WHERE status = 'published'")->fetchAll();
        foreach ($works as $w) {
            $urls[] = [
                'loc' => APP_URL . '/work/' . $w['slug'],
                'priority' => '0.6',
                'changefreq' => 'monthly',
            ];
        }

        $tags = db()->query('SELECT slug FROM tags')->fetchAll();
        foreach ($tags as $t) {
            $urls[] = [
                'loc' => APP_URL . '/tag/' . $t['slug'],
                'priority' => '0.4',
                'changefreq' => 'monthly',
            ];
        }

        header('Content-Type: application/xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as $u) {
            echo "  <url>\n";
            echo '    <loc>' . e($u['loc']) . "</loc>\n";
            if (!empty($u['lastmod'])) {
                echo '    <lastmod>' . e($u['lastmod']) . "</lastmod>\n";
            }
            echo '    <changefreq>' . $u['changefreq'] . "</changefreq>\n";
            echo '    <priority>' . $u['priority'] . "</priority>\n";
            echo "  </url>\n";
        }
        echo '</urlset>';
    }

    public static function rss(): void
    {
        $site = Content::site();
        $meta = $site['meta'];

        $posts = db()->query(
            "SELECT slug, title, subtitle, excerpt, published_at FROM posts
             WHERE status = 'published' ORDER BY published_at DESC LIMIT 20"
        )->fetchAll();

        header('Content-Type: application/rss+xml; charset=utf-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><?= e($meta['name']) ?></title>
    <link><?= e(APP_URL) ?></link>
    <description><?= e($meta['intro']) ?></description>
    <language>zh-CN</language>
    <atom:link href="<?= e(APP_URL . '/rss.xml') ?>" rel="self" type="application/rss+xml" />
<?php foreach ($posts as $p): ?>
    <item>
      <title><?= e($p['title']) ?></title>
      <link><?= e(APP_URL . '/writing/' . $p['slug']) ?></link>
      <guid isPermaLink="true"><?= e(APP_URL . '/writing/' . $p['slug']) ?></guid>
      <description><?= e((string) ($p['excerpt'] ?: $p['subtitle'])) ?></description>
      <pubDate><?= e(date(DATE_RFC2822, strtotime((string) $p['published_at']))) ?></pubDate>
    </item>
<?php endforeach; ?>
  </channel>
</rss>
<?php
    }

    public static function robots(): void
    {
        header('Content-Type: text/plain; charset=utf-8');
        echo "User-agent: *\n";
        echo "Allow: /\n";
        echo "Disallow: /admin\n";
        echo "Disallow: /api\n";
        echo "\nSitemap: " . APP_URL . "/sitemap.xml\n";
    }
}
