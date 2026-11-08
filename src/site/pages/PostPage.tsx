import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PostDetail } from '../../shared/types';
import { useApi, useActiveHeading, useDocumentMeta, useReadingProgress, useToc, formatDate } from '../lib/hooks';
import { useSite } from '../siteData';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Loading, TagLink } from '../components/ui';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Copy, Share } from '../components/Icons';

export default function PostPage({ onSearch }: { onSearch: () => void }) {
  const { slug = '' } = useParams();
  const { data: post, error } = useApi<PostDetail>(`/posts/${slug}`);
  const { site } = useSite();
  const toc = useToc(post?.html ?? '');
  const active = useActiveHeading(toc);
  const progress = useReadingProgress();
  const [copied, setCopied] = useState(false);

  useDocumentMeta(
    post ? `${post.title} — ${site?.meta.name ?? 'CodeKpy'}` : '正在加载 — CodeKpy',
    post?.seoDesc ?? post?.excerpt ?? undefined,
  );

  if (error) {
    return (
      <div className="page" id="main" tabIndex={-1}>
        <Header onSearch={onSearch} />
        <div className="shell">
          <div className="page-state">
            <span className="mono">文章不存在 / 404 · {error}</span>
            <Link className="link-arrow" to="/writing">
              返回文章列表 <ArrowRight />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page" id="main" tabIndex={-1}>
        <Header onSearch={onSearch} />
        <Loading label="正在读取文章 / LOADING ENTRY" />
        <Footer />
      </div>
    );
  }

  const url = window.location.href;
  const shareText = post.title;

  const copyLink = () => {
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  return (
    <div className="page" id="main" tabIndex={-1}>
      <Header onSearch={onSearch} />
      <div className="read-progress" aria-hidden="true">
        <i style={{ ['--p' as string]: progress }} />
      </div>

      <div className="shell">
        <div className="article-wrap">
          <header className="article-head">
            <div className="article-crumb mono">
              <Link to="/writing">WRITING</Link>
              <span>/</span>
              <span>{post.tags[0]?.name ?? 'ENTRY'}</span>
              <span>/</span>
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <h1 className="article-title">{post.title}</h1>
            {post.subtitle && <p className="article-subtitle">{post.subtitle}</p>}
            <div className="article-meta mono">
              <span>BY {site?.meta.name ?? 'CodeKpy'}</span>
              <span className="sep">|</span>
              <time dateTime={post.publishedAt ?? ''}>{formatDate(post.publishedAt)}</time>
              <span className="sep">|</span>
              <span>READ {post.readingTime} MIN</span>
              {post.tags.length > 0 && <span className="sep">|</span>}
              {post.tags.slice(0, 3).map((t) => (
                <span key={t.slug}>#{t.name}</span>
              ))}
            </div>
            {post.cover && (
              <div className="article-cover">
                <img src={post.cover} alt={post.title} />
              </div>
            )}
          </header>

          <div className="article-layout">
            <aside className="toc">
              <div className="toc-label">
                <span>目录 / TOC</span>
                <span>{String(toc.length).padStart(2, '0')}</span>
              </div>
              {toc.length > 0 ? (
                <ul>
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        className={`toc-link${item.level === 3 ? ' lv3' : ''}${
                          active === item.id ? ' is-active' : ''
                        }`}
                        href={`#${item.id}`}
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="mono" style={{ color: 'var(--muted)' }}>
                  NO OUTLINE
                </span>
              )}
            </aside>

            <main className="article-main">
              <div className="md" dangerouslySetInnerHTML={{ __html: post.html }} />

              <div className="article-foot">
                <div className="article-tags">
                  {post.tags.map((t) => (
                    <TagLink tag={t} key={t.slug} />
                  ))}
                </div>

                <div className="author-card">
                  {site?.meta.avatar && <img src={site.meta.avatar} alt={site.meta.name} />}
                  <div>
                    <div className="ac-name">{site?.meta.name ?? 'CodeKpy'}</div>
                    <div className="ac-bio">{site?.meta.intro ?? '一个探索 AI 的学生。'}</div>
                  </div>
                  <Link className="btn btn-ghost" to="/about">
                    关于作者 <ArrowUpRight />
                  </Link>
                </div>

                <nav className="post-nav" aria-label="上一篇下一篇">
                  {post.prev ? (
                    <Link to={`/writing/${post.prev.slug}`} className="prev">
                      <span className="pn-label">
                        <ChevronLeft /> PREV / 上一篇
                      </span>
                      <span className="pn-title">{post.prev.title}</span>
                    </Link>
                  ) : (
                    <div className="pn-empty">NO PREVIOUS ENTRY</div>
                  )}
                  {post.next ? (
                    <Link to={`/writing/${post.next.slug}`} className="next">
                      <span className="pn-label">
                        NEXT / 下一篇 <ChevronRight />
                      </span>
                      <span className="pn-title">{post.next.title}</span>
                    </Link>
                  ) : (
                    <div className="pn-empty">NO LATER ENTRY</div>
                  )}
                </nav>
              </div>
            </main>

            <aside className="article-side">
              <span className="mono">SHARE / 分享</span>
              <div className="side-share">
                <button onClick={copyLink}>
                  {copied ? '已复制' : '复制链接'} <Copy />
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  X / TWITTER <Share />
                </a>
                <a
                  href={`https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  微博 <Share />
                </a>
              </div>
              <span className="mono" style={{ marginTop: 10 }}>
                {progress >= 1 ? 'END OF ENTRY' : `${Math.round(progress * 100)}% READ`}
              </span>
            </aside>
          </div>

          {post.related.length > 0 && (
            <section className="related">
              <div className="sec-head">
                <span className="sec-ix">
                  <b>REL</b>
                  <span>/</span>
                  相关文章 RELATED
                </span>
                <span className="sec-meta">{post.related.length} ENTRIES</span>
              </div>
              <div className="related-grid">
                {post.related.map((r, i) => (
                  <Link className="related-card" to={`/writing/${r.slug}`} key={r.slug}>
                    <span className="rc-ix">REL.{String(i + 1).padStart(2, '0')}</span>
                    <span className="rc-title">{r.title}</span>
                    <span className="rc-meta">
                      {formatDate(r.publishedAt)} · {r.readingTime} MIN
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
