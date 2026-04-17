import Link from "next/link";
import { NicheAccentBar } from "@/components/niche-accent-bar";
import { VerifiedBadge } from "@/components/verified-badge";
import { Creator } from "@/lib/types";

type CreatorCardProps = Pick<
  Creator,
  | "name"
  | "credentialNumber"
  | "niche"
  | "location"
  | "followers"
  | "engagementRate"
  | "verified"
  | "slug"
  | "foundingMember"
>;

export function CreatorCard({
  name,
  credentialNumber,
  niche,
  location,
  followers,
  engagementRate,
  verified,
  slug,
  foundingMember,
}: CreatorCardProps) {
  return (
    <Link
      href={`/creator/${slug}`}
      className="card-surface group block overflow-hidden border-[var(--border)] bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#c4d7c9] hover:shadow-[0_18px_36px_rgba(16,33,24,0.12)]"
    >
      <NicheAccentBar niche={niche} />
      <div className="space-y-4 p-4">
        <p className="editorial-kicker">Talent Pane</p>
        <div className="flex items-start justify-between gap-3">
          <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-[#cad7ce] via-[#e1e9e3] to-[#f4f8f5]" />
          <div className="grid h-20 w-20 grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="rounded-[3px] bg-[#dde6df] transition group-hover:bg-[#c7d6cb]" />
            ))}
          </div>
          {verified ? <VerifiedBadge /> : null}
        </div>
        <div className="space-y-1.5 text-sm">
          <p className="text-[1.2rem] font-bold leading-tight">{name}</p>
          <p className="credential-font text-[10px] tracking-[0.1em] text-[var(--text-secondary)]">{credentialNumber}</p>
          <p className="text-[var(--text-secondary)]">{location}</p>
          <div className="grid grid-cols-2 gap-1 pt-1 text-xs">
            <p className="rounded bg-[#f2f7f3] px-2 py-1">
              <span className="text-[var(--text-secondary)]">Niche</span>
              <br />
              <span className="font-semibold text-[var(--text-primary)]">{niche}</span>
            </p>
            <p className="rounded bg-[#f2f7f3] px-2 py-1">
              <span className="text-[var(--text-secondary)]">Followers</span>
              <br />
              <span className="font-semibold text-[var(--text-primary)]">{Intl.NumberFormat().format(followers)}</span>
            </p>
            <p className="col-span-2 rounded bg-[#f2f7f3] px-2 py-1">
              <span className="text-[var(--text-secondary)]">Avg Engagement</span>
              <span className="ml-2 font-semibold text-[var(--text-primary)]">{engagementRate}%</span>
            </p>
          </div>
        </div>
        {foundingMember ? (
          <span className="inline-flex rounded-full bg-amber-200 px-2 py-1 text-xs font-semibold tracking-wide text-amber-900">
            Founding Member
          </span>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-blue)]">Open Talent Card</p>
      </div>
    </Link>
  );
}
