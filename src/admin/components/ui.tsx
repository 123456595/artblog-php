import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/* ---------- 图标（1px 线性，与公共站同风格） ---------- */
const paths: Record<string, string> = {
  dashboard: 'M2 8.5 8 3l6 5.5M3.5 7.5V13h9V7.5',
  edit: 'M3 13h10M9.5 3.5l2 2L6 11H4v-2l5.5-5.5z',
  work: 'M2.5 4.5h11v7h-11zM5 4.5V3h6v1.5M2.5 8h11',
  image:
    'M2.5 3.5h11v9h-11zM2.5 10.5l3-3 2.5 2.5 2-2 1.5 1.5M10 6h.01',
  now: 'M8 2.5A5.5 5.5 0 1 0 13.5 8 5.5 5.5 0 0 0 8 2.5zM8 5v3l2 1.5',
  tool: 'M10.5 2.5a3 3 0 0 0-3.9 3.9L2.5 10.5l3 3 4.1-4.1a3 3 0 0 0 3.9-3.9l-2.2 2.2-1.8-1.8z',
  media: 'M3 3h10v10H3zM3 9.5l2.5-2.5 2 2L10 6.5l3 3M6 6h.01',
  mail: 'M2.5 4h11v8h-11zM2.5 4.5 8 9l5.5-4.5',
  settings: 'M8 5.5A2.5 2.5 0 1 0 10.5 8 2.5 2.5 0 0 0 8 5.5zM8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6 5 5M11 11l1.4 1.4M12.4 3.6 11 5M5 11l-1.4 1.4',
  logout: 'M6 3H3v10h3M10 11l3-3-3-3M13 8H6',
  plus: 'M8 3v10M3 8h10',
  trash: 'M3 4.5h10M6.5 4V2.8h3V4M4.5 4.5l.5 8.3h6l.5-8.3M6.8 7v3.5M9.2 7v3.5',
  copy: 'M5 5.5h7.5V13H5zM3.5 10.5H2.5V3H10v1',
  close: 'M3.5 3.5l9 9M12.5 3.5l-9 9',
  search: 'M7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM10 10l3 3',
  eye: 'M1.8 8S4 4 8 4s6.2 4 6.2 4-2.2 4-6.2 4S1.8 8 1.8 8zM8 6.2A1.8 1.8 0 1 0 9.8 8 1.8 1.8 0 0 0 8 6.2z',
  upload: 'M8 11V3.5M5 6l3-3 3 3M3 13h10',
  external: 'M6.5 3.5H3.5v9h9V9.5M9.5 3.5h3v3M12.5 3.5 7.5 8.5',
  arrowL: 'M10 3 5 8l5 5',
  arrowR: 'M6 3l5 5-5 5',
  menu: 'M2.5 4.5h11M2.5 8h11M2.5 11.5h11',
  calendar: 'M3 4h10v9H3zM3 6.5h10M5.5 2.8V4.7M10.5 2.8V4.7',
  tag: 'M2.5 2.5H8L13.5 8 8 13.5 2.5 8zM5.5 5.5h.01',
  link: 'M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-1.2 1.2M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l1.2-1.2',
};

export function Icon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <path d={paths[name] ?? ''} />
    </svg>
  );
}

/* ---------- 表单字段 ---------- */
export function Field({
  label,
  hint,
  extra,
  children,
  className,
}: {
  label: string;
  hint?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field ${className ?? ''}`}>
      <div className="field-label">
        <span>{label}</span>
        {extra ? <em>{extra}</em> : null}
      </div>
      {children}
      {hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  );
}

/* ---------- 开关 ---------- */
export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div
      className={`toggle ${on ? 'on' : ''}`}
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onClick={() => onChange(!on)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(!on);
        }
      }}
    >
      <span className="toggle-track" />
      <span className="toggle-label">{label}</span>
    </div>
  );
}

/* ---------- 弹窗 ---------- */
export function Modal({
  title,
  onClose,
  children,
  footer,
  large,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  large?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="modal-mask"
      onMouseDown={(e) => {
        if (ref.current && !ref.current.contains(e.target as Node)) onClose();
      }}
    >
      <div className={`modal ${large ? 'modal-lg' : ''}`} ref={ref} role="dialog" aria-modal>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------- 状态 ---------- */
export function Loading({ text = 'LOADING' }: { text?: string }) {
  return (
    <div className="loading-line">
      <span className="loading-dot" />
      {text}
    </div>
  );
}

export function Empty({ text = '暂无数据' }: { text?: string }) {
  return <div className="empty">{text}</div>;
}

export function Notice({ kind, children }: { kind: 'info' | 'ok' | 'err'; children: ReactNode }) {
  return (
    <div className={`notice ${kind === 'err' ? 'notice-err' : kind === 'ok' ? 'notice-ok' : ''}`}>
      {children}
    </div>
  );
}

/* ---------- 确认删除 ---------- */
export function ConfirmModal({
  title,
  text,
  onCancel,
  onConfirm,
  busy,
}: {
  title: string;
  text: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
            取消
          </button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm} disabled={busy}>
            {busy ? '删除中…' : '确认删除'}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{text}</p>
    </Modal>
  );
}

/* ---------- 小工具 ---------- */
export function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  return value.replace('T', ' ').slice(0, 16);
}
