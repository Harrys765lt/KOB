"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/context/user-role-context";
import { UserRole } from "@/lib/types";

const links = [
  { href: "/job-sniper", label: "Job Sniper" },
  { href: "/order-book", label: "Creator Card" },
  { href: "/analytics", label: "Analytics" },
];

const roleOptions: UserRole[] = [
  "unauthenticated",
  "free_creator",
  "paid_creator",
  "brand_subscriber",
  "admin",
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, setRole } = useUserRole();

  return (
    <>
      <aside className="hidden h-screen w-[220px] flex-col border-r border-white/5 bg-gradient-to-b from-[#0d1117] via-[#121a26] to-[#0d1117] p-4 text-white lg:flex">
        <Link href="/order-book" className="mb-8 flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[var(--accent-blue)] shadow-[0_0_16px_rgba(59,130,246,0.75)]" />
          <span className="font-semibold tracking-wide">Talent Cloud</span>
        </Link>
        <nav className="space-y-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            const isJobSniper = link.href === "/job-sniper" && active;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative block rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {isJobSniper ? <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r bg-[var(--accent-green)]" /> : null}
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2">
          <label className="text-xs uppercase tracking-wider text-slate-400">Demo role</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full rounded-lg border border-white/20 bg-[#0d1117]/70 px-2 py-1.5 text-sm outline-none transition focus:border-[var(--accent-blue)]"
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <div className="rounded-lg border border-white/20 bg-white/5 p-2.5">
            <p className="text-sm font-semibold">Ava Lim</p>
            <p className="text-xs text-slate-400">Account Settings</p>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-slate-200/80 bg-white/95 p-2 backdrop-blur lg:hidden">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-2 py-1 text-xs ${
                active ? "bg-blue-50 font-semibold text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
