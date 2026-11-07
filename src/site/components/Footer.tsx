import { Link } from 'react-router-dom';
import { useSite } from '../siteData';
import { ArrowUpRight, ArrowUp, Rss } from './Icons';

export default function Footer() {
  const { site } = useSite();
  const meta = site?.meta;

  return (
    <footer className="ftr">
      <div className="shell">
        <div className="ftr-top">
          <div className="ftr-brand">
            <Link to="/" className="brand">
              <span className="brand-name">
                CODE<em>K</em>PY
              </span>
            </Link>
            <p>
              {meta?.intro ?? '一个探索 AI 的学生。'}
              <br />
              Personal archive of code, models and half-formed thoughts.
            </p>
            <div className="ftr-col" style={{ marginTop: 20 }}>
              <a className="link-arrow" href="/rss.xml">
                RSS 订阅 <Rss />
              </a>
            </div>
          </div>

          <div className="ftr-col">
            <h4>导航 / INDEX</h4>
            <ul>
              <li><Link className="ftr-link" to="/writing">文章 WRITING</Link></li>
              <li><Link className="ftr-link" to="/works">作品 WORKS</Link></li>
              <li><Link className="ftr-link" to="/archive">归档 ARCHIVE</Link></li>
              <li><Link className="ftr-link" to="/tags">标签 TAGS</Link></li>
            </ul>
          </div>

          <div className="ftr-col">
            <h4>社交 / ELSEWHERE</h4>
            <ul>
              {meta?.socials.map((s) => (
                <li key={s.url}>
                  <a className="ftr-link" href={s.url} target="_blank" rel="noreferrer noopener">
                    {s.label} <ArrowUpRight />
                  </a>
                </li>
              ))}
              <li><a className="ftr-link" href="/sitemap.xml">SITEMAP</a></li>
            </ul>
          </div>

          <div className="ftr-col">
            <h4>站点 / SITE</h4>
            <ul>
              <li><Link className="ftr-link" to="/about">关于 ABOUT</Link></li>
              <li><a className="ftr-link" href="/rss.xml">RSS FEED</a></li>
              <li><span className="ftr-link">SINCE {meta?.since ?? '2026'}</span></li>
              <li><span className="ftr-link">中国 / CN</span></li>
            </ul>
          </div>
        </div>

        <div className="ftr-wordmark" aria-hidden="true">
          <span>
            CODEKPY<span className="dot-blue">.</span>
          </span>
          <a href="#top" className="up">
            回到顶部 <ArrowUp />
          </a>
        </div>

        <div className="ftr-bottom">
          <span>© {new Date().getFullYear()} CODEKPY — ALL RIGHTS RESERVED</span>
          <span className="right">
            <span>{meta?.footerNote ?? 'BUILT WITH PHP 8 · SQLITE · REACT'}</span>
            <span>NO. 001</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
