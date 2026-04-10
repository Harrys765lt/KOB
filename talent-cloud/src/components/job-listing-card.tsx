import { AccessTier, JobListing } from "@/lib/types";
import { nicheColorMap } from "@/lib/constants";

type JobListingCardProps = {
  job: JobListing;
  accessTier: AccessTier;
  selected?: boolean;
  onSelect: () => void;
};

export function JobListingCard({ job, accessTier, selected = false, onSelect }: JobListingCardProps) {
  const locked = accessTier === "public";
  const scoreLocked = accessTier !== "paid";

  return (
    <button
      onClick={onSelect}
      className={`card-surface w-full overflow-hidden border-l-4 text-left transition duration-200 ${
        selected
          ? "border-l-[var(--accent-blue)] shadow-[0_18px_36px_rgba(15,23,42,0.13)]"
          : "border-l-[var(--accent-green)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.1)]"
      }`}
    >
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-bold">{locked ? "Major brand (locked)" : job.brandName}</p>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: nicheColorMap[job.niche] }} />
        </div>
        <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
          {locked ? "Sign up to read description." : job.description}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-1">{job.niche}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1">{job.format}</span>
          <span className="rounded-full bg-slate-100 px-2 py-1">{job.platform}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Rate:{" "}
          {locked ? "Locked" : `RM${job.rateRange.min} - RM${job.rateRange.max}`} | Match:{" "}
          {scoreLocked ? "Locked" : `${job.matchScore}%`}
        </p>
      </div>
    </button>
  );
}
