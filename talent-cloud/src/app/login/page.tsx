import Link from "next/link";
import { MeadowBackground } from "@/components/meadow-background";

export default function LoginPage() {
  return (
    <MeadowBackground>
      <div className="floating-panel mx-auto max-w-md rounded-2xl border border-white/40 bg-[rgba(143,188,143,0.88)] p-7">
        <h1 className="credential-font mb-2 text-center text-lg tracking-[0.2em]">
          ONBOARDING / LOGIN WINDOW
        </h1>
        <p className="mb-5 text-center text-xs uppercase tracking-[0.18em] text-emerald-950/70">Secure Access</p>
        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-white/50 bg-white/92 px-3 py-2.5 outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-blue-100"
            placeholder="Email"
          />
          <input
            className="w-full rounded-xl border border-white/50 bg-white/92 px-3 py-2.5 outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-blue-100"
            placeholder="Password"
            type="password"
          />
          <button className="w-full rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105">
            Login
          </button>
          <button className="w-full rounded-xl border border-white/60 bg-white/85 px-4 py-2.5 text-sm transition hover:bg-white">
            Continue with Google
          </button>
          <p className="pt-1 text-center text-sm">
            New here?{" "}
            <Link href="/onboarding/creator" className="font-semibold underline">
              Start onboarding
            </Link>
          </p>
        </div>
      </div>
    </MeadowBackground>
  );
}
