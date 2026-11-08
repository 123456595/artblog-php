import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GalleryItem, PostListResponse, PostSummary, Work } from '../../shared/types';
import { useApi } from '../lib/hooks';
import { useSite } from '../siteData';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import ScrollRail from '../components/ScrollRail';
import ScrollTitle from '../components/ScrollTitle';
import { Empty, Loading, SectionHead } from '../components/ui';
import {
  GalleryGrid,
  Lightbox,
  Newsletter,
  NowGrid,
  PostFeature,
  PostRows,
  ToolTable,
  WorksGrid,
} from '../components/Sections';
import { ArrowRight, ArrowUpRight, Rss } from '../components/Icons';

export default function Home({ onSearch }: { onSearch: () => void }) {
  const { site } = useSite();
  const postsRes = useApi<PostListResponse>('/posts?per_page=10');
  const worksRes = useApi<{ works: Work[] }>('/works');
  const galleryRes = useApi<{ items: GalleryItem[] }>('/gallery');

  const [filter, setFilter] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const posts = postsRes.data?.posts ?? [];
  const works = worksRes.data?.works ?? [];
  const gallery = galleryRes.data?.items ?? [];

  const feature = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== feature?.slug).slice(0, 6);
  const filterTags = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; count: number }>();
    posts.forEach((p) =>
      p.tags.forEach((t) => {
        const found = map.get(t.slug);
        if (found) found.count += 1;
        else map.set(t.slug, { slug: t.slug, name: t.name, count: 1 });
      }),
    );
    return Array.from(map.values()).slice(0, 6);
  }, [posts]);
  const rows: PostSummary[] = filter ? rest.filter((p) => p.tags.some((t) => t.slug === filter)) : rest;

  const tiles = works.map((w) => w.cover).filter((c): c is string => Boolean(c));

  return (
    <div className="page" id="main" tabIndex={-1}>
      <Header onSearch={onSearch} />
      <ScrollRail />
      <Hero tiles={tiles} />

      <div className="shell">
        <section className="sec" id="writing">
          <SectionHead
            ix="01"
            title="写作 WRITING"
            meta={
              <>
                <span>{posts.length}+ ENTRIES</span>
                <span>中 / EN</span>
              </>
            }
          />
          <ScrollTitle text="Notes in progress." cn="把没想明白的，写下来。" />

          {postsRes.error && <Empty text="文章加载失败 / FAILED TO LOAD" />}
          {!postsRes.data && !postsRes.error && <Loading />}

          {feature && <PostFeature post={feature} />}

          {filterTags.length > 0 && (
            <div className="post-filter">
              <button
                className={`filter-btn${filter === null ? ' is-active' : ''}`}
                onClick={() => setFilter(null)}
              >
                ALL <span className="n">{posts.length}</span>
              </button>
              {filterTags.map((t) => (
                <button
                  key={t.slug}
                  className={`filter-btn${filter === t.slug ? ' is-active' : ''}`}
                  onClick={() => setFilter(filter === t.slug ? null : t.slug)}
                >
                  {t.name.toUpperCase()} <span className="n">{t.count}</span>
                </button>
              ))}
            </div>
          )}

          {rows.length ? (
            <PostRows posts={rows} startIndex={2} />
          ) : (
            <div className="list-empty">
              {filter
                ? '该标签下暂无文章 / NO ENTRIES UNDER THIS TAG'
                : '暂无文章 / NO ENTRIES YET'}
            </div>
          )}

          <div className="sec-cta">
            <span className="mono" style={{ color: 'var(--muted)' }}>
              TOTAL {posts.length} ENTRIES · UPDATED SLOWLY
            </span>
            <Link className="link-arrow" to="/writing">
              查看全部文章 <ArrowRight />
            </Link>
          </div>
        </section>

        <section className="sec" id="works">
          <SectionHead
            ix="02"
            title="作品 WORKS"
            meta={
              <>
                <span>{works.length} PROJECTS</span>
                <span>PICK A PROJECT</span>
              </>
            }
          />
          <ScrollTitle text="Things I built." cn="做出来，比想出来重要。" />
          {worksRes.error && <Empty text="作品加载失败 / FAILED TO LOAD" />}
          {!worksRes.data && !worksRes.error && <Loading />}
          {works.length > 0 && <WorksGrid works={works} />}
          <div className="sec-cta">
            <span className="mono" style={{ color: 'var(--muted)' }}>
              COVER → DETAIL → LIVE LINK
            </span>
            <Link className="link-arrow" to="/works">
              全部作品 <ArrowUpRight />
            </Link>
          </div>
        </section>

        <section className="sec" id="now">
          <SectionHead
            ix="03"
            title="现在 NOW"
            meta={
              <>
                <span>UPDATED {site?.meta.since ?? '2026'}</span>
                <span>WHAT I'M DOING</span>
              </>
            }
          />
          <div className="sec-title">
            Right now<span className="accent">.</span>
            <br />
            <span className="cn">此刻在做什么。</span>
          </div>
          {!site && <Loading />}
          {site?.now.length ? <NowGrid items={site.now} /> : null}
        </section>

        <section className="sec" id="toolbox">
          <SectionHead
            ix="04"
            title="工具箱 TOOLBOX"
            meta={
              <>
                <span>{site?.tools.length ?? 0} ITEMS</span>
                <span>DAILY DRIVERS</span>
              </>
            }
          />
          <div className="sec-title">
            Daily drivers<span className="accent">.</span>
            <br />
            <span className="cn">每天都在用的东西。</span>
          </div>
          {site?.tools.length ? <ToolTable tools={site.tools} /> : null}
        </section>

        <section className="sec" id="gallery">
          <SectionHead
            ix="05"
            title="图片墙 GALLERY"
            meta={
              <>
                <span>{gallery.length} SHOTS</span>
                <span>CLICK TO ENLARGE</span>
              </>
            }
          />
          <ScrollTitle text="Fragments." cn="一些没有写进文章的碎片。" />
          {galleryRes.error && <Empty text="图片加载失败 / FAILED TO LOAD" />}
          {!galleryRes.data && !galleryRes.error && <Loading />}
          {gallery.length > 0 && <GalleryGrid items={gallery} onOpen={setLightbox} />}
        </section>

        <section className="sec" id="subscribe">
          <SectionHead
            ix="06"
            title="订阅 SUBSCRIBE"
            meta={
              <>
                <span>ONE EMAIL / MONTH</span>
                <Rss />
              </>
            }
          />
          <div style={{ paddingTop: 28 }}>
            <Newsletter note={site?.meta.newsletterNote} />
          </div>
          <div className="sec-cta">
            <span className="mono" style={{ color: 'var(--muted)' }}>
              也可以关注 GITEE / GITHUB 获取更新
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
        </section>
      </div>

      <Footer />

      {lightbox !== null && (
        <Lightbox
          items={gallery}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onMove={(next) => setLightbox((next + gallery.length) % gallery.length)}
        />
      )}
    </div>
  );
}
