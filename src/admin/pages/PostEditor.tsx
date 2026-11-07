import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../../shared/api';
import { useAuthGuard } from '../auth';
import MediaPicker from '../components/MediaPicker';
import type { AdminPost } from '../types';
import { ConfirmModal, Field, Icon, Loading, Notice, Toggle } from '../components/ui';

interface FormState {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  contentMd: string;
  cover: string;
  status: 'draft' | 'published';
  featured: boolean;
  publishedAt: string;
  seoTitle: string;
  seoDesc: string;
  tags: string;
}

const EMPTY: FormState = {
  slug: '',
  title: '',
  subtitle: '',
  excerpt: '',
  contentMd: '',
  cover: '',
  status: 'draft',
  featured: false,
  publishedAt: '',
  seoTitle: '',
  seoDesc: '',
  tags: '',
};

function toDatetimeLocal(value: string | null): string {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
}

function fromDatetimeLocal(value: string): string {
  return value ? value.replace('T', ' ') + ':00' : '';
}

export default function PostEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const guard = useAuthGuard();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(isNew);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedTip, setSavedTip] = useState('');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewTime, setPreviewTime] = useState(0);
  const [picking, setPicking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const previewTimer = useRef<number | null>(null);

  useEffect(() => {
    if (isNew) return;
    api
      .get<AdminPost>(`/admin/posts/${id}`)
      .then((p) => {
        setForm({
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle ?? '',
          excerpt: p.excerpt ?? '',
          contentMd: p.contentMd,
          cover: p.cover ?? '',
          status: p.status,
          featured: p.featured,
          publishedAt: toDatetimeLocal(p.publishedAt),
          seoTitle: p.seoTitle ?? '',
          seoDesc: p.seoDesc ?? '',
          tags: p.tags.join(', '),
        });
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (!guard(err)) setError('文章加载失败');
      });
  }, [id, isNew, guard]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSavedTip('');
  };

  const refreshPreview = useCallback(
    (md: string) => {
      if (previewTimer.current) window.clearTimeout(previewTimer.current);
      previewTimer.current = window.setTimeout(() => {
        api
          .post<{ html: string; readingTime: number }>('/admin/preview', { markdown: md })
          .then((res) => {
            setPreviewHtml(res.html);
            setPreviewTime(res.readingTime);
          })
          .catch((err: unknown) => {
            guard(err);
          });
      }, 400);
    },
    [guard],
  );

  useEffect(() => {
    if (tab === 'preview') {
      setPreviewHtml('');
      refreshPreview(form.contentMd);
    }
  }, [tab, form.contentMd, refreshPreview]);

  const save = async (goList = false) => {
    if (saving) return;
    setSaving(true);
    setError('');
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      excerpt: form.excerpt.trim(),
      contentMd: form.contentMd,
      cover: form.cover.trim(),
      status: form.status,
      featured: form.featured,
      publishedAt: fromDatetimeLocal(form.publishedAt),
      seoTitle: form.seoTitle.trim(),
      seoDesc: form.seoDesc.trim(),
      tags: form.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (isNew) {
        const res = await api.post<{ id: number }>('/admin/posts', payload);
        if (goList) {
          navigate('/posts');
        } else {
          navigate(`/posts/${res.id}`, { replace: true });
        }
      } else {
        await api.put(`/admin/posts/${id}`, payload);
        if (goList) {
          navigate('/posts');
        } else {
          setSavedTip('已保存 ' + new Date().toLocaleTimeString('zh-CN'));
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (!guard(err)) setError(err.message);
      } else {
        setError('保存失败，请稍后再试');
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.del(`/admin/posts/${id}`);
      navigate('/posts');
    } catch (err) {
      if (!guard(err)) setError('删除失败');
      setDeleting(false);
    }
  };

  if (!loaded) return <Loading text="LOADING POST" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            <b>{isNew ? 'NEW' : 'EDIT'}</b>
            {isNew ? '撰写新文章' : `编辑文章 #${id}`}
            {savedTip && (
              <span style={{ marginLeft: 12, color: 'var(--ok)', letterSpacing: '0.1em' }}>
                {savedTip}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link className="btn btn-ghost btn-sm" to="/posts">
              返回列表
            </Link>
            {!isNew && (
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(true)}>
                <Icon name="trash" size={12} />
                删除
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => void save(true)} disabled={saving}>
              保存并返回
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => void save()} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
        {error && (
          <div className="panel-body" style={{ borderBottom: '1px solid var(--line)' }}>
            <Notice kind="err">{error}</Notice>
          </div>
        )}
      </div>

      <div className="editor-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <div className="panel">
            <div className="panel-body">
              <div className="form-grid">
                <Field label="标题" className="col-2">
                  <input
                    className="input"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="文章标题"
                  />
                </Field>
                <Field label="Slug" hint="小写字母、数字、中划线" className="col-1">
                  <input
                    className="input mono-in"
                    value={form.slug}
                    onChange={(e) => set('slug', e.target.value)}
                    placeholder="my-first-post"
                  />
                </Field>
                <Field label="副标题" className="col-1">
                  <input
                    className="input"
                    value={form.subtitle}
                    onChange={(e) => set('subtitle', e.target.value)}
                    placeholder="可选"
                  />
                </Field>
                <Field label="摘要" className="col-2" hint="留空时自动从正文提取">
                  <textarea
                    className="textarea"
                    value={form.excerpt}
                    onChange={(e) => set('excerpt', e.target.value)}
                    rows={2}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                <b>CONTENT</b>正文（Markdown）
              </div>
              <div className="editor-tabs">
                <button
                  className={tab === 'write' ? 'active' : ''}
                  onClick={() => setTab('write')}
                >
                  编写
                </button>
                <button
                  className={tab === 'preview' ? 'active' : ''}
                  onClick={() => setTab('preview')}
                >
                  预览
                </button>
              </div>
            </div>
            <div className="panel-body">
              {tab === 'write' ? (
                <textarea
                  className="textarea code"
                  value={form.contentMd}
                  onChange={(e) => set('contentMd', e.target.value)}
                  placeholder={'## 章节标题\n\n正文内容…'}
                  spellCheck={false}
                />
              ) : (
                <div className="preview-box">
                  {previewHtml === '' ? (
                    <Loading text="RENDERING" />
                  ) : (
                    <>
                      <div
                        className="eyebrow"
                        style={{ marginBottom: 18, color: 'var(--accent)' }}
                      >
                        PREVIEW · 约 {previewTime} 分钟读完
                      </div>
                      <div className="md" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="editor-side">
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                <b>PUBLISH</b>发布设置
              </div>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="状态">
                <select
                  className="select"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as FormState['status'])}
                >
                  <option value="draft">草稿</option>
                  <option value="published">发布</option>
                </select>
              </Field>
              <Toggle
                on={form.featured}
                onChange={(v) => set('featured', v)}
                label="设为精选"
              />
              <Field label="发布时间" hint="发布状态下留空则使用当前时间">
                <input
                  className="input mono-in"
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => set('publishedAt', e.target.value)}
                />
              </Field>
              <Field label="标签" hint="用逗号分隔，不存在的标签会自动创建">
                <input
                  className="input"
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                  placeholder="前端, 学习笔记"
                />
              </Field>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                <b>COVER</b>封面图
              </div>
            </div>
            <div className="panel-body">
              <div className="cover-pick">
                <div className="cover-preview">
                  {form.cover ? <img src={form.cover} alt="封面预览" /> : <span>NO COVER</span>}
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
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div className="panel-title">
                <b>SEO</b>搜索优化
              </div>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="SEO 标题" hint="留空使用文章标题">
                <input
                  className="input"
                  value={form.seoTitle}
                  onChange={(e) => set('seoTitle', e.target.value)}
                />
              </Field>
              <Field label="SEO 描述" hint="留空使用摘要">
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.seoDesc}
                  onChange={(e) => set('seoDesc', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </aside>
      </div>

      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onSelect={(path) => {
            set('cover', path);
            setPicking(false);
          }}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title="删除文章"
          text="确定删除这篇文章吗？此操作不可恢复。"
          busy={deleting}
          onCancel={() => setConfirmDel(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  );
}
