"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUserRole } from "@/context/user-role-context";
import { UserRole } from "@/lib/types";

const creatorLinks = [
  { href: "/home", label: "Home" },
  { href: "/talent-card", label: "Talent Card" },
  { href: "/job-sniper", label: "Job Sniper" },
  { href: "/messages", label: "Messages" },
];

const brandLinks = [
  { href: "/home", label: "Home" },
  { href: "/order-book", label: "Order Book" },
  { href: "/messages", label: "Messages" },
];

const adminLinks = [
  { href: "/home", label: "Home" },
  { href: "/order-book", label: "Order Book" },
  { href: "/talent-card", label: "Talent Card" },
  { href: "/job-sniper", label: "Job Sniper" },
  { href: "/messages", label: "Messages" },
];

const roleOptions: UserRole[] = [
  "unauthenticated",
  "free_creator",
  "paid_creator",
  "brand_subscriber",
  "admin",
];

function getShortLabel(label: string) {
  return label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { account, role, setRole, clearAccount } = useUserRole();
  const [collapsed, setCollapsed] = useState(false);

  const links = role === "brand_subscriber" ? brandLinks : role === "admin" ? adminLinks : creatorLinks;
  const homeHref = "/home";
  const logout = () => {
    clearAccount();
    router.replace("/");
  };

  return (
    <>
      <aside
        className={`hidden min-h-screen h-auto self-stretch flex-col border-r border-white/5 bg-gradient-to-b from-[#0f1f16] via-[#13281d] to-[#0d1b13] p-3 text-white transition-all duration-300 lg:flex ${
          collapsed ? "w-[88px]" : "w-[220px]"
        }`}
      >
        <div className={`mb-6 flex ${collapsed ? "justify-center" : "items-center justify-between"} gap-2`}>
          <Link href={homeHref} className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
            <span className="grid h-6 w-6 grid-cols-2 gap-[2px] rounded-[2px] border border-[rgba(201,168,76,0.45)] p-[2px]">
              <span className="border border-[rgba(201,168,76,0.5)] bg-[rgba(201,168,76,0.16)]" />
              <span className="border border-[rgba(201,168,76,0.5)]" />
              <span className="border border-[rgba(201,168,76,0.5)]" />
              <span className="border border-[rgba(201,168,76,0.5)] bg-[rgba(201,168,76,0.16)]" />
            </span>
            {!collapsed ? (
              <span
                className="text-[1.1rem] tracking-[0.04em] text-[#e8c97e]"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                Boxin
              </span>
            ) : null}
          </Link>
          {!collapsed ? (
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-md border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.08)] px-2 py-1 text-xs text-[#e8c97e] transition hover:bg-[rgba(201,168,76,0.16)]"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              {"<<"}
            </button>
          ) : null}
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const active =
              pathname.startsWith(link.href) || (link.href === "/order-book" && pathname.startsWith("/creator/"));
            const isJobSniper = link.href === "/job-sniper" && active && !collapsed;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={`group relative flex rounded-lg py-2 text-sm transition ${
                  collapsed ? "justify-center px-2" : "px-3"
                } ${
                  active
                    ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {isJobSniper ? (
                  <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-r bg-[var(--accent-green)]" />
                ) : null}
                {collapsed ? getShortLabel(link.label) : link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          {collapsed ? (
            <>
              <button
                onClick={() => setCollapsed(false)}
                className="w-full rounded-lg border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.08)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e8c97e] transition hover:bg-[rgba(201,168,76,0.16)]"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                {">>"}
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-lg border border-[rgba(244,180,180,0.28)] bg-[rgba(244,180,180,0.08)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f4b4b4] transition hover:bg-[rgba(244,180,180,0.16)]"
                title="Logout"
              >
                LO
              </button>
            </>
          ) : (
            <>
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
                <p className="text-sm font-semibold">{account?.name ?? "No Account"}</p>
                <p className="text-xs text-slate-400">{account?.email ?? "Login required"}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-lg border border-[rgba(244,180,180,0.28)] bg-[rgba(244,180,180,0.08)] px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#f4b4b4] transition hover:bg-[rgba(244,180,180,0.16)]"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--border)]/80 bg-white/95 p-2 backdrop-blur lg:hidden">
        {links.map((link) => {
          const active =
            pathname.startsWith(link.href) || (link.href === "/order-book" && pathname.startsWith("/creator/"));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-2 py-1 text-xs ${
                active ? "bg-[#e8f2ec] font-semibold text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={logout}
          className="rounded-md px-2 py-1 text-xs font-semibold text-[#9b3d3d]"
        >
          Logout
        </button>
      </nav>
    </>
  );
}
