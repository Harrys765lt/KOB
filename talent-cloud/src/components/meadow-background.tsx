function Cloud({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 280 120" className={`absolute ${className}`} aria-hidden>
      <path
        d="M44 93c-21 0-38-15-38-34 0-17 13-31 31-34 7-16 24-27 44-27 17 0 33 8 42 20 6-2 12-3 18-3 18 0 34 9 42 23 4-1 8-2 13-2 23 0 42 16 42 37s-19 37-42 37H44z"
        fill="#f3f4f6"
        stroke="#111827"
        strokeWidth="3"
      />
    </svg>
  );
}

export function MeadowBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#cfe3f2] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(255,255,255,0.5),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.36),transparent_44%)]" />

      <Cloud className="left-[6%] top-[14%] z-10 h-20 w-48 md:h-24 md:w-60" />
      <Cloud className="right-[6%] top-[8%] z-10 h-20 w-48 md:h-24 md:w-60" />

      <div
        className="absolute inset-x-0 bottom-0 z-0 h-[45vh] min-h-[240px]"
        style={{ clipPath: "polygon(0 28%, 100% 12%, 100% 100%, 0 100%)" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/landing/pexels-hills-32905471.jpg')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,36,6,0)_0%,rgba(5,36,6,0.22)_100%)]" />
        <div
          className="absolute inset-x-0 bottom-0 h-[45%] bg-cover bg-center opacity-80 mix-blend-multiply"
          style={{ backgroundImage: "url('/images/landing/grass-texture-real.jpg')" }}
        />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#cfe3f2] via-[#cfe3f2]/62 to-transparent" />
      </div>

      <div className="relative z-20 w-full">{children}</div>
    </div>
  );
}
