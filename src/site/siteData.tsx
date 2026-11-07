import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../shared/api';
import type { SiteData } from '../shared/types';

interface SiteState {
  site: SiteData | null;
  error: string | null;
}

const SiteContext = createContext<SiteState>({ site: null, error: null });

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteState>({ site: null, error: null });

  useEffect(() => {
    let alive = true;
    api
      .get<SiteData>('/site')
      .then((site) => {
        if (alive) setState({ site, error: null });
      })
      .catch(() => {
        if (alive) setState({ site: null, error: '站点数据加载失败 / FAILED TO LOAD' });
      });
    return () => {
      alive = false;
    };
  }, []);

  return <SiteContext.Provider value={state}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteState {
  return useContext(SiteContext);
}
