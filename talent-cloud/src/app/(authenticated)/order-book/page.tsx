"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModelPane } from "@/components/model-pane";
import { useUserRole } from "@/context/user-role-context";
import { mockCreators } from "@/lib/mock-data";

export default function OrderBookPage() {
  const router = useRouter();
  const { role, isHydrated } = useUserRole();
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (role === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (role === "free_creator" || role === "paid_creator") {
      router.replace("/talent-card");
    }
  }, [isHydrated, role, router]);

  const filtered = useMemo(() => {
    return mockCreators.filter((creator) => {
      const nicheOk = niche === "All" || creator.niche === niche;
      const verifiedOk = !verifiedOnly || creator.verified;
      const queryOk =
        !search ||
        creator.name.toLowerCase().includes(search.toLowerCase()) ||
        creator.location.toLowerCase().includes(search.toLowerCase()) ||
        creator.niche.toLowerCase().includes(search.toLowerCase());
      return nicheOk && verifiedOk && queryOk;
    });
  }, [niche, search, verifiedOnly]);

  if (!isHydrated || role === "unauthenticated" || role === "free_creator" || role === "paid_creator") {
    return null;
  }

  return (
    <div className="space-y-5 p-1">
      <header className="flex flex-col gap-2">
        <p className="editorial-kicker">Brand Console / Directory</p>
        <h1 className="text-4xl font-bold md:text-5xl">Order Book</h1>
        <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
          Browse talent panes and open full Talent Cards for campaign review, shortlist decisions, and brand outreach.
        </p>
      </header>

      <section className="card-surface grid gap-3 p-4 lg:grid-cols-[1fr_210px_190px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search talent..."
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(47,127,95,0.2)]"
        />
        <select
          value={niche}
          onChange={(event) => setNiche(event.target.value)}
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(47,127,95,0.2)]"
        >
          <option>All</option>
          <option>Beauty</option>
          <option>Food</option>
          <option>Fashion</option>
          <option>Lifestyle</option>
          <option>Tech</option>
          <option>Travel</option>
        </select>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm">
          <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} />
          Verified Only
        </label>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {filtered.map((creator) => (
          <ModelPane key={creator.id} {...creator} />
        ))}
      </section>
    </div>
  );
}
