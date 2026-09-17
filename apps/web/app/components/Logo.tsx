export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="url(#vidsage-mark)" />
      <path
        d="M8.5 12A3.5 3.5 0 0112 8.5h8A3.5 3.5 0 0123.5 12v5A3.5 3.5 0 0120 20.5h-5.6l-3.9 2.9a.7.7 0 01-1.12-.56V20.5A3.5 3.5 0 018.5 17v-5z"
        fill="#FFFFFF"
        fillOpacity="0.16"
      />
      <path
        d="M14 12.6v6.3a.55.55 0 00.85.46l5-3.15a.55.55 0 000-.93l-5-3.15a.55.55 0 00-.85.47z"
        fill="#FBF4EA"
      />
      <defs>
        <linearGradient id="vidsage-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C68F4E" />
          <stop offset="1" stopColor="#6E4622" />
        </linearGradient>
      </defs>
    </svg>
  );
}
