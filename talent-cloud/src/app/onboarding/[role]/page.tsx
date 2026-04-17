"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUserRole } from "@/context/user-role-context";

const roleRedirectMap: Record<string, string> = {
  brand: "/order-book",
  creator: "/talent-card",
  model: "/talent-card",
};

export default function OnboardingRolePage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const role = params.role?.toLowerCase() || "creator";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const { setRole } = useUserRole();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111a12] px-4 py-10 text-[#f7f3ec]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(201,168,76,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(201,168,76,0.04)_1px,transparent_1px)] bg-[length:72px_72px]" />
      <div className="pointer-events-none absolute right-[-160px] top-[-170px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.12),transparent_65%)]" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[-140px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(26,46,28,0.85),transparent_65%)]" />

      <div className="relative w-full max-w-md rounded-2xl border border-[rgba(201,168,76,0.36)] bg-[rgba(17,26,18,0.9)] p-7 shadow-[0_32px_70px_rgba(0,0,0,0.4)] backdrop-blur-sm">
        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.26em] text-[rgba(201,168,76,0.6)]">
          Boxin Global Talent Cloud
        </p>
        <h1 className="credential-font mb-2 text-center text-lg tracking-[0.2em] text-[#f7f3ec]">
          ONBOARDING WINDOW
        </h1>
        <p className="mb-5 text-center text-xs uppercase tracking-[0.18em] text-[rgba(201,168,76,0.75)]">
          Joining as {roleLabel}
        </p>
        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-[rgba(201,168,76,0.28)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-[#f7f3ec] outline-none transition placeholder:text-[rgba(247,243,236,0.48)] focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(47,127,95,0.28)]"
            placeholder="Name"
          />
          <input
            className="w-full rounded-xl border border-[rgba(201,168,76,0.28)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-[#f7f3ec] outline-none transition placeholder:text-[rgba(247,243,236,0.48)] focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(47,127,95,0.28)]"
            placeholder="Email"
          />
          <input
            className="w-full rounded-xl border border-[rgba(201,168,76,0.28)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-[#f7f3ec] outline-none transition placeholder:text-[rgba(247,243,236,0.48)] focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(47,127,95,0.28)]"
            placeholder="Password"
            type="password"
          />
          <button
            onClick={() => {
              setRole(role === "brand" ? "brand_subscriber" : "free_creator");
              router.push(roleRedirectMap[role] || "/talent-card");
            }}
            className="w-full rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Continue
          </button>
          <button className="w-full rounded-xl border border-[rgba(201,168,76,0.32)] bg-[rgba(201,168,76,0.08)] px-4 py-2.5 text-sm text-[#f7f3ec] transition hover:bg-[rgba(201,168,76,0.15)]">
            Continue with Google
          </button>
          <p className="pt-1 text-center text-sm text-[rgba(247,243,236,0.8)]">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-[#e8c97e] underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
