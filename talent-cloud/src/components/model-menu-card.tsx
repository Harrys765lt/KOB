"use client";

import { useState } from "react";
import { AnalyticsCharts } from "@/components/analytics-chart";
import { BrandLogoRow } from "@/components/brand-logo-row";
import { ContentWall } from "@/components/content-wall";
import { CredentialBadge } from "@/components/credential-badge";
import { GatedContent } from "@/components/gated-content";
import { nicheColorMap } from "@/lib/constants";
import { Creator, UserRole } from "@/lib/types";

type ModelMenuCardProps = {
  creator: Creator;
  role: UserRole;
};

export function ModelMenuCard({ creator, role }: ModelMenuCardProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>();

  return (
    <div className="space-y-5">
      <section className="card-surface overflow-hidden">
        <div
          className="h-3 w-full"
          style={{
            background: `linear-gradient(90deg, ${nicheColorMap[creator.niche]} 0%, #ffffff 100%)`,
          }}
        />
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <p className="editorial-kicker">Model Menu Card</p>
            <h1 className="text-4xl font-bold md:text-5xl">{creator.name}</h1>
            <CredentialBadge credentialNumber={creator.credentialNumber} />
            <p className="max-w-3xl">
              <span className="font-semibold">My Niche:</span> {creator.niche}
            </p>
            <p className="max-w-3xl">
              <span className="font-semibold">My Audience:</span> {creator.audience}
            </p>
            <p className="max-w-3xl">
              <span className="font-semibold">My Content:</span> {creator.contentDescription}
            </p>
            {creator.foundingMember ? (
              <span className="inline-flex rounded-full bg-amber-200 px-2 py-1 text-xs font-semibold tracking-wide text-amber-900">
                Founding Member
              </span>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="h-60 rounded-xl bg-gradient-to-br from-slate-300 to-slate-100" />
            <div className="rotate-1 rounded-xl border border-[var(--border)] bg-white p-3 shadow-md">
              <p className="text-xs text-[var(--text-secondary)]">Model Card</p>
              <p className="font-semibold">{creator.name}</p>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-10 rounded bg-slate-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandLogoRow
        brands={creator.brandsWorkedWith}
        selectedBrand={selectedBrand}
        onSelect={setSelectedBrand}
      />

      <ContentWall />

      {selectedBrand ? (
        <section className="card-surface space-y-4 p-5">
          <h2 className="text-3xl font-bold">Content Highlight</h2>
          <p className="text-sm text-[var(--text-secondary)]">Filtered by: {selectedBrand}</p>
          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <div className="rounded-lg border border-[var(--border)] bg-white p-3">
              <div className="mb-2 flex justify-between text-sm">
                <button className="rounded border px-2 py-1">{"<"}</button>
                <button className="rounded border px-2 py-1">{">"}</button>
              </div>
              <div className="h-56 rounded bg-slate-200 p-2 text-sm text-slate-600">brand content carousel</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-20 rounded-md bg-slate-200" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <GatedContent
        requiredRole="brand_subscriber"
        currentRole={role}
        cta="Subscribe to unlock analytics and advanced audience insights."
      >
        <AnalyticsCharts />
      </GatedContent>
    </div>
  );
}
