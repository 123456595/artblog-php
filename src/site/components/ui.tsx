import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Tag } from '../../shared/types';
import { ArrowRight } from './Icons';

export function PageHead({
  eyebrow,
  title,
  cn,
  desc,
  meta,
  children,
}: {
  eyebrow: string;
  title: string;
  cn?: string;
  desc?: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <span className="eyebrow">{eyebrow}</span>
      <h1>
        {title} {cn && <span className="cn">{cn}</span>}
      </h1>
      {desc && <p>{desc}</p>}
      {meta && <div className="head-meta">{meta}</div>}
      {children}
    </div>
  );
}

export function SectionHead({
  ix,
  title,
  meta,
}: {
  ix: string;
  title: string;
  meta?: ReactNode;
}) {
  return (
    <div className="sec-head">
      <span className="sec-ix">
        <b>{ix}</b>
        <span>/</span>
        {title}
      </span>
      {meta && <span className="sec-meta">{meta}</span>}
    </div>
  );
}

export function TagLink({ tag }: { tag: Tag }) {
  return (
    <Link className="tag" to={`/tag/${tag.slug}`}>
      {tag.name}
    </Link>
  );
}

export function Loading({ label = '正在加载 / LOADING' }: { label?: string }) {
  return (
    <div className="page-state">
      <span className="page-state-bar" />
      <span className="mono">{label}</span>
    </div>
  );
}

export function Empty({ text, href, action }: { text: string; href?: string; action?: string }) {
  return (
    <div className="page-state">
      <span className="mono">{text}</span>
      {href && action && (
        <Link className="link-arrow" to={href}>
          {action} <ArrowRight />
        </Link>
      )}
    </div>
  );
}
