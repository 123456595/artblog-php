import SimpleCrud from '../components/SimpleCrud';
import type { AdminNowItem } from '../types';

export default function Now() {
  return (
    <SimpleCrud<AdminNowItem>
      ix="NOW"
      title="Now · 正在发生"
      resource="now"
      entityName="条目"
      columns={[
        { label: '标签', render: (n) => <span className="cell-title">{n.label}</span>, width: 160 },
        { label: '内容', render: (n) => n.value },
        {
          label: '备注',
          render: (n) => <span className="num">{n.note ?? '—'}</span>,
          width: 220,
        },
      ]}
      fields={[
        { key: 'label', label: '标签', required: true, span: 1 },
        { key: 'value', label: '内容', required: true, span: 1 },
        { key: 'note', label: '备注', span: 2 },
        { key: 'sort', label: '排序值', type: 'number', span: 1 },
      ]}
      blankForm={() => ({ label: '', value: '', note: '', sort: 0 })}
      toForm={(n) => ({ label: n.label, value: n.value, note: n.note ?? '', sort: n.sort })}
      toPayload={(f) => ({
        label: String(f.label ?? '').trim(),
        value: String(f.value ?? '').trim(),
        note: String(f.note ?? '').trim(),
        sort: Number(f.sort) || 0,
      })}
    />
  );
}
