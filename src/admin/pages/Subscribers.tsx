import { useCallback, useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { useAuthGuard } from '../auth';
import type { Subscriber } from '../types';
import { ConfirmModal, Empty, formatDate, Icon, Loading, Notice } from '../components/ui';

export default function Subscribers() {
  const guard = useAuthGuard();
  const [items, setItems] = useState<Subscriber[] | null>(null);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<Subscriber | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ items: Subscriber[] }>('/admin/subscribers')
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        if (!guard(err)) setError('订阅者列表加载失败');
      });
  }, [guard]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.del(`/admin/subscribers/${toDelete.id}`);
      setToDelete(null);
      load();
    } catch (err) {
      if (!guard(err)) setError('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = () => {
    if (!items) return;
    const csv = ['email,created_at', ...items.map((s) => `${s.email},${s.createdAt}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">
          <b>SUBSCRIBERS</b>订阅者{items ? `（${items.length} 人）` : ''}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={exportCsv}
          disabled={!items || items.length === 0}
        >
          导出 CSV
        </button>
      </div>
      <div className="panel-body flush">
        {error ? (
          <div className="panel-body">
            <Notice kind="err">{error}</Notice>
          </div>
        ) : items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <Empty text="还没有订阅者" />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>邮箱</th>
                <th>IP</th>
                <th>订阅时间</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="cell-title" style={{ fontWeight: 500 }}>
                      {s.email}
                    </span>
                  </td>
                  <td className="num">{s.ip ?? '—'}</td>
                  <td className="num">{formatDate(s.createdAt)}</td>
                  <td>
                    <div className="cell-actions">
                      <button className="icon-btn" onClick={() => setToDelete(s)} title="删除">
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

      {toDelete && (
        <ConfirmModal
          title="删除订阅者"
          text={`确定移除 ${toDelete.email} 吗？`}
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}
