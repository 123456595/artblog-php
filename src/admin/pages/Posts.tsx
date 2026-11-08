import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../shared/api';
import { useAuthGuard } from '../auth';
import type { AdminPostList, AdminPostRow } from '../types';
import {
  ConfirmModal,
  Empty,
  Field,
  formatDate,
  Icon,
  Loading,
  Modal,
  Notice,
} from '../components/ui';

export default function Posts() {
  const guard = useAuthGuard();
  const [data, setData] = useState<AdminPostList | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<AdminPostRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* 多选与批量操作 */
  const [checked, setChecked] = useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = useState('');
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [tagModal, setTagModal] = useState<'tag-add' | 'tag-remove' | null>(null);
  const [tagValue, setTagValue] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('per_page', '15');
    api
      .get<AdminPostList>(`/admin/posts?${params.toString()}`)
      .then(setData)
      .catch((err: unknown) => {
        if (!guard(err)) setError('文章列表加载失败');
      });
  }, [q, status, page, guard]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setChecked([]);
  }, [q, status, page]);

  const allChecked =
    data !== null && data.posts.length > 0 && data.posts.every((p) => checked.includes(p.id));

  const toggleOne = (id: number) => {
    setChecked((list) => (list.includes(id) ? list.filter((v) => v !== id) : [...list, id]));
  };

  const toggleAll = () => {
    if (!data) return;
    setChecked(allChecked ? [] : data.posts.map((p) => p.id));
  };

  const runBatch = async (action: string, value?: string) => {
    if (checked.length === 0 || bulkBusy) return;
    setBulkBusy(action);
    setError('');
    try {
      await api.post('/admin/posts/batch', {
        ids: checked,
        action,
        ...(value !== undefined ? { value } : {}),
      });
      setChecked([]);
      load();
    } catch (err) {
      if (!guard(err)) setError(err instanceof Error ? err.message : '批量操作失败');
    } finally {
      setBulkBusy('');
      setConfirmBulk(false);
      setTagModal(null);
      setTagValue('');
    }
  };

  const onDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.del(`/admin/posts/${toDelete.id}`);
      setToDelete(null);
      load();
    } catch (err) {
      if (!guard(err)) setError('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">
          <b>POSTS</b>文章管理{data ? `（共 ${data.total} 篇）` : ''}
        </div>
        <Link className="btn btn-primary btn-sm" to="/posts/new">
          <Icon name="plus" size={12} />
          写新文章
        </Link>
      </div>

      <div className="panel-body" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="toolbar">
          <input
            className="input"
            placeholder="搜索标题或 slug…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </div>
      </div>

      {checked.length > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">已选 {checked.length} 篇</span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={Boolean(bulkBusy)}
            onClick={() => void runBatch('publish')}
          >
            发布
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={Boolean(bulkBusy)}
            onClick={() => void runBatch('draft')}
          >
            转草稿
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={Boolean(bulkBusy)}
            onClick={() => void runBatch('featured')}
          >
            设精选
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={Boolean(bulkBusy)}
            onClick={() => void runBatch('unfeatured')}
          >
            取消精选
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={Boolean(bulkBusy)}
            onClick={() => setTagModal('tag-add')}
          >
            加标签
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={Boolean(bulkBusy)}
            onClick={() => setTagModal('tag-remove')}
          >
            移除标签
          </button>
          <button
            className="btn btn-danger btn-sm"
            disabled={Boolean(bulkBusy)}
            onClick={() => setConfirmBulk(true)}
          >
            删除
          </button>
          <div className="toolbar-spacer" />
          {bulkBusy && <span className="bulk-count">处理中…</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => setChecked([])}>
            取消选择
          </button>
        </div>
      )}

      <div className="panel-body flush">
        {error ? (
          <div className="panel-body">
            <Notice kind="err">{error}</Notice>
          </div>
        ) : data === null ? (
          <Loading />
        ) : data.posts.length === 0 ? (
          <Empty text="没有符合条件的文章" />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    aria-label="全选"
                    checked={allChecked}
                    onChange={toggleAll}
                  />
                </th>
                <th>标题</th>
                <th>状态</th>
                <th>标签</th>
                <th>发布 / 更新</th>
                <th style={{ textAlign: 'right' }}>阅读量</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.posts.map((p) => (
                <tr key={p.id} className={checked.includes(p.id) ? 'is-checked' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`选择 ${p.title}`}
                      checked={checked.includes(p.id)}
                      onChange={() => toggleOne(p.id)}
                    />
                  </td>
                  <td>
                    <Link to={`/posts/${p.id}`} className="cell-title">
                      {p.title}
                      {p.featured && (
                        <span className="badge badge-accent" style={{ height: 18 }}>
                          精选
                        </span>
                      )}
                    </Link>
                    <div className="cell-sub">/{p.slug}</div>
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'published' ? 'badge-ok' : 'badge-warn'}`}>
                      {p.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td>
                    {p.tags.length > 0 ? (
                      <span className="num">{p.tags.join(' / ')}</span>
                    ) : (
                      <span className="num">—</span>
                    )}
                  </td>
                  <td className="num">
                    {formatDate(p.publishedAt)}
                    <br />
                    {formatDate(p.updatedAt)}
                  </td>
                  <td className="num" style={{ textAlign: 'right' }}>
                    {p.views}
                  </td>
                  <td>
                    <div className="cell-actions">
                      <a
                        className="icon-btn"
                        href={`/writing/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="前台查看"
                      >
                        <Icon name="eye" />
                      </a>
                      <Link className="icon-btn" to={`/posts/${p.id}`} title="编辑">
                        <Icon name="edit" />
                      </Link>
                      <button className="icon-btn" onClick={() => setToDelete(p)} title="删除">
                        <Icon name="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="pager">
          <button
            className="btn btn-ghost btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((v) => Math.max(1, v - 1))}
          >
            <Icon name="arrowL" size={12} />
            上一页
          </button>
          <span>
            {data.page} / {data.pages}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={page >= data.pages}
            onClick={() => setPage((v) => Math.min(data.pages, v + 1))}
          >
            下一页
            <Icon name="arrowR" size={12} />
          </button>
        </div>
      )}

      {toDelete && (
        <ConfirmModal
          title="删除文章"
          text={`确定删除「${toDelete.title}」吗？此操作不可恢复，文章的标签关联也会一并移除。`}
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={onDelete}
        />
      )}

      {confirmBulk && (
        <ConfirmModal
          title="批量删除"
          text={`确定删除选中的 ${checked.length} 篇文章吗？此操作不可恢复。`}
          busy={Boolean(bulkBusy)}
          onCancel={() => setConfirmBulk(false)}
          onConfirm={() => void runBatch('delete')}
        />
      )}

      {tagModal && (
        <Modal
          title={tagModal === 'tag-add' ? '批量添加标签' : '批量移除标签'}
          onClose={() => setTagModal(null)}
          footer={
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setTagModal(null)}
                disabled={Boolean(bulkBusy)}
              >
                取消
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={Boolean(bulkBusy) || tagValue.trim() === ''}
                onClick={() => void runBatch(tagModal, tagValue.trim())}
              >
                {bulkBusy ? '处理中…' : `应用到 ${checked.length} 篇`}
              </button>
            </>
          }
        >
          <Field label="标签名" hint="不存在的标签会自动创建">
            <input
              className="input"
              autoFocus
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              placeholder="如 学习笔记"
            />
          </Field>
        </Modal>
      )}
    </div>
  );
}
