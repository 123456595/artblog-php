# ArtBlog-PHP 项目总体方案

## 1. 目标
为 CodeKpy 构建一个个人博客：中英混排、蓝图工程风视觉、可后台完整管理、SEO 友好。

- 前端：React 19 + TypeScript + Vite + 原生 CSS，构建产物交给 PHP 托管
- 后端：PHP 8.0 + SQLite（PDO）
- 公共站：纯 React SPA + JSON API；PHP 注入路由级 meta/OG/canonical/JSON-LD，输出 sitemap.xml、rss.xml、robots.txt
- 后台：`/admin` 独立 React SPA，单账号密码 + Session + CSRF，完整内容管理

## 2. 目录结构

```
ArtBlog-PHP/
├─ .env / .env.example / .gitignore
├─ package.json / tsconfig.json / vite.config.ts
├─ plan.md / tasks.md
├─ backend/
│  ├─ bootstrap.php        # env、常量、PDO、自动加载、helper
│  ├─ Database.php         # 建表、迁移、首次种子数据
│  ├─ Http.php             # JSON 响应、请求解析、错误处理
│  ├─ Auth.php             # 登录、Session、CSRF、失败限流
│  ├─ Markdown.php         # Parsedown + TOC + 阅读时长 + 摘要
│  ├─ Content.php          # 文章/作品/图墙/Now/Toolbox/设置 查询与写入
│  ├─ Upload.php           # 图片校验、落盘、缩略图
│  ├─ Seo.php              # 路由 → meta / JSON-LD
│  ├─ Api.php              # /api 路由分发
│  ├─ Feed.php             # sitemap.xml / rss.xml
│  ├─ lib/Parsedown.php    # vendored（MIT）
│  └─ views/shell.php      # HTML 外壳（含注入）
├─ public/                 # Web 根目录
│  ├─ index.php            # 入口 + 静态文件透传 + SPA 外壳
│  ├─ router.php           # php -S 路由
│  ├─ .htaccess            # Apache 重写
│  ├─ api.php              # /api 入口
│  ├─ sitemap.php / rss.php
│  ├─ assets/              # Vite 构建产物（gitignore）
│  └─ uploads/             # 上传图片（gitignore）
├─ storage/blog.sqlite
└─ src/
   ├─ site/                # 公共站 SPA
   ├─ admin/               # 后台 SPA
   ├─ shared/              # API client、类型
   └─ styles/              # tokens / base / site / article / admin
```

## 3. 设计系统（提取自参考图）

| Token | 值 | 用途 |
|---|---|---|
| `--paper` | `#FBFBF8` | 纸白底 |
| `--paper-2` | `#F1F1EC` | 区块/悬停底 |
| `--ink` | `#0B0B0B` | 正文、描边 |
| `--muted` | `#6E6E66` | 次级文字 |
| `--line` | `#D8D8D0` | 1px 细断线 |
| `--accent` | `#2F5BFF` | 电光蓝，仅用于点睛（标题单个词、编号、激活态） |

- 字体：`Inter Variable` 拉丁标题/正文 + 系统中文字体（PingFang SC / Microsoft YaHei），`JetBrains Mono` 等宽元信息。
- 标题：`clamp(40px, 7vw, 104px)`、weight 800、`letter-spacing:-0.045em`；中文标题 weight 700。
- 元信息：10–11px、全大写、`letter-spacing:.14em`、等宽。
- 版式：`max-width:1280px` 居中，左右 1px 竖向细线贯穿；区间用 `border-top` 分隔，表头左编号右统计。
- 图形语汇：同心圆轨道（缓慢旋转）、漂浮圆角缩略图（带硬阴影）、右侧刻度尺、竖排边缘标签、页脚巨型 wordmark。
- 按钮：高 40px、1px 描边、2px 圆角、11px 大写等宽；主按钮黑底白字，悬停反转。
- 动效克制：轨道 90s 旋转、漂浮 12s 上下、悬停 2px 位移 + 图片 1.03 缩放；`prefers-reduced-motion` 全关。

## 4. 页面与板块

1. `/` 首页：Hero（个人信息 + 轨道视觉）→ 01 文章 → 02 作品 → 03 NOW → 04 工具箱 → 05 图片墙 → 06 订阅 → 页脚
2. `/writing/:slug` 文章详情：面包屑、标题、元信息、左侧粘性目录、Markdown 正文、标签、上下篇、相关文章、阅读进度
3. `/archive` 归档：年份分组 + 统计 + 搜索
4. `/about` 关于：个人介绍、NOW、工具箱
5. `/tags`、`/tag/:slug`：标签索引与筛选列表
6. `/works`、`/work/:slug`：作品列表与详情（可外链跳转）
7. `/admin/*`：登录、仪表盘、文章、作品、图墙、Now、工具箱、媒体库、订阅者、设置
8. 全局：⌘K 搜索浮层、RSS、返回顶部

## 5. 数据模型（SQLite）

- `posts`：id, slug, title, subtitle, excerpt, content_md, cover, status(draft/published), featured, published_at, seo_title, seo_desc, views, created_at, updated_at
- `tags` / `post_tags`
- `works`：id, slug, title, subtitle, cover, description_md, link, link_label, year, stack, sort, status
- `gallery`：id, src, caption, location, taken_at, sort
- `now_items`：id, label, value, note, sort
- `tools`：id, name, category, note, url, sort
- `settings`：key, value
- `subscribers`：id, email, ip, created_at
- `login_attempts`：id, ip, created_at, ok
- `media`：id, path, filename, width, height, size, mime, created_at

## 6. API

公共：`GET /api/site`、`/api/posts`、`/api/posts/:slug`、`/api/works`、`/api/works/:slug`、`/api/gallery`、`/api/tags`、`/api/archive`、`POST /api/subscribe`

后台（Session + CSRF）：`POST /api/admin/login|logout`、`GET /api/admin/me|stats|media|subscribers`、文章/作品/图墙/Now/工具箱/设置 CRUD、`POST /api/admin/preview`、`POST /api/admin/upload`

## 7. 安全与 SEO

- 密码：`ADMIN_PASSWORD`（.env），`hash_equals` 常量时间比较；登录限流（IP + 10 分钟窗口）
- Session 加固：HttpOnly、SameSite=Lax、HTTPS 下 Secure、登录后 `session_regenerate_id`
- CSRF：后台非 GET 请求校验 `X-CSRF-Token`
- 上传：扩展名 + `finfo` MIME + `getimagesize` 三重校验，8MB 上限，哈希文件名，GD 生成 WebP，限制目录 realpath
- Markdown：Parsedown safe mode，输出前不做二次信任；SQL 全预处理语句
- SEO：路由级 title/description/canonical/OG/Twitter、JSON-LD（WebSite/Person/BlogPosting/BreadcrumbList）、sitemap.xml、rss.xml、robots.txt、语义化标签与 alt

## 8. 本地运行

```powershell
npm install
npm run build
& 'F:\phpstudy_pro\Extensions\php\php8.0.2nts\php.exe' -d extension=pdo_sqlite -d extension=sqlite3 -S 127.0.0.1:8080 -t public public/router.php
```

## 9. 实施阶段

1. 脚手架与依赖
2. 设计系统 CSS + 公共站 SPA（首页/文章/归档/标签/关于/作品）
3. PHP 后端（DB/API/Auth/Markdown/上传/SEO/Feed）
4. 后台 SPA
5. 种子数据与联调
6. 构建、浏览器验收、SEO 校验
