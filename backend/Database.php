<?php

declare(strict_types=1);

/*
 |--------------------------------------------------------------------------
 | 数据库：连接、建表、种子数据
 |--------------------------------------------------------------------------
 */

final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }
        if (!is_dir(STORAGE_DIR)) {
            mkdir(STORAGE_DIR, 0775, true);
        }
        $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA journal_mode = WAL');
        self::$pdo = $pdo;

        self::migrate($pdo);
        self::seed($pdo);

        return $pdo;
    }

    private static function migrate(PDO $pdo): void
    {
        $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    excerpt TEXT,
    content_md TEXT NOT NULL DEFAULT '',
    cover TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    featured INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    seo_title TEXT,
    seo_desc TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);
CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    cover TEXT,
    description_md TEXT,
    link TEXT,
    link_label TEXT,
    year TEXT,
    stack TEXT,
    sort INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published'
);
CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    src TEXT NOT NULL,
    caption TEXT,
    location TEXT,
    taken_at TEXT,
    sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS now_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    note TEXT,
    sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    note TEXT,
    url TEXT,
    sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    ip TEXT,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    created_at TEXT NOT NULL,
    ok INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    filename TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    size INTEGER,
    mime TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, published_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts(ip, created_at);
SQL);
    }

    private static function seed(PDO $pdo): void
    {
        $count = (int) $pdo->query('SELECT COUNT(*) FROM posts')->fetchColumn();
        if ($count > 0) {
            return;
        }

        $now = date('Y-m-d H:i:s');

        /* ---------- 设置 ---------- */
        $settings = [
            'name' => 'CodeKpy',
            'role' => 'STUDENT / BUILDER',
            'status' => 'OPEN TO LEARN · 2027 高考备战中',
            'intro' => '一个探索 AI 的学生，记录代码、设计与高考的并行人生。',
            'bio' => "我是 CodeKpy，一名正在备战 2027 高考的学生。\n白天刷题，晚上写代码。对 AI、前端工程化和视觉设计有执念，相信「做好一件小事」比「做很多事」更重要。这个博客是我的数字蓝图：记录学习、实验与偶尔的长考。",
            'avatar' => 'https://q1.qlogo.cn/g?b=qq&nk=1942171924&s=100',
            'since' => '2024',
            'location' => '中国 · 远程',
            'email' => 'hi@codekpy.dev',
            'socials' => json_encode([
                ['label' => 'GITEE', 'url' => 'https://gitee.com/codekpy'],
                ['label' => 'GITHUB', 'url' => 'https://github.com/123456595'],
            ], JSON_UNESCAPED_UNICODE),
            'footerNote' => '用蓝图的方式记录成长。',
            'newsletterNote' => '每月一封 · 不发广告 · 随时退订',
        ];
        $stmt = $pdo->prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        foreach ($settings as $k => $v) {
            $stmt->execute([$k, $v]);
        }

        /* ---------- 标签 ---------- */
        $tags = [
            ['ai', 'AI'], ['frontend', '前端'], ['react', 'React'], ['php', 'PHP'],
            ['design', '设计'], ['gaokao', '高考'], ['notes', '随笔'], ['tooling', '工具链'],
        ];
        $tagIds = [];
        $stmt = $pdo->prepare('INSERT INTO tags (slug, name) VALUES (?, ?)');
        foreach ($tags as $t) {
            $stmt->execute($t);
            $tagIds[$t[0]] = (int) $pdo->lastInsertId();
        }

        /* ---------- 文章 ---------- */
        $posts = [
            [
                'slug' => 'why-blueprint',
                'title' => '为什么把博客做成一张蓝图',
                'subtitle' => '设计系统的第一性原理',
                'cover' => '/uploads/seed/post-cover-01.jpg',
                'featured' => 1,
                'published_at' => '2026-10-28 20:00:00',
                'tags' => ['design', 'notes'],
                'md' => <<<'MD'
## 起点不是风格，是约束

大多数博客主题都在做加法：渐变、阴影、卡片套卡片。我想要的是减法——**一张纸、一支笔、一把尺**。

> 蓝图的本质不是蓝色，是"每一根线都必须有理由"。

## 三个约束

1. **一像素的线**。所有分隔都用 `1px solid`，不用阴影表达层级。
2. **等宽字体的元信息**。日期、编号、统计全部大写等宽，像图纸上的标注。
3. **一个点睛色**。电光蓝只出现在编号、激活态和单个词上。

## 排版即结构

标题用 `clamp()` 在 40px 到 104px 之间流动，字距收紧到 `-0.045em`。中文标题降到 700 字重——中文笔画密度高，过粗会糊成一片。

## 结论

风格不是选择出来的，是约束推导出来的。先立规矩，再谈美。
MD,
            ],
            [
                'slug' => 'react-php-stack',
                'title' => 'React 19 + PHP 8：一个学生的全栈组合',
                'subtitle' => '为什么是这套"过时"技术栈',
                'cover' => '/uploads/seed/post-cover-02.jpg',
                'featured' => 1,
                'published_at' => '2026-10-15 21:30:00',
                'tags' => ['frontend', 'react', 'php'],
                'md' => <<<'MD'
## 先回答为什么不用 Node

虚拟主机便宜、SQLite 免运维、`php -S` 一行启动。对一个时间被高考切碎的人来说，**运维成本是第一优先级**。

## 分工

- **React SPA** 负责所有交互：路由、搜索、阅读进度、悬浮目录。
- **PHP** 只做三件事：托管静态产物、输出 JSON、注入 SEO meta。
- **SQLite** 一个文件就是一个世界，备份 = 复制。

## 构建管线

```bash
npm run build   # Vite 双入口构建到 public/assets
php -S 127.0.0.1:8080 -t public public/router.php
```

Vite 把 site 和 admin 两个入口打成带 hash 的资产，PHP 读 `manifest.json` 注入标签。没有 SSR，没有 hydration 地狱。

## SEO 怎么办

公共站每个路由在 PHP 侧生成独立的 `<title>`、`description`、OG 和 JSON-LD，外加 `sitemap.xml` 和 `rss.xml`。爬虫看到完整的 meta，用户看到 SPA 的流畅。

## 取舍的代价

代价是首屏要多等一个 JSON 请求。换来了部署自由和心智简单——这笔账我认。
MD,
            ],
            [
                'slug' => 'ai-study-workflow',
                'title' => '我用 AI 复习数学的完整流程',
                'subtitle' => '错题本 + LLM 的最小闭环',
                'cover' => '/uploads/seed/post-cover-03.jpg',
                'featured' => 0,
                'published_at' => '2026-09-30 22:00:00',
                'tags' => ['ai', 'gaokao', 'notes'],
                'md' => <<<'MD'
## 原则：AI 讲题，不讲答案

直接问答案是最差用法。我的规则是：**先自己卡 20 分钟，再让 AI 当助教**。

## 流程

1. **录入**：错题拍照，手打题干进 Markdown，标注卡点。
2. **提问模板**：「我是高三学生，这道题的考点是什么？请不要给出完整解答，只提示第一步。」
3. **追问**：每听懂一步，要求出一道同构变式题自测。
4. **归档**：一周后重做错题，对了移出，错了升级标记。

## 一个真实的提示词

```text
你是一位严格的高中数学老师。我会给你一道错题和我的解法。
请：(1) 指出我思路断裂的具体位置；(2) 用苏格拉底式提问引导我；
(3) 不要直接给答案。
```

## 数据

坚持了 90 天，数学周测从 102 到 127。最重要的不是分数，是**错题的平均复活周期从 21 天缩到了 9 天**。

## 边界

AI 会一本正经地算错。凡是涉及计算的步骤，一律手算复核。它是助教，不是神。
MD,
            ],
            [
                'slug' => 'vite-dual-entry',
                'title' => 'Vite 双入口：前台和后台分仓构建',
                'subtitle' => 'manifest 驱动的 PHP 托管',
                'cover' => null,
                'featured' => 0,
                'published_at' => '2026-09-12 20:30:00',
                'tags' => ['frontend', 'tooling'],
                'md' => <<<'MD'
## 问题

一个仓库里有两个 React 应用：公共站 site 和后台 admin。它们共享类型和样式，但绝不能打包在一起。

## 配置

```ts
rollupOptions: {
  input: {
    site: resolve(__dirname, 'src/site/main.tsx'),
    admin: resolve(__dirname, 'src/admin/main.tsx'),
  },
}
```

## PHP 侧的消费方式

构建产物里的 `manifest.json` 记录了每个入口的 js/css 文件和 hash。PHP 只需要：

1. 读 manifest
2. 按路由决定渲染 site 还是 admin 入口
3. 输出 `<script type="module">` 和 `<link rel="stylesheet">`

## 好处

- 后台代码永远不会出现在公共站首屏
- 两个应用独立缓存，改一个不影响另一个
- hash 文件名让缓存策略变得无脑：静态资产永久缓存，HTML 不缓存
MD,
            ],
            [
                'slug' => 'gaokao-2027-plan',
                'title' => '2027 高考：一个可执行的系统',
                'subtitle' => '把备考当成工程项目',
                'cover' => null,
                'featured' => 0,
                'published_at' => '2026-08-20 19:00:00',
                'tags' => ['gaokao', 'notes'],
                'md' => <<<'MD'
## 把备考当工程

工程思维的核心是：**度量、反馈、迭代**。学习也一样。

## 度量

- 每科一个错题库，记录错误类型（概念 / 计算 / 审题）
- 每周一次限时套卷，记录分数和用时分布
- 睡眠和运动纳入看板，不和成绩抢时间

## 反馈

周复盘只回答三个问题：哪类错误在减少？哪类在停滞？下周砍掉什么？

## 迭代

计划每两周滚动调整一次。计划的意义不是被执行，是被修正。

## 和代码的关系

写代码是我的「主动休息」。它让大脑切换到另一套符号系统，回来后效率反而更高。这不是逃避，是调度。
MD,
            ],
        ];

        $postStmt = $pdo->prepare(
            'INSERT INTO posts (slug, title, subtitle, excerpt, content_md, cover, status, featured, published_at, seo_title, seo_desc, views, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $linkStmt = $pdo->prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)');

        foreach ($posts as $p) {
            $reading = Markdown::render($p['md']);
            $seoDesc = mb_substr($reading['excerpt'], 0, 160);
            $postStmt->execute([
                $p['slug'], $p['title'], $p['subtitle'], $reading['excerpt'], $p['md'],
                $p['cover'], 'published', $p['featured'], $p['published_at'],
                $p['title'], $seoDesc, random_int(80, 900), $now, $now,
            ]);
            $postId = (int) $pdo->lastInsertId();
            foreach ($p['tags'] as $slug) {
                $linkStmt->execute([$postId, $tagIds[$slug]]);
            }
        }

        /* ---------- 作品 ---------- */
        $works = [
            [
                'slug' => 'artblog-php',
                'title' => 'ArtBlog',
                'subtitle' => '蓝图风个人博客系统',
                'cover' => '/uploads/seed/work-01.jpg',
                'description_md' => "## 这个项目\n\nReact 19 + PHP 8 + SQLite 的个人博客，瑞士工程蓝图视觉。\n\n- 双入口 Vite 构建\n- 纯 SPA + JSON API\n- 路由级 SEO 注入\n\n**你正在看着它。**",
                'link' => 'https://gitee.com/codekpy/artblog-php',
                'link_label' => 'GITEE REPO',
                'year' => '2026',
                'stack' => 'React,TypeScript,PHP,SQLite,Vite',
                'sort' => 1,
            ],
            [
                'slug' => 'mistake-loop',
                'title' => '错题循环',
                'subtitle' => '错题本 + LLM 复习流水线',
                'cover' => '/uploads/seed/work-02.jpg',
                'description_md' => "## 错题循环\n\n把纸质错题拍照归档成 Markdown，用结构化提示词驱动 LLM 生成变式题，按记忆曲线自动排期重做。\n\n90 天把数学周测从 102 拉到 127。",
                'link' => null,
                'link_label' => null,
                'year' => '2026',
                'stack' => 'Python,LLM,Markdown',
                'sort' => 2,
            ],
            [
                'slug' => 'blueprint-ui',
                'title' => 'Blueprint UI Kit',
                'subtitle' => '一套图纸语言 CSS 系统',
                'cover' => '/uploads/seed/work-03.jpg',
                'description_md' => "## Blueprint UI\n\n纯原生 CSS 的蓝图设计系统：1px 细线、等宽标注、同心圆轨道、刻度尺。无框架依赖，gzip 后 8KB。",
                'link' => null,
                'link_label' => null,
                'year' => '2026',
                'stack' => 'CSS,Design System',
                'sort' => 3,
            ],
            [
                'slug' => 'pomodoro-rig',
                'title' => '番茄 rig',
                'subtitle' => '硬件番茄钟 · ESP32',
                'cover' => '/uploads/seed/work-04.jpg',
                'description_md' => "## 番茄 rig\n\n用 ESP32 + 数码管做的物理番茄钟，拧编码器设定时长，结束播放蜂鸣。写代码时物理隔离手机。",
                'link' => null,
                'link_label' => null,
                'year' => '2025',
                'stack' => 'ESP32,C++',
                'sort' => 4,
            ],
            [
                'slug' => 'gaokao-dashboard',
                'title' => '备考看板',
                'subtitle' => '周测成绩可视化面板',
                'cover' => '/uploads/seed/work-05.jpg',
                'description_md' => "## 备考看板\n\n每周录入成绩，自动生成趋势图和错题复活周期统计。数据驱动地安排下一轮复习。",
                'link' => null,
                'link_label' => null,
                'year' => '2025',
                'stack' => 'React,Charts',
                'sort' => 5,
            ],
            [
                'slug' => 'cli-dict',
                'title' => 'cli-dict',
                'subtitle' => '终端英汉词典',
                'cover' => '/uploads/seed/work-06.jpg',
                'description_md' => "## cli-dict\n\n不离手边的查词工具，支持模糊匹配与生词本导出。备考英语时的日用品。",
                'link' => null,
                'link_label' => null,
                'year' => '2025',
                'stack' => 'Node.js,CLI',
                'sort' => 6,
            ],
        ];
        $workStmt = $pdo->prepare(
            'INSERT INTO works (slug, title, subtitle, cover, description_md, link, link_label, year, stack, sort, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach ($works as $w) {
            $workStmt->execute([
                $w['slug'], $w['title'], $w['subtitle'], $w['cover'], $w['description_md'],
                $w['link'], $w['link_label'], $w['year'], $w['stack'], $w['sort'], 'published',
            ]);
        }

        /* ---------- 图墙 ---------- */
        $gallery = [
            ['/uploads/seed/gallery-01.jpg', '晚自习后的天色', '教学楼', '2026.10'],
            ['/uploads/seed/gallery-02.jpg', '桌面即战场', '书房', '2026.09'],
            ['/uploads/seed/gallery-03.jpg', '跑道的刻度', '操场', '2026.09'],
            ['/uploads/seed/gallery-04.jpg', '草稿纸的几何', '书房', '2026.08'],
            ['/uploads/seed/gallery-05.jpg', '凌晨的编辑器', '书房', '2026.07'],
            ['/uploads/seed/gallery-06.jpg', '山那边的云', '周末远足', '2026.06'],
        ];
        $gStmt = $pdo->prepare('INSERT INTO gallery (src, caption, location, taken_at, sort) VALUES (?, ?, ?, ?, ?)');
        foreach ($gallery as $i => $g) {
            $gStmt->execute([$g[0], $g[1], $g[2], $g[3], $i + 1]);
        }

        /* ---------- NOW ---------- */
        $nowItems = [
            ['FOCUS', '数学 · 导数压轴', '每晚 21:00–22:30 专项突破', 1],
            ['READING', '《数学之美》', '第 12 章 · 信息论', 2],
            ['BUILDING', 'ArtBlog v1.0', '就是这个网站', 3],
            ['LEARNING', 'React Server Components', '缓慢而坚定', 4],
            ['NEXT EXAM', '高三上月考', '倒计时制表仪持续运转', 5],
        ];
        $nStmt = $pdo->prepare('INSERT INTO now_items (label, value, note, sort) VALUES (?, ?, ?, ?)');
        foreach ($nowItems as $n) {
            $nStmt->execute($n);
        }

        /* ---------- 工具箱 ---------- */
        $tools = [
            ['VS Code', 'EDITOR', '主力编辑器，装了半个插件市场', 'https://code.visualstudio.com', 1],
            ['PHP 8 + phpStudy', 'RUNTIME', '本地一把梭的运行环境', null, 2],
            ['Figma', 'DESIGN', '画蓝图的地方', 'https://figma.com', 3],
            ['Obsidian', 'NOTES', '错题库与第二大脑', 'https://obsidian.md', 4],
            ['Git + Gitee', 'VCS', '代码的保险箱', 'https://gitee.com', 5],
            ['Windows Terminal', 'TERMINAL', 'PowerShell 是我家', null, 6],
            ['夸克扫描王', 'SCAN', '错题数字化入口', null, 7],
            ['ESP32', 'HARDWARE', '折腾硬件的启蒙板', null, 8],
        ];
        $tStmt = $pdo->prepare('INSERT INTO tools (name, category, note, url, sort) VALUES (?, ?, ?, ?, ?)');
        foreach ($tools as $t) {
            $tStmt->execute($t);
        }
    }
}
