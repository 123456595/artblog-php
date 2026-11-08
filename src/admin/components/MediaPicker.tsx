import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../shared/api';
import type { MediaItem } from '../types';
import { Empty, Icon, Loading, Modal, Notice } from './ui';

/** 媒体库选择弹窗：返回所选图片的 path，也支持直接上传 */
export default function MediaPicker({
  onSelect,
  onClose,
}: {
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api
      .get<{ items: MediaItem[] }>('/admin/media')
      .then((res) => setItems(res.items))
      .catch(() => {
        setItems([]);
        setError('媒体库加载失败');
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const res = await api.upload<{ path: string }>(file);
        setSelected(res.path);
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Modal
      title="从媒体库选择"
      onClose={onClose}
      large
      footer={
        <>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Icon name="upload" size={12} />
            {uploading ? '上传中…' : '上传新图片'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            hidden
            onChange={(e) => void onFiles(e.target.files)}
          />
          <div className="toolbar-spacer" />
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
          >
            使用所选图片
          </button>
        </>
      }
    >
      {error && (
        <div style={{ marginBottom: 14 }}>
          <Notice kind="err">{error}</Notice>
        </div>
      )}
      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="媒体库为空，点左下角「上传新图片」" />
      ) : (
        <div className="media-grid">
          {items.map((m) => (
            <div
              key={m.id}
              className={`media-cell selectable ${selected === m.path ? 'selected' : ''}`}
              onClick={() => setSelected(m.path)}
              onDoubleClick={() => onSelect(m.path)}
            >
              <div className="media-thumb">
                <img src={m.path} alt={m.filename} loading="lazy" />
              </div>
              <div className="media-info">
                <div className="media-name" title={m.filename}>
                  {m.filename}
                </div>
                <div className="media-meta">
                  {m.width && m.height ? `${m.width}×${m.height}` : '—'}
                </div>
              </div>
              {selected === m.path && (
                <div className="media-actions" style={{ opacity: 1 }}>
                  <span className="icon-btn" style={{ cursor: 'default' }}>
                    <Icon name="copy" />
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
