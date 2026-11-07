import { Link, useParams } from 'react-router-dom';
import type { Work } from '../../shared/types';
import { useApi, useDocumentMeta } from '../lib/hooks';
import { useSite } from '../siteData';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Empty, Loading, PageHead } from '../components/ui';
import { WorksGrid } from '../components/Sections';
import { ArrowLeft, ArrowUpRight } from '../components/Icons';

export function WorksPage({ onSearch }: { onSearch: () => void }) {
  const { site } = useSite();
  const { data, error } = useApi<{ works: Work[] }>('/works');
  useDocumentMeta(`作品 — ${site?.meta.name ?? 'CodeKpy'}`, '项目、实验和做出来的东西。');

  return (
    <div className="page">
      <Header onSearch={onSearch} />
      <div className="shell">
        <PageHead
          eyebrow="05 / WORKS · 作品"
          title="Built things"
          cn="做出来的东西。"
          desc="一些能点开、能跑起来的东西。大多数是给自己用的工具，少数是给别人看的实验。"
          meta={
            <>
              <span>
                <b>{data?.works.length ?? '—'}</b> PROJECTS
              </span>
              <span>COVER → DETAIL → LIVE LINK</span>
            </>
          }
        />
        {error && <Empty text={`加载失败 / ${error}`} />}
        {!data && !error && <Loading />}
        {data && data.works.length === 0 && <div className="list-empty">暂无作品 / NO PROJECTS</div>}
        {data && data.works.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <WorksGrid works={data.works} />
          </div>
        )}
        <div className="sec-cta" style={{ paddingTop: 32, paddingBottom: 'var(--section-gap)' }}>
          <span className="mono" style={{ color: 'var(--muted)' }}>
            更多实验在 GITEE / GITHUB
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {site?.meta.socials.map((s) => (
              <a
                key={s.url}
                className="link-arrow"
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                {s.label} <ArrowUpRight />
              </a>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function WorkPage({ onSearch }: { onSearch: () => void }) {
  const { slug = '' } = useParams();
  const { site } = useSite();
  const { data: work, error } = useApi<Work>(`/works/${slug}`);
  useDocumentMeta(
    work ? `${work.title} — ${site?.meta.name ?? 'CodeKpy'}` : '作品 — CodeKpy',
    work?.subtitle ?? undefined,
  );

  return (
    <div className="page">
      <Header onSearch={onSearch} />
      <div className="shell">
        {error && (
          <div className="page-state">
            <span className="mono">项目不存在 / 404</span>
            <Link className="link-arrow" to="/works">
              返回作品 <ArrowLeft />
            </Link>
          </div>
        )}
        {!work && !error && <Loading />}
        {work && (
          <div className="work-hero">
            <div className="article-crumb mono">
              <Link to="/works">WORKS</Link>
              <span>/</span>
              <span>{work.year ?? '2026'}</span>
              <span>/</span>
              <span>{work.slug.toUpperCase()}</span>
            </div>
            <h1 className="article-title">{work.title}</h1>
            {work.subtitle && <p className="article-subtitle">{work.subtitle}</p>}

            {work.cover && (
              <div className="cover">
                <img src={work.cover} alt={work.title} />
              </div>
            )}

            <div className="work-facts">
              <span>
                YEAR<b>{work.year ?? '2026'}</b>
              </span>
              <span>
                STACK<b>{work.stack.join(' · ') || '—'}</b>
              </span>
              <span>
                STATUS<b>BUILT / 已上线</b>
              </span>
              {work.link && (
                <a className="btn btn-primary" href={work.link} target="_blank" rel="noreferrer noopener">
                  {work.linkLabel ?? '访问项目'} <ArrowUpRight />
                </a>
              )}
            </div>

            <div className="article-layout" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
              <div className="article-main">
                {work.descriptionHtml ? (
                  <div className="md" dangerouslySetInnerHTML={{ __html: work.descriptionHtml }} />
                ) : (
                  <div className="mono" style={{ color: 'var(--muted)' }}>
                    暂无项目说明 / NO DESCRIPTION
                  </div>
                )}

                <div className="article-foot">
                  <nav className="post-nav">
                    <Link to="/works" className="prev">
                      <span className="pn-label">
                        <ArrowLeft /> BACK / 返回
                      </span>
                      <span className="pn-title">全部作品</span>
                    </Link>
                    {work.link ? (
                      <a className="next" href={work.link} target="_blank" rel="noreferrer noopener">
                        <span className="pn-label">
                          LIVE LINK / 线上地址 <ArrowUpRight />
                        </span>
                        <span className="pn-title">{work.linkLabel ?? work.link}</span>
                      </a>
                    ) : (
                      <div className="pn-empty">NO LIVE LINK</div>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export function NotFoundPage({ onSearch }: { onSearch: () => void }) {
  const { site } = useSite();
  useDocumentMeta(`404 — ${site?.meta.name ?? 'CodeKpy'}`);
  return (
    <div className="page">
      <Header onSearch={onSearch} />
      <div className="shell">
        <div className="not-found">
          <span className="eyebrow">ERROR / 404</span>
          <h1>
            404<span className="accent">.</span>
          </h1>
          <p>这个页面不存在，或者它还没被写出来。</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
            <Link className="btn btn-primary" to="/">
              回到首页 <ArrowUpRight />
            </Link>
            <Link className="btn btn-ghost" to="/archive">
              翻归档
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
