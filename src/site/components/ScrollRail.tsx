import { useEffect, useRef } from 'react';

const SECTIONS = [
  { id: 'writing', ix: '01', label: 'WRITING', cn: '写作' },
  { id: 'works', ix: '02', label: 'WORKS', cn: '作品' },
  { id: 'now', ix: '03', label: 'NOW', cn: '近况' },
  { id: 'toolbox', ix: '04', label: 'TOOLBOX', cn: '工具箱' },
  { id: 'gallery', ix: '05', label: 'GALLERY', cn: '图墙' },
  { id: 'subscribe', ix: '06', label: 'SUBSCRIBE', cn: '订阅' },
];

/** 主刻度：0 / 25 / 50 / 75 / 100 */
const MAJORS = [0, 25, 50, 75, 100];

/**
 * 蓝图刻度尺（游标卡尺版）：
 * 右侧竖向轴线 + 三档数字主刻度 + 空心方框游标（向内容侧伸出测量臂）。
 * 六个章节标签常驻显示并可点击跳转。
 * 数值与位置直接写入 DOM，避免每帧触发 React 渲染。
 */
export default function ScrollRail() {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const btnsRef = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    let frame = 0;
    let layFrame = 0;
    let activeId = '';

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

    /** 章节标签按其在文档中的位置映射到轨道上 */
    const layout = () => {
      layFrame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      SECTIONS.forEach((s, i) => {
        const btn = btnsRef.current[i];
        if (!btn) return;
        const el = document.getElementById(s.id);
        if (!el) {
          btn.hidden = true;
          return;
        }
        btn.hidden = false;
        const top = el.getBoundingClientRect().top + window.scrollY;
        btn.style.top = `${(clamp01(top / max) * 100).toFixed(2)}%`;
      });
    };

    const requestLayout = () => {
      if (layFrame) return;
      layFrame = requestAnimationFrame(layout);
    };

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      const pct = max > 0 ? clamp01(y / max) : 0;

      if (cursorRef.current) cursorRef.current.style.top = `${(pct * 100).toFixed(2)}%`;
      if (pctRef.current) {
        pctRef.current.textContent = String(Math.round(pct * 100)).padStart(3, '0');
      }

      // 当前章节：取最后一个越过视口 42% 位置的 section
      const line = y + window.innerHeight * 0.42;
      let cur = SECTIONS[0];
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top + y <= line) cur = s;
      }
      if (cur.id !== activeId) {
        activeId = cur.id;
        SECTIONS.forEach((s, i) => {
          const btn = btnsRef.current[i];
          if (!btn) return;
          const on = s.id === cur.id;
          btn.classList.toggle('is-active', on);
          if (on) btn.setAttribute('aria-current', 'true');
          else btn.removeAttribute('aria-current');
        });
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    layout();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', requestLayout);
    window.addEventListener('load', requestLayout);

    // 图片/字体加载会改变文档高度，需要重新映射标签位置
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(requestLayout) : null;
    ro?.observe(document.body);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', requestLayout);
      window.removeEventListener('load', requestLayout);
      ro?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (layFrame) cancelAnimationFrame(layFrame);
    };
  }, []);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  };

  return (
    <nav className="rail" aria-label="页面章节导航">
      <span className="rail-pct" aria-hidden="true">
        <b ref={pctRef}>000</b>
        <span>%</span>
      </span>

      <div className="rail-track">
        <span className="rail-axis" aria-hidden="true" />
        <span className="rail-ticks" aria-hidden="true" />

        {MAJORS.map((p) => (
          <span
            className="rail-major"
            style={{ top: `${p}%` }}
            aria-hidden="true"
            key={p}
          >
            <b>{String(p).padStart(3, '0')}</b>
            <i />
          </span>
        ))}

        <span className="rail-cursor" ref={cursorRef} aria-hidden="true">
          <i className="rc-arm" />
          <i className="rc-box" />
        </span>

        <div className="rail-secs">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              ref={(el) => {
                btnsRef.current[i] = el;
              }}
              className={`rail-sec${i === 0 ? ' is-active' : ''}`}
              aria-label={`跳转到 ${s.cn}`}
              onClick={() => jump(s.id)}
            >
              <b>{s.ix}</b>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
