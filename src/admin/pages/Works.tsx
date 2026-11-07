import { useCallback, useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { useAuthGuard } from '../auth';
import MediaPicker from '../components/MediaPicker';
import type { AdminWork } from '../types';
import { ConfirmModal, Empty, Field, Icon, Loading, Modal, Notice, Toggle } from '../components/ui';

interface WorkForm {
  slug: string;
  title: string;
  subtitle: string;
  cover: string;
  descriptionMd: string;
  link: string;
  linkLabel: string;
  year: string;
  stack: string;
  sort: number;
  published: boolean;
}

const EMPTY: WorkForm = {
  slug: '',
  title: '',
  subtitle: '',
  cover: '',
  descriptionMd: '',
  link: '',
  linkLabel: '',
  year: '',
  stack: '',
  sort: 0,
  published: true,
};

export default function Works() {
  const guard = useAuthGuard();
  const [items, setItems] = useState<AdminWork[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminWork | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<AdminWork | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ works: AdminWork[] }>('/admin/works')
      .then((res) => setItems(res.works))
      .catch((err: unknown) => {
        if (!guard(err)) setError('作品列表加载失败');
      });
  }, [guard]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.del(`/admin/works/${toDelete.id}`);
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
          <b>WORKS</b>作品管理{items ? `（${items.length} 个）` : ''}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Icon name="plus" size={12} />
          新增作品
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
          <Empty text="还没有作品" />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 60 }}>封面</th>
                <th>作品</th>
                <th>年份</th>
                <th>技术栈</th>
                <th>排序</th>
                <th>状态</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id}>
                  <td>
                    {w.cover ? (
                      <img
                        src={w.cover}
                        alt=""
                        style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 2 }}
                      />
                    ) : (
                      <span className="num">—</span>
                    )}
                  </td>
                  <td>
                    <div className="cell-title">{w.title}</div>
                    <div className="cell-sub">/{w.slug}</div>
                  </td>
                  <td className="num">{w.year ?? '—'}</td>
                  <td className="num">{w.stack.join(' / ') || '—'}</td>
                  <td className="num">{w.sort}</td>
                  <td>
                    <span className={`badge ${w.status === 'published' ? 'badge-ok' : 'badge-warn'}`}>
                      {w.status === 'published' ? '展示' : '隐藏'}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      {w.link && (
                        <a
                          className="icon-btn"
                          href={w.link}
                          target="_blank"
                          rel="noreferrer"
                          title="打开链接"
                        >
                          <Icon name="external" />
                        </a>
                      )}
                      <button className="icon-btn" onClick={() => setEditing(w)} title="编辑">
                        <Icon name="edit" />
                      </button>
                      <button className="icon-btn" onClick={() => setToDelete(w)} title="删除">
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

      {editing && (
        <WorkModal
          work={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {toDelete && (
        <ConfirmModal
          title="删除作品"
          text={`确定删除「${toDelete.title}」吗？`}
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}

function WorkModal({
  work,
  onClose,
  onSaved,
}: {
  work: AdminWork | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const guard = useAuthGuard();
  const [form, setForm] = useState<WorkForm>(() =>
    work
      ? {
          slug: work.slug,
          title: work.title,
          subtitle: work.subtitle ?? '',
          cover: work.cover ?? '',
          descriptionMd: work.descriptionMd ?? '',
          link: work.link ?? '',
          linkLabel: work.linkLabel ?? '',
          year: work.year ?? '',
          stack: work.stack.join(', '),
          sort: work.sort,
          published: work.status === 'published',
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);

  const set = <K extends keyof WorkForm>(key: K, value: WorkForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      cover: form.cover.trim(),
      descriptionMd: form.descriptionMd,
      link: form.link.trim(),
      linkLabel: form.linkLabel.trim(),
      year: form.year.trim(),
      stack: form.stack,
      sort: form.sort,
      status: form.published ? 'published' : 'hidden',
    };
    try {
      if (work) {
        await api.put(`/admin/works/${work.id}`, payload);
      } else {
        await api.post('/admin/works', payload);
      }
      onSaved();
    } catch (err) {
      if (!guard(err)) setError(err instanceof Error ? err.message : '保存失败');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={work ? `编辑作品 #${work.id}` : '新增作品'}
      onClose={onClose}
      large
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
            取消
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => void save()} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="标题" className="col-1">
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Slug" className="col-1">
          <input
            className="input mono-in"
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
          />
        </Field>
        <Field label="副标题" className="col-2">
          <input
            className="input"
            value={form.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
          />
        </Field>
        <Field label="描述（Markdown）" className="col-2">
          <textarea
            className="textarea code"
            style={{ minHeight: 140 }}
            value={form.descriptionMd}
            onChange={(e) => set('descriptionMd', e.target.value)}
          />
        </Field>
        <Field label="链接" className="col-1">
          <input
            className="input mono-in"
            value={form.link}
            onChange={(e) => set('link', e.target.value)}
            placeholder="https://…"
          />
        </Field>
        <Field label="链接文字" className="col-1">
          <input
            className="input"
            value={form.linkLabel}
            onChange={(e) => set('linkLabel', e.target.value)}
            placeholder="访问项目"
          />
        </Field>
        <Field label="年份" className="col-1">
          <input
            className="input mono-in"
            value={form.year}
            onChange={(e) => set('year', e.target.value)}
            placeholder="2026"
          />
        </Field>
        <Field label="技术栈" hint="逗号分隔" className="col-1">
          <input
            className="input"
            value={form.stack}
            onChange={(e) => set('stack', e.target.value)}
            placeholder="React, TypeScript"
          />
        </Field>
        <Field label="封面" className="col-2">
          <div className="cover-pick">
            <div className="cover-preview">
              {form.cover ? <img src={form.cover} alt="封面" /> : <span>NO COVER</span>}
            </div>
            <div className="cover-controls">
              <input
                className="input mono-in"
                value={form.cover}
                onChange={(e) => set('cover', e.target.value)}
                placeholder="/uploads/…"
              />
              <button className="btn btn-ghost btn-sm" onClick={() => setPicking(true)}>
                <Icon name="media" size={12} />
                从媒体库选择
              </button>
            </div>
          </div>
        </Field>
        <Field label="排序值" hint="越小越靠前" className="col-1">
          <input
            className="input mono-in"
            type="number"
            value={form.sort}
            onChange={(e) => set('sort', Number(e.target.value) || 0)}
          />
        </Field>
        <div className="col-1" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Toggle on={form.published} onChange={(v) => set('published', v)} label="在前台展示" />
        </div>
      </div>
      {error && (
        <div style={{ marginTop: 16 }}>
          <Notice kind="err">{error}</Notice>
        </div>
      )}
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onSelect={(path) => {
            set('cover', path);
            setPicking(false);
          }}
        />
      )}
    </Modal>
  );
}
