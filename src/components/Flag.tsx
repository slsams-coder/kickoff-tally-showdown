export function NorwayFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 16" className={className} aria-label="Norway" role="img">
      <rect width="22" height="16" fill="#ba0c2f" />
      <rect x="6" width="2" height="16" fill="#fff" />
      <rect y="7" width="22" height="2" fill="#fff" />
      <rect x="6.5" width="1" height="16" fill="#00205b" />
      <rect y="7.5" width="22" height="1" fill="#00205b" />
    </svg>
  );
}

export function EnglandFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 16" className={className} aria-label="England" role="img">
      <rect width="22" height="16" fill="#fff" />
      <rect x="9.5" width="3" height="16" fill="#ce1124" />
      <rect y="6.5" width="22" height="3" fill="#ce1124" />
    </svg>
  );
}