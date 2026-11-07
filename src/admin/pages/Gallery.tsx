import { useCallback, useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { useAuthGuard } from '../auth';
import MediaPicker from '../components/MediaPicker';
import type { AdminGalleryItem } from '../types';
import { ConfirmModal, Empty, Field, Icon, Loading, Modal, Notice } from '../components/ui';

interface GalleryForm {
  src: string;
  caption: string;
  location: string;
  takenAt: string;
  sort: number;
}

const EMPTY: GalleryForm = { src: '', caption: '', location: '', takenAt: '', sort: 0 };

export default function Gallery() {
  const guard = useAuthGuard();
  const [items, setItems] = useState<AdminGalleryItem[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminGalleryItem | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<AdminGalleryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ items: AdminGalleryItem[] }>('/admin/gallery')
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        if (!guard(err)) setError('图片墙加载失败');
      });
  }, [guard]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.del(`/admin/gallery/${toDelete.id}`);
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
          <b>GALLERY</b>图片墙{items ? `（${items.length} 张）` : ''}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Icon name="plus" size={12} />
          新增图片
        </button>
      </div>
      <div className="panel-body">
        {error ? (
          <Notice kind="err">{error}</Notice>
        ) : items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <Empty text="图片墙为空" />
        ) : (
          <div className="gallery-grid">
            {items.map((g) => (
              <div className="gallery-cell" key={g.id}>
                <img src={g.src} alt={g.caption ?? ''} loading="lazy" />
                <div className="gallery-cell-body">
                  <div className="gallery-cell-cap">{g.caption || '（无描述）'}</div>
                  <div className="gallery-cell-meta">
                    {[g.location, g.takenAt, `SORT ${g.sort}`].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="gallery-cell-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(g)}>
                    <Icon name="edit" size={12} />
                    编辑
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setToDelete(g)}>
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <GalleryModal
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {toDelete && (
        <ConfirmModal
          title="删除图片"
          text="确定把这张图从图片墙移除吗？（不会删除媒体库文件）"
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}

function GalleryModal({
  item,
  onClose,
  onSaved,
}: {
  item: AdminGalleryItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const guard = useAuthGuard();
  const [form, setForm] = useState<GalleryForm>(() =>
    item
      ? {
          src: item.src,
          caption: item.caption ?? '',
          location: item.location ?? '',
          takenAt: item.takenAt ?? '',
          sort: item.sort,
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);

  const set = <K extends keyof GalleryForm>(key: K, value: GalleryForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    const payload = {
      src: form.src.trim(),
      caption: form.caption.trim(),
      location: form.location.trim(),
      takenAt: form.takenAt.trim(),
      sort: form.sort,
    };
    try {
      if (item) {
        await api.put(`/admin/gallery/${item.id}`, payload);
      } else {
        await api.post('/admin/gallery', payload);
      }
      onSaved();
    } catch (err) {
      if (!guard(err)) setError(err instanceof Error ? err.message : '保存失败');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={item ? `编辑图片 #${item.id}` : '新增图片'}
      onClose={onClose}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="图片">
          <div className="cover-pick">
            <div className="cover-preview">
              {form.src ? <img src={form.src} alt="预览" /> : <span>NO IMAGE</span>}
            </div>
            <div className="cover-controls">
              <input
                className="input mono-in"
                value={form.src}
                onChange={(e) => set('src', e.target.value)}
                placeholder="/uploads/…"
              />
              <button className="btn btn-ghost btn-sm" onClick={() => setPicking(true)}>
                <Icon name="media" size={12} />
                从媒体库选择
              </button>
            </div>
          </div>
        </Field>
        <div className="form-grid">
          <Field label="描述" className="col-2">
            <input
              className="input"
              value={form.caption}
              onChange={(e) => set('caption', e.target.value)}
            />
          </Field>
          <Field label="拍摄地点" className="col-1">
            <input
              className="input"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </Field>
          <Field label="拍摄时间" hint="如 2026-11" className="col-1">
            <input
              className="input mono-in"
              value={form.takenAt}
              onChange={(e) => set('takenAt', e.target.value)}
            />
          </Field>
          <Field label="排序值" className="col-1">
            <input
              className="input mono-in"
              type="number"
              value={form.sort}
              onChange={(e) => set('sort', Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        {error && <Notice kind="err">{error}</Notice>}
      </div>
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onSelect={(path) => {
            set('src', path);
            setPicking(false);
          }}
        />
      )}
    </Modal>
  );
}
