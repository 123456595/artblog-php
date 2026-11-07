interface IconProps {
  className?: string;
}

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function ArrowRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <path d="M2.5 8h11M9.5 4l4 4-4 4" />
    </svg>
  );
}

export function ArrowLeft({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <path d="M13.5 8h-11M6.5 4l-4 4 4 4" />
    </svg>
  );
}

export function ArrowUpRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <path d="M4 12l8-8M5.5 4h6.5v6.5" />
    </svg>
  );
}

export function ArrowUp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <path d="M8 13.5v-11M4 6.5l4-4 4 4" />
    </svg>
  );
}

export function Search({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <circle cx="7" cy="7" r="4.4" />
      <path d="M10.4 10.4l3.1 3.1" />
    </svg>
  );
}

export function Rss({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <path d="M3.5 12.5h.01" />
      <path d="M3.5 8.5a4 4 0 014 4M3.5 4.5a8 8 0 018 8" />
    </svg>
  );
}

export function Copy({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
      <path d="M10.5 5.5v-2a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1h2" />
    </svg>
  );
}

export function Close({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  );
}

export function Menu({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" />
    </svg>
  );
}

export function Mail({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <rect x="2.5" y="4" width="11" height="8" rx="1" />
      <path d="M3 4.6l5 3.8 5-3.8" />
    </svg>
  );
}

export function ChevronLeft({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <path d="M9.5 3l-5 5 5 5" />
    </svg>
  );
}

export function ChevronRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <path d="M6.5 3l5 5-5 5" />
    </svg>
  );
}

export function Mark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="M2.4 2.2h3v11.6h-3V2.2zm4.1 0h3.2l3.9 5.8-3.9 5.8h-3.2l3.9-5.8-3.9-5.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Share({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <circle cx="12.2" cy="4" r="1.5" />
      <circle cx="3.8" cy="8" r="1.5" />
      <circle cx="12.2" cy="12" r="1.5" />
      <path d="M10.9 4.7l-5.7 2.6M5.2 8.7l5.7 2.6" />
    </svg>
  );
}

export function Clock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" {...base}>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3.2l2.2 1.4" />
    </svg>
  );
}
