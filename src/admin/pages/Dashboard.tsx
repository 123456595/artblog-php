import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../shared/api';
import { useAuthGuard } from '../auth';
import type { Stats } from '../types';
import { formatDate, Icon, Loading, Notice } from '../components/ui';

export default function Dashboard() {
  const guard = useAuthGuard();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Stats>('/admin/stats')
      .then(setStats)
      .catch((err: unknown) => {
        if (!guard(err)) setError('统计数据加载失败');
      });
  }, [guard]);

  if (error) return <Notice kind="err">{error}</Notice>;
  if (!stats) return <Loading text="LOADING STATS" />;

  const cells: { label: string; value: number; unit: string }[] = [
    { label: '已发布文章', value: stats.posts, unit: '篇' },
    { label: '草稿', value: stats.drafts, unit: '篇' },
    { label: '作品', value: stats.works, unit: '个' },
    { label: '图片墙', value: stats.gallery, unit: '张' },
    { label: '订阅者', value: stats.subscribers, unit: '人' },
    { label: '总字数', value: stats.words, unit: '字' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stat-grid">
        {cells.map((c, i) => (
          <div className="stat-cell" key={c.label} data-ix={String(i + 1).padStart(2, '0')}>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">
              {c.value.toLocaleString('zh-CN')}
              <span>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            <b>RECENT</b>最近更新的文章
          </div>
          <Link className="btn btn-primary btn-sm" to="/posts/new">
            <Icon name="plus" size={12} />
            写新文章
          </Link>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>标题</th>
                <th>状态</th>
                <th>发布时间</th>
                <th>更新于</th>
                <th style={{ textAlign: 'right' }}>阅读量</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--muted-2)', textAlign: 'center' }}>
                    还没有文章
                  </td>
                </tr>
              ) : (
                stats.recentPosts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/posts/${p.id}`} className="cell-title">
                        {p.title}
                      </Link>
                      <div className="cell-sub">/{p.slug}</div>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'published' ? 'badge-ok' : 'badge-warn'}`}>
                        {p.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="num">{formatDate(p.publishedAt)}</td>
                    <td className="num">{formatDate(p.updatedAt)}</td>
                    <td className="num" style={{ textAlign: 'right' }}>
                      {p.views}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
