import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

/**
 * 滚动驱动的标题字母归位：
 * 字母初始沿两侧竖直散开并带旋转，随滚动进度逐个回到横排。
 * 只动 transform / opacity，prefers-reduced-motion 下直接归位。
 */
export default function ScrollTitle({ text, cn }: { text: string; cn?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const chars = Array.from(root.querySelectorAll<HTMLSpanElement>('.st-char'));
    if (chars.length === 0) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      chars.forEach((c) => c.style.setProperty('--lp', '1'));
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.92;
      const end = vh * 0.4;
      const p = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      const span = 2.4;
      const total = chars.length + span;
      chars.forEach((c, i) => {
        const lp = Math.min(1, Math.max(0, (p * total - i) / span));
        c.style.setProperty('--lp', lp.toFixed(3));
      });
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
  }, [text]);

  const letters = Array.from(text).map((ch, i, arr) => {
    const n = arr.length;
    const half = (i - (n - 1) / 2) / Math.max(1, (n - 1) / 2);
    const side = i % 2 === 0 ? -1 : 1;
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const r = seed - Math.floor(seed);
    const dx = side * (26 + r * 34) * (0.5 + Math.abs(half) * 0.7);
    const dy = half * (32 + r * 46);
    const rot = side * (58 + r * 44);

    const style: CSSProperties & Record<string, string> = {
      '--dx': `${dx.toFixed(1)}px`,
      '--dy': `${dy.toFixed(1)}px`,
      '--rot': `${rot.toFixed(1)}deg`,
      '--lp': '0',
    };

    return (
      <span
        className={`st-char${ch === '.' ? ' st-dot' : ''}`}
        style={style}
        key={i}
        aria-hidden="true"
      >
        {ch === ' ' ? '\u00A0' : ch}
      </span>
    );
  });

  return (
    <div className="sec-title sec-title--motion" ref={rootRef} aria-label={text}>
      <span className="st-line">{letters}</span>
      {cn && (
        <>
          <br />
          <span className="cn st-cn">{cn}</span>
        </>
      )}
    </div>
  );
}
