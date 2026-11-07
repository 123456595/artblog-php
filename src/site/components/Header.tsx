import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSite } from '../siteData';
import { ArrowUpRight, Close, Mark, Menu, Rss, Search } from './Icons';

const NAV = [
  { to: '/', label: '首页', end: true },
  { to: '/writing', label: '文章' },
  { to: '/works', label: '作品' },
  { to: '/archive', label: '归档' },
  { to: '/tags', label: '标签' },
  { to: '/about', label: '关于' },
];

export default function Header({ onSearch }: { onSearch: () => void }) {
  const { site } = useSite();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="hdr">
        <div className="hdr-inner shell">
          <Link to="/" className="brand" aria-label="返回首页">
            <span className="brand-mark">
              <Mark />
            </span>
            <span className="brand-name">
              CODE<em>K</em>PY
            </span>
          </Link>

          <nav className="nav" aria-label="主导航">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hdr-right">
            {site && (
              <span className="hdr-status">
                <i className="dot" />
                {site.meta.status}
              </span>
            )}
            <button className="icon-btn" onClick={onSearch} aria-label="搜索文章">
              <Search />
            </button>
            <a className="icon-btn" href="/rss.xml" aria-label="RSS 订阅">
              <Rss />
            </a>
            <Link className="btn btn-primary" to="/about">
              SAY HELLO <ArrowUpRight />
            </Link>
            <button
              className="icon-btn menu-btn"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? '关闭菜单' : '打开菜单'}
              aria-expanded={open}
            >
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="mobile-nav">
          <div className="shell">
            {NAV.map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `m-nav-link${isActive ? ' is-active' : ''}`}
              >
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                {item.label}
                <ArrowUpRight />
              </NavLink>
            ))}
            <div className="m-nav-foot mono">
              <a href="/rss.xml">RSS FEED</a>
              {site?.meta.socials.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer noopener">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
