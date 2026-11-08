import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ArchiveYear, PostListResponse } from '../../shared/types';
import { useApi, useDocumentMeta, monthDay } from '../lib/hooks';
import { useSite } from '../siteData';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Empty, Loading, PageHead, SectionHead } from '../components/ui';
import { PostRows, ToolTable } from '../components/Sections';
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Search } from '../components/Icons';

export function WritingPage({ onSearch }: { onSearch: () => void }) {
  const [page, setPage] = useState(1);
  const [tag, setTag] = useState<string | null>(null);
  const { site } = useSite();
  const { data, error } = useApi<PostListResponse>(
    `/posts?page=${page}&per_page=10${tag ? `&tag=${tag}` : ''}`,
  );

  useDocumentMeta(`全部文章 — ${site?.meta.name ?? 'CodeKpy'}`, '按时间倒序的全部文章归档。');

  const changeTag = (next: string | null) => {
    setTag(next);
    setPage(1);
  };

  return (
    <div className="page" id="main" tabIndex={-1}>
      <Header onSearch={onSearch} />
      <div className="shell">
        <PageHead
          eyebrow="01 / WRITING · 写作"
          title="All entries"
          cn="全部文章。"
          desc="技术笔记、实验记录和一些还没有答案的问题。中英混排，想到哪写到哪。"
          meta={
            <>
              <span>
                <b>{data?.total ?? '—'}</b> ENTRIES
              </span>
              <span>UPDATED SLOWLY</span>
              <span>中 / EN</span>
            </>
          }
        />

        {site && site.tags.length > 0 && (
          <div className="post-filter">
            <button className={`filter-btn${tag === null ? ' is-active' : ''}`} onClick={() => changeTag(null)}>
              ALL
            </button>
            {site.tags.map((t) => (
              <button
                key={t.slug}
                className={`filter-btn${tag === t.slug ? ' is-active' : ''}`}
                onClick={() => changeTag(tag === t.slug ? null : t.slug)}
              >
                {t.name.toUpperCase()} <span className="n">{t.count}</span>
              </button>
            ))}
          </div>
        )}

        {error && <Empty text={`加载失败 / ${error}`} />}
        {!data && !error && <Loading />}
        {data && data.posts.length === 0 && <div className="list-empty">暂无文章 / NO ENTRIES YET</div>}
        {data && data.posts.length > 0 && (
          <PostRows posts={data.posts} startIndex={(data.page - 1) * data.perPage + 1} />
        )}

        {data && data.pages > 1 && (
          <div className="pager">
            <button
              className="btn btn-ghost btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft /> 上一页
            </button>
            <span className="mono">
              PAGE {data.page} / {data.pages}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            >
              下一页 <ChevronRight />
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export function ArchivePage({ onSearch }: { onSearch: () => void }) {
  const [q, setQ] = useState('');
  const { site } = useSite();
  const { data, error } = useApi<{ years: ArchiveYear[] }>('/archive');
  useDocumentMeta(`归档 — ${site?.meta.name ?? 'CodeKpy'}`, '按年份整理的全部文章归档。');

  const years =
    data?.years.map((y) => ({
      ...y,
      posts: y.posts.filter((p) => p.title.toLowerCase().includes(q.trim().toLowerCase())),
    })) ?? [];

  return (
    <div className="page" id="main" tabIndex={-1}>
      <Header onSearch={onSearch} />
      <div className="shell">
        <PageHead
          eyebrow="02 / ARCHIVE · 归档"
          title="Archive"
          cn="按年份翻旧账。"
          desc="所有发布过的文字，按时间排列。适合从旧到新，也适合随机跳读。"
          meta={
            <>
              <span>
                <b>{site?.stats.posts ?? '—'}</b> POSTS
              </span>
              <span>
                <b>{site?.stats.words ?? '—'}</b> WORDS
              </span>
              <span>SINCE {site?.meta.since ?? '2026'}</span>
            </>
          }
        />

        <div className="archive-tools">
          <label className="archive-search">
            <Search />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="在归档里搜索标题…"
              aria-label="搜索归档"
            />
          </label>
          <span className="mono" style={{ color: 'var(--muted)' }}>
            {years.reduce((n, y) => n + y.posts.length, 0)} RESULTS
          </span>
        </div>

        {error && <Empty text={`加载失败 / ${error}`} />}
        {!data && !error && <Loading />}

        {years
          .filter((y) => y.posts.length > 0)
          .map((year) => (
            <section className="year-block" key={year.year}>
              <div className="year-label">
                {year.year}
                <span className="mono">{String(year.posts.length).padStart(2, '0')} ENTRIES</span>
              </div>
              <div className="archive-rows">
                {year.posts.map((post) => (
                  <div className="archive-row" key={post.slug}>
                    <span className="date">{monthDay(post.publishedAt)}</span>
                    <Link className="title" to={`/writing/${post.slug}`}>
                      {post.title}
                    </Link>
                    <span className="tags">{post.tags.map((t) => `#${t.name}`).join(' ')}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}

        {q && years.every((y) => y.posts.length === 0) && (
          <div className="list-empty">没有匹配的标题 / NO MATCH</div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export function TagsPage({ onSearch }: { onSearch: () => void }) {
  const { site } = useSite();
  useDocumentMeta(`标签 — ${site?.meta.name ?? 'CodeKpy'}`, '按标签浏览文章。');

  return (
    <div className="page" id="main" tabIndex={-1}>
      <Header onSearch={onSearch} />
      <div className="shell">
        <PageHead
          eyebrow="03 / TAGS · 标签"
          title="Index by tag"
          cn="按标签找东西。"
          desc="文章不多，标签也不多。每个标签下面都有一串可以顺藤摸瓜的东西。"
          meta={
            <>
              <span>
                <b>{site?.tags.length ?? '—'}</b> TAGS
              </span>
              <span>{site?.stats.posts ?? '—'} ENTRIES</span>
            </>
          }
        />

        {!site && <Loading />}
        {site && site.tags.length === 0 && <div className="list-empty">暂无标签 / NO TAGS</div>}
        {site && site.tags.length > 0 && (
          <div className="tag-grid" style={{ marginTop: 28 }}>
            {site.tags.map((t, i) => (
              <Link className="tag-cell" to={`/tag/${t.slug}`} key={t.slug}>
                <span className="t-name">{t.name}</span>
                <span className="t-count">
                  {String(i + 1).padStart(2, '0')} · {t.count} ENTRIES
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export function TagPage({ onSearch }: { onSearch: () => void }) {
  const { slug = '' } = useParams();
  const { site } = useSite();
  const { data, error } = useApi<PostListResponse>(`/posts?tag=${slug}&per_page=50`);
  const tag = site?.tags.find((t) => t.slug === slug);
  useDocumentMeta(`#${tag?.name ?? slug} — ${site?.meta.name ?? 'CodeKpy'}`);

  return (
    <div className="page" id="main" tabIndex={-1}>
      <Header onSearch={onSearch} />
      <div className="shell">
        <PageHead eyebrow="03 / TAG" title={`#${tag?.name ?? slug}`} cn="标签下的文章。"
          desc={`共 ${data?.total ?? '—'} 篇。`}
          meta={
            <>
              <span>{data?.total ?? '—'} ENTRIES</span>
              <Link className="link-arrow" to="/tags">
                全部标签 <ArrowLeft />
              </Link>
            </>
          }
        />
        {error && <Empty text={`加载失败 / ${error}`} />}
        {!data && !error && <Loading />}
        {data && data.posts.length === 0 && <div className="list-empty">该标签下暂无文章 / EMPTY</div>}
        {data && data.posts.length > 0 && <PostRows posts={data.posts} />}
        <div className="sec-cta">
          <Link className="link-arrow" to="/archive">
            去归档按年份浏览 <ArrowRight />
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function AboutPage({ onSearch }: { onSearch: () => void }) {
  const { site } = useSite();
  useDocumentMeta(`关于 — ${site?.meta.name ?? 'CodeKpy'}`, site?.meta.bio ?? '关于 CodeKpy。');
  const meta = site?.meta;

  return (
    <div className="page" id="main" tabIndex={-1}>
      <Header onSearch={onSearch} />
      <div className="shell">
        <PageHead
          eyebrow="04 / ABOUT · 关于"
          title="Hello, I'm CodeKpy"
          cn="你好，我是 CodeKpy。"
          desc="2027 高考生，正在用代码和模型寻找自己的表达方式。这个站点是我的公开笔记本。"
        />

        <div className="about-grid">
          <div className="portrait">
            {meta?.avatar && <img src={meta.avatar} alt={meta.name} />}
            <div className="mono">
              <span>SINCE {meta?.since ?? '2026'}</span>
              <span>{meta?.location ?? 'CN'}</span>
            </div>
            <div className="mono" style={{ marginTop: 8 }}>
              {meta?.socials.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer noopener" style={{ display: 'block', marginTop: 6 }}>
                  {s.label} ↗
                </a>
              ))}
            </div>
          </div>

          <div className="about-copy">
            <h2>
              一个探索 AI 的学生<span className="accent">。</span>
            </h2>
            <p>{meta?.bio ?? ''}</p>
            <p>
              我不太信「先想清楚再做」这件事。更多时候是先写一个很丑的版本，跑起来，然后再回头改。
              这个博客就是那些「很丑的版本」的存档：有跑通的，也有跑不通的。
            </p>
            <p className="mono" style={{ color: 'var(--muted-2)' }}>
              CURRENTLY PREPARING FOR THE 2027 GAOKAO · WRITING IN CHINESE AND ENGLISH
            </p>

            <div className="facts">
              <div className="fact">
                <span className="mono">ROLE / 身份</span>
                <span className="v">{meta?.role ?? '2027 高考 · AI 探索者'}</span>
              </div>
              <div className="fact">
                <span className="mono">STATUS / 状态</span>
                <span className="v">{meta?.status ?? '在读 / 2027 GAOKAO'}</span>
              </div>
              <div className="fact">
                <span className="mono">STACK / 常用</span>
                <span className="v">PHP 8 · TypeScript · React · SQLite</span>
              </div>
              <div className="fact">
                <span className="mono">CONTACT / 联系</span>
                <span className="v">
                  {meta?.email ? (
                    <a href={`mailto:${meta.email}`}>{meta.email}</a>
                  ) : (
                    meta?.socials[0]?.label ?? 'GITEE / GITHUB'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="sec" style={{ borderTop: 0 }}>
          <SectionHead ix="NOW" title="现在 NOW" meta={<span>UPDATED RECENTLY</span>} />
          {site?.now.length ? (
            <div className="now-grid" style={{ marginTop: 24 }}>
              {site.now.map((item, i) => (
                <div className="now-cell" key={item.id}>
                  <div className="now-label mono">
                    <span>
                      <b>{String(i + 1).padStart(2, '0')}</b> / {item.label}
                    </span>
                  </div>
                  <div className="now-value">{item.value}</div>
                  {item.note && <div className="now-note">{item.note}</div>}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="sec">
          <SectionHead
            ix="TOOL"
            title="工具箱 TOOLBOX"
            meta={<span>{site?.tools.length ?? 0} ITEMS</span>}
          />
          <div style={{ marginTop: 8 }}>
            {site?.tools.length ? <ToolTable tools={site.tools} /> : null}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
