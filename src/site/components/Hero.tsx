import { useSite } from '../siteData';
import { ArrowRight, ArrowUpRight, ArrowUp, Mail, Rss } from './Icons';

const RINGS = [
  { rx: 486, ry: 430, rot: -8 },
  { rx: 420, ry: 372, rot: 12 },
  { rx: 356, ry: 314, rot: -18 },
  { rx: 292, ry: 256, rot: 24 },
  { rx: 232, ry: 204, rot: -28 },
  { rx: 176, ry: 154, rot: 34 },
];

export default function Hero({ tiles }: { tiles: string[] }) {
  const { site } = useSite();
  const meta = site?.meta;
  const name = (meta?.name ?? 'CodeKpy').toUpperCase();
  const socials = meta?.socials ?? [];

  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden="true" />

      <div className="orbits" aria-hidden="true">
        <svg viewBox="0 0 1000 1000">
          <g fill="none" stroke="#0B0B0B" strokeOpacity="0.16" strokeWidth="1">
            {RINGS.map((r) => (
              <ellipse
                key={r.rx}
                cx="500"
                cy="500"
                rx={r.rx}
                ry={r.ry}
                transform={`rotate(${r.rot} 500 500)`}
              />
            ))}
            <circle cx="500" cy="500" r="7" fill="#2F5BFF" stroke="none" />
            <circle cx="500" cy="500" r="19" strokeOpacity="0.25" />
          </g>
          <g stroke="#0B0B0B" strokeOpacity="0.14" strokeWidth="1">
            {Array.from({ length: 48 }).map((_, i) => {
              const a = (i / 48) * Math.PI * 2;
              const x1 = 500 + Math.cos(a) * 430;
              const y1 = 500 + Math.sin(a) * 382;
              const x2 = 500 + Math.cos(a) * 438;
              const y2 = 500 + Math.sin(a) * 390;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </g>
        </svg>
      </div>

      <div className="hero-tiles" aria-hidden="true">
        {tiles.slice(0, 8).map((src, i) => (
          <div className="hero-tile" data-pos={String(i + 1)} key={`${src}-${i}`}>
            <img src={src} alt="" loading={i < 4 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>

      <div className="hero-inner shell">
        <div className="hero-top">
          {meta?.avatar && <img className="avatar" src={meta.avatar} alt="CodeKpy 头像" />}
          <span className="mono">
            <b>{meta?.name ?? 'CodeKpy'}</b> — SINCE {meta?.since ?? '2026'} · {meta?.location ?? 'CN'}
          </span>
        </div>

        <span className="hero-eyebrow eyebrow">PERSONAL BLOG / 个人博客 · ISSUE 001</span>

        <h1 className="hero-title">
          {name}
          <span className="dot-blue">.</span>
          <span className="hero-title-cn">{meta?.intro ?? '一个探索 AI 的学生。'}</span>
        </h1>

        <p className="hero-sub">
          {meta?.bio ?? '把写代码、训练小模型和还没想明白的问题放在这里。'}
          <span className="en">CODE · MODELS · NOTES — UPDATED SLOWLY</span>
        </p>

        <div className="hero-actions">
          <a className="btn btn-primary" href="#writing">
            阅读文章 <ArrowRight />
          </a>
          <a className="btn btn-ghost" href="#works">
            查看作品 <ArrowUpRight />
          </a>
        </div>

        <div className="hero-socials">
          {socials.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer noopener">
              {s.label} <ArrowUpRight />
            </a>
          ))}
          {meta?.email && (
            <a href={`mailto:${meta.email}`}>
              EMAIL <Mail />
            </a>
          )}
          <a href="/rss.xml">
            RSS <Rss />
          </a>
        </div>
      </div>

      <div className="hero-foot shell">
        <span>○ 开放合作 · {meta?.status ?? 'AVAILABLE FOR COLLABORATION'}</span>
        <span className="center">PERSONAL ARCHIVE — NO. 001</span>
        <span className="right">
          SCROLL TO EXPLORE <ArrowUp />
        </span>
      </div>
    </section>
  );
}
