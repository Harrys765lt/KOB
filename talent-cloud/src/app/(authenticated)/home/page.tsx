"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useUserRole } from "@/context/user-role-context";
import {
  mockCreators,
  mockJobs,
  mockProfileViewers,
  mockTrackedJobs,
} from "@/lib/mock-data";
import { ProfileViewerCategory } from "@/lib/types";

type HeroMediaItem = {
  id: string;
  type: "image" | "video";
  src: string;
  alt: string;
};

const viewerColors: Record<ProfileViewerCategory, string> = {
  Brands: "#2f7f5f",
  Models: "#9ca3ff",
  Creators: "#5ea982",
  Representatives: "#c9a84c",
  Recruiters: "#fdb894",
};

const viewerCategories: ProfileViewerCategory[] = [
  "Brands",
  "Models",
  "Creators",
  "Representatives",
  "Recruiters",
];

const monthlyStats = {
  jobsTaken: 6,
  completedJobs: 4,
  activeJobs: 2,
  monthlyEarnings: 14800,
  pendingPayouts: 3200,
  averageJobValue: 2467,
};

type TakenJob = {
  id: string;
  title: string;
  brand: string;
  status: string;
  date: string;
  earnings: number;
};

const takenJobHistory: TakenJob[] = [
  {
    id: "taken-luxe",
    title: "Night routine reel package",
    brand: "Luxe Skincare Co.",
    status: "Paid",
    date: "Apr 22",
    earnings: 3000,
  },
  {
    id: "taken-threadline",
    title: "Eid lookbook stories",
    brand: "Threadline Studio",
    status: "In progress",
    date: "Apr 18",
    earnings: 4200,
  },
  {
    id: "taken-urban",
    title: "Seasonal menu launch",
    brand: "Urban Bite",
    status: "Pending payout",
    date: "Apr 11",
    earnings: 1500,
  },
  {
    id: "taken-gshock",
    title: "Lifestyle product stills",
    brand: "G-Shock Malaysia",
    status: "Paid",
    date: "Apr 04",
    earnings: 6100,
  },
];

const heroMediaTiles: HeroMediaItem[] = [
  { id: "headshot", type: "image", src: "/Model 1/model-headshot.png", alt: "Talent headshot" },
  { id: "fullbody-1", type: "image", src: "/Model 1/model-fullbody1.png", alt: "Talent full body look" },
  { id: "gshock-post-1", type: "image", src: "/Model 1/G-shock campaign post 1.jpg", alt: "Campaign post" },
  { id: "gshock-video-1", type: "video", src: "/Model 1/g-shock campaign vid 1.mp4", alt: "Campaign video" },
  { id: "office-3", type: "image", src: "/Model 1/office 3.jpg", alt: "Talent office shoot" },
  { id: "so-good-video", type: "video", src: "/Model 1/so-good campaign video 1.mp4", alt: "Campaign video" },
  { id: "sea-4", type: "image", src: "/Model 1/sea 4.jpg", alt: "Talent outdoor shoot" },
  { id: "nature-7", type: "image", src: "/Model 1/nature col 7.jpg", alt: "Talent nature shoot" },
  { id: "fullbody-3", type: "image", src: "/Model 1/model-fullbody3.png", alt: "Talent styling look" },
  { id: "gshock-post-2", type: "image", src: "/Model 1/G-shock campaign post 2.jpg", alt: "Campaign post" },
  { id: "so-good-post", type: "image", src: "/Model 1/ean so good campaign post.jpg", alt: "Campaign post" },
  { id: "office-8", type: "image", src: "/Model 1/office 8.jpg", alt: "Talent office shoot" },
  { id: "gshock-video-2", type: "video", src: "/Model 1/g-shock campaign vid 2.mp4", alt: "Campaign video" },
  { id: "fullbody-2", type: "image", src: "/Model 1/model-fullbody2.png", alt: "Talent styling look" },
  { id: "nature-2", type: "image", src: "/Model 1/nature col 2.jpg", alt: "Talent nature shoot" },
  { id: "sea-8", type: "image", src: "/Model 1/sea 8.jpg", alt: "Talent outdoor shoot" },
  { id: "office-5", type: "image", src: "/Model 1/office 5.jpg", alt: "Talent office shoot" },
  { id: "so-good-video-2", type: "video", src: "/Model 1/so-good campaign video 2.mp4", alt: "Campaign video" },
  { id: "nature-9", type: "image", src: "/Model 1/nature col 9.jpg", alt: "Talent nature shoot" },
  { id: "sea-2", type: "image", src: "/Model 1/sea 2.jpg", alt: "Talent outdoor shoot" },
  { id: "office-1", type: "image", src: "/Model 1/office 1.jpg", alt: "Talent office shoot" },
  { id: "fullbody-4", type: "image", src: "/Model 1/model-fullbody4.png", alt: "Talent styling look" },
  { id: "nature-4", type: "image", src: "/Model 1/nature col 4.jpg", alt: "Talent nature shoot" },
  { id: "sea-10", type: "image", src: "/Model 1/sea 10.jpg", alt: "Talent outdoor shoot" },
];

const heroTileClasses = [
  "col-span-2 row-span-2",
  "col-span-1 row-span-2",
  "col-span-1 row-span-1",
  "col-span-2 row-span-2",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-2",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
];

function getInitials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRateRange(min: number, max: number) {
  return `RM${min.toLocaleString()} - RM${max.toLocaleString()}`;
}

export default function HomePage() {
  const router = useRouter();
  const { account, role, isHydrated } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"people" | "jobs">("jobs");
  const [isJobStatsExpanded, setIsJobStatsExpanded] = useState(false);
  const [isManualJobFormOpen, setIsManualJobFormOpen] = useState(false);
  const [manualJobTitle, setManualJobTitle] = useState("");
  const [manualJobBrand, setManualJobBrand] = useState("");
  const [manualJobEarnings, setManualJobEarnings] = useState("");
  const [manualJobs, setManualJobs] = useState<TakenJob[]>([]);

  useEffect(() => {
    if (!isHydrated) return;

    if (role === "unauthenticated") {
      router.replace("/login");
    }
  }, [isHydrated, role, router]);

  const trackedJobs = useMemo(() => {
    return mockTrackedJobs
      .map((tracked) => ({
        ...tracked,
        job: mockJobs.find((job) => job.id === tracked.jobId),
      }))
      .filter((tracked) => tracked.job);
  }, []);

  const recommendedJobs = useMemo(() => {
    return [...mockJobs].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }, []);

  const viewerBreakdown = useMemo(() => {
    return viewerCategories.map((category) => ({
      name: category,
      value: mockProfileViewers.filter((viewer) => viewer.category === category).length,
      fill: viewerColors[category],
    }));
  }, []);

  const jobHistory = useMemo(() => {
    return [...manualJobs, ...takenJobHistory];
  }, [manualJobs]);

  const visibleMonthlyStats = useMemo(() => {
    const manualEarnings = manualJobs.reduce((sum, job) => sum + job.earnings, 0);
    const jobsTaken = monthlyStats.jobsTaken + manualJobs.length;
    const monthlyEarnings = monthlyStats.monthlyEarnings + manualEarnings;

    return {
      ...monthlyStats,
      jobsTaken,
      monthlyEarnings,
      averageJobValue: Math.round(monthlyEarnings / Math.max(jobsTaken, 1)),
    };
  }, [manualJobs]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    if (searchType === "people") {
      return mockCreators
        .filter((creator) =>
          [creator.name, creator.handle, creator.niche, creator.location, creator.contentDescription]
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
        .slice(0, 4)
        .map((creator) => ({
          id: creator.id,
          href: `/creator/${creator.slug}`,
          label: creator.name,
          meta: `${creator.handle} - ${creator.niche} - ${creator.location}`,
        }));
    }

    return mockJobs
      .filter((job) =>
        [job.brandName, job.description, job.niche, job.platform, job.format]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 4)
      .map((job) => ({
        id: job.id,
        href: `/job-sniper/${job.id}`,
        label: job.brandName,
        meta: `${job.niche} - ${job.platform} - ${formatRateRange(job.rateRange.min, job.rateRange.max)}`,
      }));
  }, [searchQuery, searchType]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      return;
    }

    if (searchResults[0]) {
      router.push(searchResults[0].href);
      return;
    }

    router.push(
      searchType === "people"
        ? `/order-book?query=${encodeURIComponent(query)}`
        : `/job-sniper?query=${encodeURIComponent(query)}`,
    );
  };

  const handleManualJobSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const parsedEarnings = Number(manualJobEarnings);
    if (!manualJobTitle.trim() || !manualJobBrand.trim() || !Number.isFinite(parsedEarnings) || parsedEarnings <= 0) {
      return;
    }

    setManualJobs((currentJobs) => [
      {
        id: `manual-${Date.now()}`,
        title: manualJobTitle.trim(),
        brand: manualJobBrand.trim(),
        status: "Manual",
        date: "Today",
        earnings: parsedEarnings,
      },
      ...currentJobs,
    ]);
    setManualJobTitle("");
    setManualJobBrand("");
    setManualJobEarnings("");
    setIsManualJobFormOpen(false);
  };

  if (!isHydrated || role === "unauthenticated") {
    return null;
  }

  const viewerTotal = mockProfileViewers.length;
  const displayName = account?.name ?? "there";

  return (
    <div className="space-y-10 p-1 lg:space-y-12">
      <section className="relative isolate -mx-1 flex min-h-[520px] items-end justify-center overflow-hidden rounded-[28px] pb-16 pt-24 md:min-h-[660px] md:pb-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-35" aria-hidden>
          <div className="hero-media-scroll flex flex-col">
            {[0, 1].map((loopIndex) => (
              <div
                key={loopIndex}
                className="grid grid-cols-4 auto-rows-[112px] gap-2 p-3 sm:auto-rows-[140px] md:grid-cols-6 md:auto-rows-[156px] md:gap-3 md:p-5"
              >
                {heroMediaTiles.map((item, index) => (
                  <div
                    key={`${item.id}-${loopIndex}`}
                    className={`relative overflow-hidden rounded-2xl border border-white/45 bg-white/45 shadow-[0_18px_38px_rgba(16,33,24,0.12)] ${
                      heroTileClasses[index % heroTileClasses.length]
                    }`}
                  >
                    {item.type === "image" ? (
                      <Image src={item.src} alt="" fill sizes="33vw" className="object-cover" aria-hidden />
                    ) : (
                      <video
                        src={item.src}
                        className="h-full w-full object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(238,244,239,0.96)_0%,rgba(238,244,239,0.86)_34%,rgba(238,244,239,0.68)_64%,rgba(238,244,239,0.82)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center">
          <p className="editorial-kicker">Home</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
            Welcome back, {displayName}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--text-secondary)] md:text-lg">
            Search for the right people or the right opportunities from one place.
          </p>

          <form onSubmit={handleSearchSubmit} className="mt-10 w-full max-w-3xl">
            <div className="rounded-[18px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex shrink-0 rounded-xl bg-[#eef4ef] p-1">
                  {(["jobs", "people"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSearchType(type)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        searchType === type
                          ? "bg-white text-[var(--accent-blue)] shadow-[var(--shadow-soft)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {type === "jobs" ? "Jobs" : "People"}
                    </button>
                  ))}
                </div>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label={searchType === "jobs" ? "Search jobs" : "Search people"}
                  placeholder={
                    searchType === "jobs"
                      ? "Search brands, niches, platforms, or briefs"
                      : "Search creators, models, niches, or locations"
                  }
                  className="min-h-12 flex-1 rounded-xl border border-transparent bg-[#fbfdfb] px-4 text-base outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-blue)] focus:bg-white"
                />
                <button
                  type="submit"
                  className="min-h-12 rounded-xl bg-[var(--accent-blue)] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Search
                </button>
              </div>

              {searchQuery.trim() ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[#fbfdfb] text-left">
                  {searchResults.length ? (
                    searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        className="block border-b border-[var(--border)] px-4 py-3 transition last:border-b-0 hover:bg-white"
                      >
                        <p className="font-semibold">{result.label}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{result.meta}</p>
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      No {searchType} found. Press search to open the full{" "}
                      {searchType === "jobs" ? "Job Sniper" : "people"} view.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="editorial-kicker">Jobs</p>
            <h2 className="text-3xl font-bold md:text-4xl">Tracked and recommended</h2>
          </div>
          <Link href="/job-sniper" className="text-sm font-semibold text-[var(--accent-blue)]">
            View Job Sniper
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="card-surface p-4 lg:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="editorial-kicker">Tracked Jobs</p>
              <h2 className="text-2xl font-bold">Active pipeline</h2>
            </div>
            <span className="rounded-full bg-[#eef4ef] px-3 py-1 text-xs font-semibold text-[var(--accent-blue)]">
              {trackedJobs.length} tracked
            </span>
          </div>
          <div className="space-y-3">
            {trackedJobs.map(({ job, status, nextStep, updatedAt }) =>
              job ? (
                <Link
                  key={job.id}
                  href={`/job-sniper/${job.id}`}
                  className="block rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-3 transition hover:border-[var(--accent-blue)] hover:bg-white"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{job.brandName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{job.description}</p>
                    </div>
                    <span className="w-fit rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--accent-blue)] shadow-[inset_0_0_0_1px_var(--border)]">
                      {status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                    <span>{job.niche}</span>
                    <span>{job.platform}</span>
                    <span>{formatRateRange(job.rateRange.min, job.rateRange.max)}</span>
                    <span>Next: {nextStep}</span>
                    <span>Updated {updatedAt}</span>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        </article>

        <article className="card-surface p-4 lg:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="editorial-kicker">Top Recommended Jobs</p>
              <h2 className="text-2xl font-bold">Best matches</h2>
            </div>
            <Link href="/job-sniper" className="text-sm font-semibold text-[var(--accent-blue)]">
              View all
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {recommendedJobs.map((job) => (
              <Link
                key={job.id}
                href={`/job-sniper/${job.id}`}
                className="rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-3 transition hover:border-[var(--accent-blue)] hover:bg-white"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="font-semibold">{job.brandName}</p>
                  <span className="rounded-full bg-[var(--accent-blue)] px-2 py-0.5 text-xs font-semibold text-white">
                    {job.matchScore}%
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">{job.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-[#eef4ef] px-2 py-1">{job.niche}</span>
                  <span className="rounded-full bg-[#eef4ef] px-2 py-1">{job.format}</span>
                </div>
                <p className="mt-3 text-xs font-semibold text-[var(--accent-blue)]">
                  {formatRateRange(job.rateRange.min, job.rateRange.max)}
                </p>
              </Link>
            ))}
          </div>
        </article>
        </div>
      </section>

      <section className="space-y-4 pb-6">
        <div>
          <p className="editorial-kicker">Performance</p>
          <h2 className="text-3xl font-bold md:text-4xl">Profile and monthly statistics</h2>
        </div>

        <div
          className={`grid gap-4 transition-[grid-template-columns] duration-300 ${
            isJobStatsExpanded ? "xl:grid-cols-[0.38fr_1.62fr]" : "xl:grid-cols-[1fr_0.86fr]"
          }`}
        >
          <article className="card-surface p-4 lg:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="editorial-kicker">Profile Views</p>
                {!isJobStatsExpanded ? <h3 className="text-2xl font-bold">Who viewed you</h3> : null}
              </div>
              <span className="rounded-full bg-[#eef4ef] px-3 py-1 text-xs font-semibold text-[var(--accent-blue)]">
                {viewerTotal} total
              </span>
            </div>

            <div className={isJobStatsExpanded ? "block" : "grid gap-4 lg:grid-cols-[0.95fr_1.05fr]"}>
              <div>
                <div className="relative h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={viewerBreakdown}
                        dataKey="value"
                        nameKey="name"
                        startAngle={180}
                        endAngle={0}
                        cx="50%"
                        cy="78%"
                        innerRadius="58%"
                        outerRadius="92%"
                        paddingAngle={2}
                      >
                        {viewerBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-x-0 bottom-4 text-center">
                    <p className="text-3xl font-bold">{viewerTotal}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">views</p>
                  </div>
                </div>
                {!isJobStatsExpanded ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {viewerBreakdown.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-[var(--text-secondary)]">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {!isJobStatsExpanded ? (
                <div className="space-y-2">
                  {mockProfileViewers.slice(0, 5).map((viewer) => (
                    <div
                      key={viewer.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: viewerColors[viewer.category] }}
                        >
                          {getInitials(viewer.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{viewer.name}</p>
                          <p className="truncate text-xs text-[var(--text-secondary)]">{viewer.title}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--text-secondary)]">{viewer.viewedAt}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </article>

          <article
            className="card-surface p-4 lg:p-5"
            onClick={() => {
              if (isJobStatsExpanded) {
                setIsJobStatsExpanded(false);
                setIsManualJobFormOpen(false);
              }
            }}
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="editorial-kicker">This Month</p>
                <h3 className="text-2xl font-bold">Jobs and earnings</h3>
              </div>
              {isJobStatsExpanded ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsManualJobFormOpen((isOpen) => !isOpen);
                  }}
                  className="w-fit rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Add job manually
                </button>
              ) : null}
            </div>

            {!isJobStatsExpanded ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsJobStatsExpanded(true)}
                  className="rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-4 text-left transition hover:border-[var(--accent-blue)] hover:bg-white"
                >
                  <p className="text-sm text-[var(--text-secondary)]">Jobs taken</p>
                  <p className="mt-2 text-4xl font-bold">{visibleMonthlyStats.jobsTaken}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {visibleMonthlyStats.completedJobs} completed - {visibleMonthlyStats.activeJobs} active
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsJobStatsExpanded(true)}
                  className="rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-4 text-left transition hover:border-[var(--accent-blue)] hover:bg-white"
                >
                  <p className="text-sm text-[var(--text-secondary)]">Made so far</p>
                  <p className="mt-2 text-4xl font-bold">RM{visibleMonthlyStats.monthlyEarnings.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Confirmed this month</p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsJobStatsExpanded(true)}
                  className="rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-4 text-left transition hover:border-[var(--accent-blue)] hover:bg-white"
                >
                  <p className="text-sm text-[var(--text-secondary)]">Pending payouts</p>
                  <p className="mt-2 text-3xl font-bold">RM{visibleMonthlyStats.pendingPayouts.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Awaiting brand release</p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsJobStatsExpanded(true)}
                  className="rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-4 text-left transition hover:border-[var(--accent-blue)] hover:bg-white"
                >
                  <p className="text-sm text-[var(--text-secondary)]">Average job value</p>
                  <p className="mt-2 text-3xl font-bold">RM{visibleMonthlyStats.averageJobValue.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Across accepted work</p>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {isManualJobFormOpen ? (
                  <form
                    onSubmit={handleManualJobSubmit}
                    onClick={(event) => event.stopPropagation()}
                    className="grid gap-3 rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-3 md:grid-cols-[1fr_1fr_140px_auto]"
                  >
                    <input
                      value={manualJobTitle}
                      onChange={(event) => setManualJobTitle(event.target.value)}
                      placeholder="Job details"
                      aria-label="Job details"
                      className="min-h-11 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent-blue)]"
                    />
                    <input
                      value={manualJobBrand}
                      onChange={(event) => setManualJobBrand(event.target.value)}
                      placeholder="Brand"
                      aria-label="Brand"
                      className="min-h-11 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent-blue)]"
                    />
                    <input
                      value={manualJobEarnings}
                      onChange={(event) => setManualJobEarnings(event.target.value)}
                      placeholder="RM"
                      aria-label="Earnings in RM"
                      inputMode="numeric"
                      className="min-h-11 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent-blue)]"
                    />
                    <button
                      type="submit"
                      className="min-h-11 rounded-lg bg-[var(--accent-blue)] px-4 text-sm font-semibold text-white transition hover:brightness-105"
                    >
                      Save
                    </button>
                  </form>
                ) : null}

                {jobHistory.map((job) => (
                  <div
                    key={job.id}
                    className="grid gap-3 rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-3 sm:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{job.title}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[var(--accent-blue)] shadow-[inset_0_0_0_1px_var(--border)]">
                          {job.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {job.brand} - {job.date}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-[var(--accent-blue)]">
                      RM{job.earnings.toLocaleString()}
                    </p>
                  </div>
                ))}
                <p className="text-xs text-[var(--text-secondary)]">
                  Click this section again to return to the four-stat overview.
                </p>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">Monthly earnings progress</span>
                <span className="text-[var(--text-secondary)]">RM18,000 goal</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e4eee6]">
                <div
                  className="h-full rounded-full bg-[var(--accent-blue)]"
                  style={{ width: `${Math.min((visibleMonthlyStats.monthlyEarnings / 18000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
