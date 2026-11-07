import { useCallback, useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { useAuthGuard } from '../auth';
import { ConfirmModal, Empty, Field, Icon, Loading, Modal, Notice } from './ui';

export interface SimpleItem {
  id: number;
  sort: number;
}

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number';
  hint?: string;
  span?: 1 | 2;
  required?: boolean;
}

interface ColumnDef<T> {
  label: string;
  render: (item: T) => React.ReactNode;
  width?: number;
}

interface Props<T extends SimpleItem> {
  ix: string;
  title: string;
  resource: string;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
  toForm: (item: T) => Record<string, string | number>;
  blankForm: () => Record<string, string | number>;
  toPayload: (form: Record<string, string | number>) => Record<string, unknown>;
  entityName: string;
}

/** Now / Tools 这类「标签-值-备注-排序」结构的通用 CRUD 页 */
export default function SimpleCrud<T extends SimpleItem>(props: Props<T>) {
  const guard = useAuthGuard();
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ items: T[] }>(`/admin/${props.resource}`)
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        if (!guard(err)) setError('数据加载失败');
      });
  }, [guard, props.resource]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.del(`/admin/${props.resource}/${toDelete.id}`);
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
          <b>{props.ix}</b>
          {props.title}
          {items ? `（${items.length} 条）` : ''}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Icon name="plus" size={12} />
          新增{props.entityName}
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
          <Empty text={`还没有${props.entityName}`} />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                {props.columns.map((c) => (
                  <th key={c.label} style={c.width ? { width: c.width } : undefined}>
                    {c.label}
                  </th>
                ))}
                <th style={{ width: 70 }}>排序</th>
                <th style={{ textAlign: 'right', width: 100 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  {props.columns.map((c) => (
                    <td key={c.label}>{c.render(item)}</td>
                  ))}
                  <td className="num">{item.sort}</td>
                  <td>
                    <div className="cell-actions">
                      <button className="icon-btn" onClick={() => setEditing(item)} title="编辑">
                        <Icon name="edit" />
                      </button>
                      <button className="icon-btn" onClick={() => setToDelete(item)} title="删除">
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
        <SimpleModal
          {...props}
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
          title={`删除${props.entityName}`}
          text="确定删除这条记录吗？"
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}

function SimpleModal<T extends SimpleItem>({
  item,
  onClose,
  onSaved,
  resource,
  fields,
  toForm,
  blankForm,
  toPayload,
  entityName,
}: Props<T> & {
  item: T | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const guard = useAuthGuard();
  const [form, setForm] = useState<Record<string, string | number>>(() =>
    item ? toForm(item) : blankForm(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    const payload = toPayload(form);
    try {
      if (item) {
        await api.put(`/admin/${resource}/${item.id}`, payload);
      } else {
        await api.post(`/admin/${resource}`, payload);
      }
      onSaved();
    } catch (err) {
      if (!guard(err)) setError(err instanceof Error ? err.message : '保存失败');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={item ? `编辑${entityName} #${item.id}` : `新增${entityName}`}
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
      <div className="form-grid">
        {fields.map((f) => (
          <Field
            key={f.key}
            label={f.label}
            hint={f.hint}
            className={f.span === 1 ? 'col-1' : 'col-2'}
          >
            <input
              className={f.type === 'number' ? 'input mono-in' : 'input'}
              type={f.type === 'number' ? 'number' : 'text'}
              value={String(form[f.key] ?? '')}
              required={f.required}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [f.key]: f.type === 'number' ? Number(e.target.value) || 0 : e.target.value,
                }))
              }
            />
          </Field>
        ))}
      </div>
      {error && (
        <div style={{ marginTop: 16 }}>
          <Notice kind="err">{error}</Notice>
        </div>
      )}
    </Modal>
  );
}
