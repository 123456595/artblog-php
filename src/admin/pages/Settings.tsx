import { useEffect, useState } from 'react';
import { api } from '../../shared/api';
import { useAuthGuard } from '../auth';
import MediaPicker from '../components/MediaPicker';
import type { SettingsMap, SocialRow } from '../types';
import { Field, Icon, Loading, Notice } from '../components/ui';

const DEFAULTS: SettingsMap = {
  name: '',
  role: '',
  status: '',
  intro: '',
  bio: '',
  avatar: '',
  since: '',
  location: '',
  email: '',
  socials: '[]',
  footerNote: '',
  newsletterNote: '',
};

export default function Settings() {
  const guard = useAuthGuard();
  const [form, setForm] = useState<SettingsMap | null>(null);
  const [socials, setSocials] = useState<SocialRow[]>([]);
  const [error, setError] = useState('');
  const [tip, setTip] = useState('');
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    api
      .get<{ settings: Record<string, string> }>('/admin/settings')
      .then((res) => {
        const merged = { ...DEFAULTS, ...res.settings };
        setForm(merged);
        try {
          const parsed = JSON.parse(merged.socials) as SocialRow[];
          setSocials(Array.isArray(parsed) ? parsed : []);
        } catch {
          setSocials([]);
        }
      })
      .catch((err: unknown) => {
        if (!guard(err)) setError('设置加载失败');
      });
  }, [guard]);

  const set = (key: keyof SettingsMap, value: string) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setTip('');
  };

  const setSocial = (ix: number, key: keyof SocialRow, value: string) => {
    setSocials((rows) => rows.map((r, i) => (i === ix ? { ...r, [key]: value } : r)));
    setTip('');
  };

  const save = async () => {
    if (!form || saving) return;
    setSaving(true);
    setError('');
    setTip('');
    const payload: Record<string, unknown> = { ...form };
    payload.socials = socials
      .map((s) => ({ label: s.label.trim(), url: s.url.trim() }))
      .filter((s) => s.label !== '' && s.url !== '');
    try {
      await api.put('/admin/settings', { settings: payload });
      setTip('设置已保存 ' + new Date().toLocaleTimeString('zh-CN'));
    } catch (err) {
      if (!guard(err)) setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return error ? <Notice kind="err">{error}</Notice> : <Loading text="LOADING SETTINGS" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            <b>PROFILE</b>站点信息
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => void save()} disabled={saving}>
            {saving ? '保存中…' : '保存全部'}
          </button>
        </div>
        {(error || tip) && (
          <div className="panel-body" style={{ borderBottom: '1px solid var(--line)' }}>
            {error ? <Notice kind="err">{error}</Notice> : <Notice kind="ok">{tip}</Notice>}
          </div>
        )}
        <div className="panel-body">
          <div className="form-grid">
            <Field label="站点名称 / 昵称" className="col-1">
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="身份标语（Role）" className="col-1" hint="如 高中生 · 自学前端">
              <input className="input" value={form.role} onChange={(e) => set('role', e.target.value)} />
            </Field>
            <Field label="当前状态（Status）" className="col-2" hint="首页 Hero 展示的一行短状态">
              <input className="input" value={form.status} onChange={(e) => set('status', e.target.value)} />
            </Field>
            <Field label="首页简介（Intro）" className="col-2">
              <textarea className="textarea" rows={3} value={form.intro} onChange={(e) => set('intro', e.target.value)} />
            </Field>
            <Field label="关于页长介绍（Bio）" className="col-2" hint="支持 Markdown">
              <textarea className="textarea code" style={{ minHeight: 160 }} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
            </Field>
            <Field label="头像" className="col-2">
              <div className="cover-pick">
                <div className="cover-preview" style={{ width: 76, height: 76, borderRadius: '50%' }}>
                  {form.avatar ? <img src={form.avatar} alt="头像" /> : <span>AVATAR</span>}
                </div>
                <div className="cover-controls">
                  <input
                    className="input mono-in"
                    value={form.avatar}
                    onChange={(e) => set('avatar', e.target.value)}
                    placeholder="/uploads/…"
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => setPicking(true)}>
                    <Icon name="media" size={12} />
                    从媒体库选择
                  </button>
                </div>
              </div>
            </Field>
            <Field label="建站年份（Since）" className="col-1">
              <input className="input mono-in" value={form.since} onChange={(e) => set('since', e.target.value)} placeholder="2026" />
            </Field>
            <Field label="所在地" className="col-1">
              <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} />
            </Field>
            <Field label="联系邮箱" className="col-2">
              <input className="input mono-in" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            <b>SOCIALS</b>社交链接
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSocials((rows) => [...rows, { label: '', url: '' }])}
          >
            <Icon name="plus" size={12} />
            添加链接
          </button>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {socials.length === 0 ? (
            <div className="field-hint">还没有社交链接，点击右上角「添加链接」。</div>
          ) : (
            socials.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 10 }}>
                <input
                  className="input"
                  value={s.label}
                  onChange={(e) => setSocial(i, 'label', e.target.value)}
                  placeholder="名称，如 GitHub"
                />
                <input
                  className="input mono-in"
                  value={s.url}
                  onChange={(e) => setSocial(i, 'url', e.target.value)}
                  placeholder="https://…"
                />
                <button
                  className="icon-btn"
                  onClick={() => setSocials((rows) => rows.filter((_, ix) => ix !== i))}
                  title="移除"
                >
                  <Icon name="trash" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">
            <b>FOOTER</b>页脚与订阅
          </div>
        </div>
        <div className="panel-body">
          <div className="form-grid">
            <Field label="页脚备注" className="col-2">
              <input className="input" value={form.footerNote} onChange={(e) => set('footerNote', e.target.value)} />
            </Field>
            <Field label="订阅区说明" className="col-2">
              <input
                className="input"
                value={form.newsletterNote}
                onChange={(e) => set('newsletterNote', e.target.value)}
              />
            </Field>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => void save()} disabled={saving}>
              {saving ? '保存中…' : '保存全部'}
            </button>
          </div>
        </div>
      </div>

      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onSelect={(path) => {
            set('avatar', path);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
