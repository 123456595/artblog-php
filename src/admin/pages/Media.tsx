import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api';
import { useAuthGuard } from '../auth';
import type { MediaItem, UploadResult } from '../types';
import { ConfirmModal, Empty, formatSize, Icon, Loading, Notice } from '../components/ui';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export default function Media() {
  const guard = useAuthGuard();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState('');
  const [tip, setTip] = useState('');
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api
      .get<{ items: MediaItem[] }>('/admin/media')
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        if (!guard(err)) setError('媒体库加载失败');
      });
  }, [guard]);

  useEffect(() => {
    load();
  }, [load]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setTip('');
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!ACCEPT.includes(file.type)) {
          setError(`「${file.name}」不是受支持的图片格式`);
          continue;
        }
        await api.upload<UploadResult>(file);
      }
      load();
    } catch (err) {
      if (!guard(err)) setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const copyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setTip(`已复制 ${path}`);
      window.setTimeout(() => setTip(''), 2000);
    } catch {
      setTip(path);
    }
  };

  const onDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.del(`/admin/media/${toDelete.id}`);
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
          <b>MEDIA</b>媒体库{items ? `（${items.length} 个文件）` : ''}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {uploading && <span className="eyebrow">上传中…</span>}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Icon name="upload" size={12} />
            上传图片
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT.join(',')}
            multiple
            hidden
            onChange={(e) => void onFiles(e.target.files)}
          />
        </div>
      </div>
      {(error || tip) && (
        <div className="panel-body" style={{ borderBottom: '1px solid var(--line)' }}>
          {error ? <Notice kind="err">{error}</Notice> : <Notice kind="ok">{tip}</Notice>}
        </div>
      )}
      <div className="panel-body">
        {items === null ? (
          <Loading />
        ) : items.length === 0 ? (
          <Empty text="媒体库为空" />
        ) : (
          <div className="media-grid">
            {items.map((m) => (
              <div className="media-cell" key={m.id}>
                <div className="media-thumb">
                  <img src={m.path} alt={m.filename} loading="lazy" />
                </div>
                <div className="media-info">
                  <div className="media-name" title={m.filename}>
                    {m.filename}
                  </div>
                  <div className="media-meta">
                    {m.width && m.height ? `${m.width}×${m.height} · ` : ''}
                    {formatSize(m.size)}
                  </div>
                </div>
                <div className="media-actions">
                  <button className="icon-btn" onClick={() => void copyPath(m.path)} title="复制路径">
                    <Icon name="copy" />
                  </button>
                  <button className="icon-btn" onClick={() => setToDelete(m)} title="删除">
                    <Icon name="trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          title="删除文件"
          text={`确定删除「${toDelete.filename}」吗？服务器上的文件也会被移除，引用它的内容将显示裂图。`}
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}
