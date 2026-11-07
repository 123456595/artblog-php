import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api';
import { useAuth } from '../auth';
import { Field } from '../components/ui';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login(name.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('网络错误，请稍后再试');
      }
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-orbit" aria-hidden />
      <div className="login-card">
        <div className="login-card-head">
          <div className="login-eyebrow">Admin Console</div>
          <h1 className="login-title">
            内容管理台<span className="accent">.</span>
          </h1>
          <p className="login-sub">CodeKpy 个人博客后台 · 单账号访问</p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <Field label="账号">
            <input
              className="input mono-in"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </Field>
          <Field label="密码">
            <input
              className="input mono-in"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error ? <div className="field-err">{error}</div> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? '验证中…' : '进入后台'}
          </button>
        </form>
        <div className="login-foot">
          <span>ARTBLOG / ADMIN</span>
          <span>SESSION + CSRF</span>
        </div>
      </div>
    </div>
  );
}
