export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
      <rect width="36" height="36" rx="10" fill="#841617" />
      <path d="M10 25.5 C 13 17, 22 20, 26 10.5" stroke="#f5f1ea" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="10" cy="25.5" r="3" fill="#f5f1ea" />
      <rect x="23.5" y="8" width="5" height="5" fill="#f5f1ea" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={32} />
      <span className="text-[19px] font-bold tracking-tight">SoonerRide</span>
    </span>
  );
}
