import { useEffect, useRef } from 'react';

const SECTIONS = [
  { id: 'writing', ix: '01', label: 'WRITING' },
  { id: 'works', ix: '02', label: 'WORKS' },
  { id: 'now', ix: '03', label: 'NOW' },
  { id: 'toolbox', ix: '04', label: 'TOOLBOX' },
  { id: 'gallery', ix: '05', label: 'GALLERY' },
  { id: 'subscribe', ix: '06', label: 'SUBSCRIBE' },
];

/**
 * 蓝图刻度尺：右侧竖向 1px 刻度 + 实时百分比 + 当前章节号。
 * 数值直接写入 DOM，避免每帧触发 React 渲染。
 */
export default function ScrollRail() {
  const fillRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const secRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    let lastIx = '';

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      const pct =
        max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

      if (fillRef.current) fillRef.current.style.height = `${(pct * 100).toFixed(2)}%`;
      if (markerRef.current) markerRef.current.style.top = `${(pct * 100).toFixed(2)}%`;
      if (pctRef.current) {
        pctRef.current.textContent = String(Math.round(pct * 100)).padStart(3, '0');
      }

      // 当前章节：取最后一个越过视口 42% 位置的 section
      const line = y + window.innerHeight * 0.42;
      let cur = SECTIONS[0];
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.offsetTop <= line) cur = s;
      }
      if (cur.ix !== lastIx) {
        lastIx = cur.ix;
        if (secRef.current) secRef.current.textContent = cur.ix;
        if (nameRef.current) nameRef.current.textContent = cur.label;
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="rail" aria-hidden="true">
      <span className="rail-pct">
        <b ref={pctRef}>000</b>
        <span>%</span>
      </span>

      <div className="rail-track">
        <span className="rail-axis" />
        <span className="rail-ticks" />
        <span className="rail-fill" ref={fillRef} />
        <span className="rail-marker" ref={markerRef} />
      </div>

      <span className="rail-sec">
        <b ref={secRef}>01</b>
        <span>/</span>
        <i ref={nameRef}>WRITING</i>
      </span>
    </div>
  );
}
