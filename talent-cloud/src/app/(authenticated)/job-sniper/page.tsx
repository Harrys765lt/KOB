"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JobDetailPanel } from "@/components/job-detail-panel";
import { JobListingCard } from "@/components/job-listing-card";
import { useUserRole } from "@/context/user-role-context";
import { mockJobs } from "@/lib/mock-data";
import { AccessTier } from "@/lib/types";

export default function JobSniperPage() {
  const router = useRouter();
  const { role } = useUserRole();
  const [accessTier, setAccessTier] = useState<AccessTier>("free");
  const [selectedJobId, setSelectedJobId] = useState(mockJobs[0].id);
  const selectedJob = mockJobs.find((job) => job.id === selectedJobId) || mockJobs[0];

  useEffect(() => {
    if (role === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (role === "brand_subscriber") {
      router.replace("/order-book");
    }
  }, [role, router]);

  if (role === "unauthenticated" || role === "brand_subscriber") {
    return null;
  }

  return (
    <div className="grid min-h-[calc(100vh-3rem)] gap-4 xl:grid-cols-[390px_1fr]">
      <section className="card-surface flex flex-col p-4 lg:p-5">
        <p className="editorial-kicker mb-2">Creator Tools</p>
        <h1 className="text-4xl font-bold">Job Sniper</h1>
        <p className="mb-3 text-sm text-[var(--text-secondary)]">Public Listing | Tracked Jobs | Community</p>
        <div className="mb-3 space-y-2">
          <input
            placeholder="Search jobs..."
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(47,127,95,0.2)]"
          />
          <select
            value={accessTier}
            onChange={(event) => setAccessTier(event.target.value as AccessTier)}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[rgba(47,127,95,0.2)]"
          >
            <option value="public">Demo: Unauthenticated</option>
            <option value="free">Demo: Free Account</option>
            <option value="paid">Demo: Paid Subscriber</option>
          </select>
        </div>
        <div className="space-y-2 overflow-y-auto pr-1">
          {mockJobs.map((job) => (
            <JobListingCard
              key={job.id}
              job={job}
              accessTier={accessTier}
              selected={job.id === selectedJobId}
              onSelect={() => setSelectedJobId(job.id)}
            />
          ))}
        </div>
      </section>

      <JobDetailPanel job={selectedJob} />
    </div>
  );
}
