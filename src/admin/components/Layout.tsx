import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Icon } from './ui';

const NAV: { group: string; items: { to: string; label: string; icon: string; ix: string }[] }[] = [
  {
    group: '总览',
    items: [{ to: '/', label: '仪表盘', icon: 'dashboard', ix: '01' }],
  },
  {
    group: '内容',
    items: [
      { to: '/posts', label: '文章', icon: 'edit', ix: '02' },
      { to: '/works', label: '作品', icon: 'work', ix: '03' },
      { to: '/gallery', label: '图片墙', icon: 'image', ix: '04' },
      { to: '/now', label: 'Now', icon: 'now', ix: '05' },
      { to: '/tools', label: '工具箱', icon: 'tool', ix: '06' },
    ],
  },
  {
    group: '资源',
    items: [
      { to: '/media', label: '媒体库', icon: 'media', ix: '07' },
      { to: '/subscribers', label: '订阅者', icon: 'mail', ix: '08' },
    ],
  },
  {
    group: '系统',
    items: [{ to: '/settings', label: '设置', icon: 'settings', ix: '09' }],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">
        跳到内容 / SKIP TO CONTENT
      </a>
      <aside className={`admin-side ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <span className="admin-brand-mark">K</span>
          <span className="admin-brand-name">
            ART<span>BLOG</span> · ADMIN
          </span>
        </div>
        <nav className="admin-nav" onClick={() => setOpen(false)}>
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="admin-nav-group">{group.group}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  <Icon name={item.icon} />
                  {item.label}
                  <span className="ix">{item.ix}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-side-foot">
          <span className="admin-side-user">{user ?? '—'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            <Icon name="logout" size={12} />
            退出登录
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="icon-btn admin-menu-btn"
              onClick={() => setOpen((v) => !v)}
              aria-label="菜单"
            >
              <Icon name="menu" />
            </button>
            <div className="admin-topbar-title">
              <b>CODEKPY</b>内容管理台
            </div>
          </div>
          <div className="admin-topbar-actions">
            <a className="btn btn-ghost btn-sm" href="/" target="_blank" rel="noreferrer">
              <Icon name="external" size={12} />
              查看站点
            </a>
          </div>
        </header>
        <main className="admin-content" id="admin-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="admin-foot">
          <span>ARTBLOG · PHP + SQLITE</span>
          <span>BLUEPRINT CONSOLE</span>
        </footer>
      </div>
    </div>
  );
}
