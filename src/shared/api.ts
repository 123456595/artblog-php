type Json = Record<string, unknown>;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* 后台会话 CSRF token（登录 / me 接口下发） */
let csrfToken = '';
export function setCsrfToken(token: string): void {
  csrfToken = token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (method !== 'GET' && csrfToken !== '') {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers,
  });

  if (!res.ok) {
    let message = res.statusText || '请求失败';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* 保持默认信息 */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: Json) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: Json) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: async <T>(file: File): Promise<T> => {
    const data = new FormData();
    data.append('file', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: data,
      credentials: 'same-origin',
      headers: csrfToken !== '' ? { 'X-CSRF-Token': csrfToken } : undefined,
    });
    if (!res.ok) {
      let message = '上传失败';
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        /* 保持默认信息 */
      }
      throw new ApiError(res.status, message);
    }
    return (await res.json()) as T;
  },
};
