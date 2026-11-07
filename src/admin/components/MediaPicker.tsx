import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import type { MediaItem } from '../types';
import { Empty, Icon, Loading, Modal } from './ui';

/** 媒体库选择弹窗：返回所选图片的 path */
export default function MediaPicker({
  onSelect,
  onClose,
}: {
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ items: MediaItem[] }>('/admin/media')
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <Modal
      title="从媒体库选择"
      onClose={onClose}
      large
      footer={
        <>
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
      {items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="媒体库为空，请先到「媒体库」上传图片" />
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
