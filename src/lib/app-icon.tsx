// Full-bleed app icon (iOS rounds the corners itself). Same mark as LogoMark.
export function AppIcon({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, display: "flex", background: "#841617" }}>
      <svg width={size} height={size} viewBox="0 0 36 36">
        <path d="M10 25.5 C 13 17, 22 20, 26 10.5" stroke="#f5f1ea" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="10" cy="25.5" r="3" fill="#f5f1ea" />
        <rect x="23.5" y="8" width="5" height="5" fill="#f5f1ea" />
      </svg>
    </div>
  );
}
