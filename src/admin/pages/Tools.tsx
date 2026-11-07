import SimpleCrud from '../components/SimpleCrud';
import type { AdminToolItem } from '../types';

export default function Tools() {
  return (
    <SimpleCrud<AdminToolItem>
      ix="TOOLBOX"
      title="工具箱"
      resource="tools"
      entityName="工具"
      columns={[
        { label: '名称', render: (t) => <span className="cell-title">{t.name}</span>, width: 200 },
        {
          label: '分类',
          render: (t) => <span className="badge">{t.category ?? '未分类'}</span>,
          width: 130,
        },
        { label: '说明', render: (t) => <span className="num">{t.note ?? '—'}</span> },
        {
          label: '链接',
          render: (t) =>
            t.url ? (
              <a className="link-arrow" href={t.url} target="_blank" rel="noreferrer">
                访问
              </a>
            ) : (
              <span className="num">—</span>
            ),
          width: 90,
        },
      ]}
      fields={[
        { key: 'name', label: '名称', required: true, span: 1 },
        { key: 'category', label: '分类', span: 1 },
        { key: 'url', label: '链接', span: 2 },
        { key: 'note', label: '说明', span: 2 },
        { key: 'sort', label: '排序值', type: 'number', span: 1 },
      ]}
      blankForm={() => ({ name: '', category: '', url: '', note: '', sort: 0 })}
      toForm={(t) => ({
        name: t.name,
        category: t.category ?? '',
        url: t.url ?? '',
        note: t.note ?? '',
        sort: t.sort,
      })}
      toPayload={(f) => ({
        name: String(f.name ?? '').trim(),
        category: String(f.category ?? '').trim(),
        url: String(f.url ?? '').trim(),
        note: String(f.note ?? '').trim(),
        sort: Number(f.sort) || 0,
      })}
    />
  );
}
