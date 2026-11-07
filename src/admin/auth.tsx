import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError, setCsrfToken } from '../shared/api';

interface AuthState {
  ready: boolean;
  user: string | null;
  login: (user: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  ready: false,
  user: null,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .get<{ user: string | null; csrf: string }>('/admin/me')
      .then((res) => {
        if (!alive) return;
        setCsrfToken(res.csrf);
        setUser(res.user);
      })
      .catch(() => {
        /* 未登录 */
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (name: string, password: string) => {
    const res = await api.post<{ user: string | null; csrf: string }>('/admin/login', {
      user: name,
      password,
    });
    setCsrfToken(res.csrf);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/admin/logout');
    } catch {
      /* 会话可能已失效 */
    }
    setUser(null);
    setCsrfToken('');
  }, []);

  const value = useMemo(
    () => ({ ready, user, login, logout }),
    [ready, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** 捕获 401 时跳转登录页 */
export function useAuthGuard() {
  const { logout } = useAuth();
  return useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        void logout();
        return true;
      }
      return false;
    },
    [logout],
  );
}
