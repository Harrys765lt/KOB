"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { JobDetailPanel } from "@/components/job-detail-panel";
import { mockJobs } from "@/lib/mock-data";

export default function JobDetailRoutePage() {
  const params = useParams<{ jobId: string }>();
  const job = mockJobs.find((item) => item.id === params.jobId) || mockJobs[0];

  return (
    <div className="space-y-3">
      <Link href="/job-sniper" className="text-sm text-[var(--accent-blue)]">
        ← Back to Job Sniper
      </Link>
      <JobDetailPanel job={job} />
    </div>
  );
}
