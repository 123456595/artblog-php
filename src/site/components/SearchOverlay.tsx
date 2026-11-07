import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PostListResponse, PostSummary } from '../../shared/types';
import { api } from '../../shared/api';
import { ArrowRight, Search } from './Icons';

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ('');
      setItems([]);
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!q.trim()) {
      setItems([]);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      api
        .get<PostListResponse>(`/posts?q=${encodeURIComponent(q.trim())}&per_page=8`)
        .then((res) => setItems(res.posts))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 240);
    return () => window.clearTimeout(timer);
  }, [q]);

  if (!open) return null;

  const go = (slug: string) => {
    onClose();
    navigate(`/writing/${slug}`);
  };

  return (
    <div className="search-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-head">
          <Search />
          <input
            ref={inputRef}
            className="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索文章、标签、关键词…"
            aria-label="搜索"
          />
          <span className="search-esc">ESC</span>
        </div>
        <div className="search-results">
          {items.map((post) => (
            <button className="search-row" key={post.slug} onClick={() => go(post.slug)}>
              <span className="r-title">{post.title}</span>
              <span className="r-meta">
                {post.tags[0]?.name ?? 'POST'} · {post.readingTime} MIN
              </span>
              <ArrowRight />
            </button>
          ))}
          {!items.length && (
            <div className="search-empty">
              {loading
                ? '搜索中 / SEARCHING…'
                : q.trim()
                  ? '没有匹配结果 / NO MATCH'
                  : '输入关键词开始搜索 / TYPE TO SEARCH'}
            </div>
          )}
        </div>
        <div className="search-foot">
          <span>搜索全部已发布文章</span>
          <span>⌘K 打开 · ESC 关闭</span>
        </div>
      </div>
    </div>
  );
}
