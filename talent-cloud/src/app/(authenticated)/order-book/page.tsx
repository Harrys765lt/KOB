"use client";

import { useMemo, useState } from "react";
import { CreatorCard } from "@/components/creator-card";
import { mockCreators } from "@/lib/mock-data";

export default function OrderBookPage() {
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

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

  return (
    <div className="space-y-5 p-1">
      <header className="flex flex-col gap-2">
        <p className="editorial-kicker">Talent Cloud / Directory</p>
        <h1 className="text-4xl font-bold md:text-5xl">Order Book</h1>
        <p className="max-w-2xl text-sm text-[var(--text-secondary)]">
          Browse verified Malaysian creators with standardized credentials, niche-mapped profiles, and campaign-ready
          portfolio context.
        </p>
      </header>

      <section className="card-surface grid gap-3 p-4 lg:grid-cols-[1fr_210px_190px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search creators..."
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-blue-100"
        />
        <select
          value={niche}
          onChange={(event) => setNiche(event.target.value)}
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-blue-100"
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
          <CreatorCard key={creator.id} {...creator} />
        ))}
      </section>
    </div>
  );
}
