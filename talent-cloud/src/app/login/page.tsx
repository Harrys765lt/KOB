"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/context/user-role-context";
import { UserRole } from "@/lib/types";

type DemoAccount = {
  aliases: string[];
  password: string;
  role: UserRole;
};

const demoAccounts: DemoAccount[] = [
  { aliases: ["admin123", "admin@boxin.my"], password: "admin123", role: "admin" },
  { aliases: ["brand123", "brand@boxin.my"], password: "brand123", role: "brand_subscriber" },
  { aliases: ["creator123", "creator@boxin.my"], password: "creator123", role: "free_creator" },
];

const roleRedirectMap: Record<UserRole, string> = {
  unauthenticated: "/login",
  free_creator: "/talent-card",
  paid_creator: "/talent-card",
  brand_subscriber: "/order-book",
  admin: "/order-book",
};

function resolveRole(identifier: string, password: string): UserRole | null {
  const normalizedId = identifier.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const account = demoAccounts.find(
    (item) => item.aliases.includes(normalizedId) && item.password === normalizedPassword
  );
  return account ? account.role : null;
}

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useUserRole();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Enter your username/email and password.");
      return;
    }

    const resolvedRole = resolveRole(identifier, password);
    if (!resolvedRole) {
      setError("Invalid credentials. Try admin123 / admin123.");
      return;
    }

    setRole(resolvedRole);
    router.replace(roleRedirectMap[resolvedRole]);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111a12] px-4 py-10 text-[#f7f3ec]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(201,168,76,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(201,168,76,0.04)_1px,transparent_1px)] bg-[length:72px_72px]" />
      <div className="pointer-events-none absolute right-[-160px] top-[-170px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(201,168,76,0.12),transparent_65%)]" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[-140px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(26,46,28,0.85),transparent_65%)]" />

      <div className="relative w-full max-w-md rounded-2xl border border-[rgba(201,168,76,0.36)] bg-[rgba(17,26,18,0.9)] p-7 shadow-[0_32px_70px_rgba(0,0,0,0.4)] backdrop-blur-sm">
        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.26em] text-[rgba(201,168,76,0.6)]">
          Boxin Global Talent Cloud
        </p>
        <h1 className="credential-font mb-2 text-center text-lg tracking-[0.2em] text-[#f7f3ec]">LOGIN WINDOW</h1>
        <p className="mb-5 text-center text-xs uppercase tracking-[0.18em] text-[rgba(201,168,76,0.75)]">
          Secure Access
        </p>

        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="w-full rounded-xl border border-[rgba(201,168,76,0.28)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-[#f7f3ec] outline-none transition placeholder:text-[rgba(247,243,236,0.48)] focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(47,127,95,0.28)]"
            placeholder="Username or Email"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-[rgba(201,168,76,0.28)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-[#f7f3ec] outline-none transition placeholder:text-[rgba(247,243,236,0.48)] focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(47,127,95,0.28)]"
            placeholder="Password"
            type="password"
          />
          {error ? <p className="text-sm text-[#f4b4b4]">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--accent-blue)] px-4 py-2.5 font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Login
          </button>
          <button
            type="button"
            className="w-full rounded-xl border border-[rgba(201,168,76,0.32)] bg-[rgba(201,168,76,0.08)] px-4 py-2.5 text-sm text-[#f7f3ec] transition hover:bg-[rgba(201,168,76,0.15)]"
          >
            Continue with Google
          </button>
          <p className="rounded-lg border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.08)] px-3 py-2 text-xs text-[rgba(247,243,236,0.82)]">
            Demo accounts: admin123 / admin123, brand123 / brand123, creator123 / creator123
          </p>
          <p className="pt-1 text-center text-sm text-[rgba(247,243,236,0.8)]">
            New here?{" "}
            <Link href="/onboarding/creator" className="font-semibold text-[#e8c97e] underline">
              Start onboarding
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
