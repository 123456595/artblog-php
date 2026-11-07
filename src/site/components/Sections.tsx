import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FormEvent } from 'react';
import type { GalleryItem, NowItem, PostSummary, ToolItem, Work } from '../../shared/types';
import { api } from '../../shared/api';
import { formatDate, monthDay } from '../lib/hooks';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Clock, Mail } from './Icons';
import { TagLink } from './ui';

export function PostFeature({ post }: { post: PostSummary }) {
  return (
    <article className="post-feature">
      <div className="pf-copy">
        <span className="pf-badge">PINNED / 置顶</span>
        <h3 className="pf-title">
          <Link to={`/writing/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && <p className="pf-excerpt">{post.excerpt}</p>}
        <div className="pf-meta mono">
          <span>{formatDate(post.publishedAt)}</span>
          <span>READ {post.readingTime} MIN</span>
          {post.tags.slice(0, 2).map((t) => (
            <span key={t.slug}>#{t.name}</span>
          ))}
        </div>
        <div className="pf-actions">
          <Link className="btn btn-primary" to={`/writing/${post.slug}`}>
            阅读全文 <ArrowRight />
          </Link>
          <span className="mono" style={{ color: 'var(--muted)' }}>
            阅读时长 {post.readingTime} 分钟
          </span>
        </div>
      </div>
      {post.cover ? (
        <div className="pf-media">
          <img src={post.cover} alt={post.title} loading="lazy" />
          <span className="corner">FEATURED ENTRY</span>
        </div>
      ) : (
        <div className="pf-media pf-media-empty">
          <span className="mono">NO COVER / 暂无封面</span>
        </div>
      )}
    </article>
  );
}

export function PostRows({ posts, startIndex = 1 }: { posts: PostSummary[]; startIndex?: number }) {
  return (
    <div className="post-rows">
      {posts.map((post, i) => (
        <article className="post-row" key={post.slug}>
          <span className="post-ix">{String(startIndex + i).padStart(2, '0')}</span>
          <span className="post-date">
            {formatDate(post.publishedAt)}
            <br />
            {monthDay(post.publishedAt)}
          </span>
          <div className="post-main">
            <Link className="post-title" to={`/writing/${post.slug}`}>
              {post.title}
            </Link>
            {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
          </div>
          <div className="post-tags">
            {post.tags.slice(0, 2).map((t) => (
              <TagLink key={t.slug} tag={t} />
            ))}
            <span className="post-time">
              <Clock /> {post.readingTime} MIN
            </span>
          </div>
          <Link className="post-arrow" to={`/writing/${post.slug}`} aria-label={`阅读 ${post.title}`}>
            <ArrowRight />
          </Link>
        </article>
      ))}
    </div>
  );
}

export function WorksGrid({ works }: { works: Work[] }) {
  return (
    <div className="works-grid">
      {works.map((work, i) => (
        <Link className="work-card" to={`/work/${work.slug}`} key={work.slug}>
          <div className="work-media">
            {work.cover ? (
              <img src={work.cover} alt={work.title} loading="lazy" />
            ) : null}
            <span className="work-idx">{String(i + 1).padStart(2, '0')} / PROJECT</span>
          </div>
          <div className="work-title">
            {work.title} <ArrowUpRight />
          </div>
          <div className="work-meta">
            <span>{work.year ?? '2026'}</span>
            <span className="work-stack">
              {work.stack.slice(0, 2).map((s) => (
                <span key={s}>{s}</span>
              ))}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function NowGrid({ items }: { items: NowItem[] }) {
  return (
    <div className="now-grid">
      {items.map((item, i) => (
        <div className="now-cell" key={item.id}>
          <div className="now-label mono">
            <span>
              <b>{String(i + 1).padStart(2, '0')}</b> / {item.label}
            </span>
            <span>NOW</span>
          </div>
          <div className="now-value">{item.value}</div>
          {item.note && <div className="now-note">{item.note}</div>}
        </div>
      ))}
    </div>
  );
}

export function ToolTable({ tools }: { tools: ToolItem[] }) {
  return (
    <div className="tool-table">
      {tools.map((tool, i) => {
        const body = (
          <>
            <span className="tool-name">
              <i>{String(i + 1).padStart(2, '0')}</i>
              {tool.name}
            </span>
            <span className="tool-cat">{tool.category ?? 'TOOL'}</span>
            <span className="tool-note">{tool.note ?? ''}</span>
            <span className="tool-link">
              <ArrowUpRight />
            </span>
          </>
        );
        return tool.url ? (
          <a
            className="tool-row"
            key={tool.id}
            href={tool.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            {body}
          </a>
        ) : (
          <div className="tool-row" key={tool.id}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function GalleryGrid({
  items,
  onOpen,
}: {
  items: GalleryItem[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="gallery-grid">
      {items.map((item, i) => (
        <button
          className="gallery-item"
          key={item.id}
          onClick={() => onOpen(i)}
          aria-label={`查看图片 ${item.caption ?? i + 1}`}
        >
          <img src={item.src} alt={item.caption ?? '图片墙照片'} loading="lazy" />
          {item.caption && <span className="gallery-cap">{item.caption}</span>}
        </button>
      ))}
    </div>
  );
}

export function Lightbox({
  items,
  index,
  onClose,
  onMove,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onMove: (next: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onMove(index - 1);
      if (e.key === 'ArrowRight') onMove(index + 1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, onClose, onMove]);

  const item = items[index];
  if (!item) return null;
  return (
    <div className="lb" role="dialog" aria-modal="true">
      <div className="lb-bar">
        <span>
          GALLERY / {String(index + 1).padStart(2, '0')} — {String(items.length).padStart(2, '0')}
        </span>
        <button className="lb-btn" onClick={onClose} aria-label="关闭">
          关闭 [ESC]
        </button>
      </div>
      <div className="lb-body">
        <img src={item.src} alt={item.caption ?? '图片墙照片'} />
      </div>
      <div className="lb-foot">
        <span>
          {item.caption ?? 'NO CAPTION'}
          {item.location ? ` · ${item.location}` : ''}
          {item.takenAt ? ` · ${item.takenAt}` : ''}
        </span>
        <div className="lb-btns">
          <button className="lb-btn" onClick={() => onMove(index - 1)} aria-label="上一张">
            <ChevronLeft />
          </button>
          <button className="lb-btn" onClick={() => onMove(index + 1)} aria-label="下一张">
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Newsletter({ note }: { note?: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    api
      .post<{ ok: boolean }>('/subscribe', { email: email.trim() })
      .then(() => {
        setState('ok');
        setMsg('订阅成功，请留意邮箱确认信 / SUBSCRIBED');
        setEmail('');
      })
      .catch((err: Error) => {
        setState('err');
        setMsg(err.message || '订阅失败，请稍后再试');
      });
  };

  return (
    <div className="subscribe">
      <div>
        <h2>
          Newsletter
          <br />
          <span className="cn">订阅更新。</span>
        </h2>
        <p>
          新文章、实验记录和偶尔的读书笔记。不频繁，不发广告，随时可以退订。
        </p>
        <span className="ep eyebrow" style={{ display: 'inline-block', marginTop: 18 }}>
          NO SPAM · ONLY WORDS
        </span>
      </div>
      <div className="sub-side">
        <form className="sub-form" onSubmit={submit}>
          <input
            className="sub-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com / 你的邮箱"
            aria-label="邮箱地址"
          />
          <button className="btn btn-primary" type="submit" disabled={state === 'loading'}>
            {state === 'loading' ? '发送中…' : '订阅'} <Mail />
          </button>
        </form>
        {msg && <div className={`sub-msg${state === 'err' ? ' err' : ''}`}>{msg}</div>}
        <div className="sub-note">
          {note ?? '每月一封 · 不发广告 · 随时退订'}
          <br />
          ALSO AVAILABLE AS <a href="/rss.xml" style={{ textDecoration: 'underline' }}>RSS</a>
        </div>
      </div>
    </div>
  );
}
