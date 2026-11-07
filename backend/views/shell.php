<?php
/**
 * HTML 外壳：注入 SEO meta 与 Vite 资产
 * 变量来自 index.php：$seo(array), $entry('site'|'admin'), $assets(array)
 */
?><!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= e($seo['title']) ?></title>
  <meta name="description" content="<?= e($seo['description']) ?>" />
  <link rel="canonical" href="<?= e($seo['canonical']) ?>" />
<?php if ($seo['noindex']): ?>
  <meta name="robots" content="noindex, nofollow" />
<?php endif; ?>
  <meta name="theme-color" content="#FBFBF8" />
  <meta property="og:site_name" content="<?= e(APP_NAME) ?>" />
  <meta property="og:title" content="<?= e($seo['title']) ?>" />
  <meta property="og:description" content="<?= e($seo['description']) ?>" />
  <meta property="og:type" content="<?= e($seo['type']) ?>" />
  <meta property="og:url" content="<?= e($seo['canonical']) ?>" />
<?php if ($seo['image'] !== ''): ?>
  <meta property="og:image" content="<?= e($seo['image']) ?>" />
  <meta name="twitter:card" content="summary_large_image" />
<?php else: ?>
  <meta name="twitter:card" content="summary" />
<?php endif; ?>
  <meta name="twitter:title" content="<?= e($seo['title']) ?>" />
  <meta name="twitter:description" content="<?= e($seo['description']) ?>" />
<?php foreach ($seo['jsonLd'] as $schema): ?>
  <script type="application/ld+json"><?= json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?></script>
<?php endforeach; ?>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23FBFBF8'/%3E%3Ccircle cx='16' cy='16' r='10' fill='none' stroke='%230B0B0B' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='3' fill='%232F5BFF'/%3E%3C/svg%3E" />
  <link rel="alternate" type="application/rss+xml" title="<?= e(APP_NAME) ?> RSS" href="/rss.xml" />
<?php foreach ($assets['css'] as $css): ?>
  <link rel="stylesheet" href="<?= e($css) ?>" />
<?php endforeach; ?>
</head>
<body data-entry="<?= e($entry) ?>">
  <div id="root"></div>
<?php if ($assets['js'] !== null): ?>
  <script type="module" src="<?= e($assets['js']) ?>"></script>
<?php else: ?>
  <p style="font-family:monospace;padding:40px">前端资产未构建。请先运行 <code>npm run build</code>。</p>
<?php endif; ?>
</body>
</html>
