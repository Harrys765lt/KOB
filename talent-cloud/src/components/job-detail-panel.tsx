"use client";

import { useState } from "react";
import { JobListing } from "@/lib/types";

type DetailTab = "pitch" | "reviews" | "community";

export function JobDetailPanel({ job }: { job: JobListing }) {
  const [tab, setTab] = useState<DetailTab>("pitch");

  return (
    <section className="card-surface h-full p-5 lg:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="editorial-kicker mb-2">Job Detail</p>
          <h2 className="text-3xl font-bold md:text-4xl">{job.brandName}</h2>
          <p className="text-sm text-[var(--text-secondary)]">Brand Partnership Opportunity</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm transition hover:bg-slate-50">
            Track brand
          </button>
          <button className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm transition hover:bg-slate-50">
            Share
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { id: "pitch", label: "Pitch" },
          { id: "reviews", label: "Brand Reviews" },
          { id: "community", label: "Community Discussion" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id as DetailTab)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              tab === item.id
                ? "bg-[var(--accent-blue)] text-white shadow-[0_10px_20px_rgba(59,130,246,0.25)]"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "pitch" ? (
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-2">
            <article className="rounded-xl border border-[var(--border)] bg-white p-4">
              <p className="text-sm text-[var(--text-secondary)]">Contact person</p>
              <p className="mt-1 font-semibold">{job.contactPerson.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">{job.contactPerson.title}</p>
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-white p-4">
              <p className="mb-1 font-semibold">Job Description</p>
              <p className="max-h-28 overflow-y-auto text-sm text-[var(--text-secondary)]">{job.description}</p>
            </article>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-slate-50">
              Go to Job Link
            </button>
            <button className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm text-white transition hover:-translate-y-0.5 hover:brightness-105">
              Save Job
            </button>
          </div>
        </div>
      ) : null}

      {tab === "reviews" ? (
        <div className="space-y-3">
          <p className="text-2xl font-bold">4.2/5</p>
          <div className="grid gap-2 text-sm lg:grid-cols-3">
            <p className="rounded-lg bg-slate-100 p-2">Payment Speed: 4.4</p>
            <p className="rounded-lg bg-slate-100 p-2">Communication: 4.1</p>
            <p className="rounded-lg bg-slate-100 p-2">Creative Freedom: 4.0</p>
          </div>
          {job.brandReviews.map((review) => (
            <article
              key={`${review.date}-${review.campaignType}`}
              className="rounded-xl border border-[var(--border)] bg-white p-3"
            >
              <p className="text-sm font-semibold">{"*".repeat(Math.round(review.rating))}</p>
              <p className="text-sm">{review.body}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {review.campaignType} | {review.date}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "community" ? (
        <div className="space-y-2">
          {job.communityThreads.map((thread) => (
            <article key={thread.title} className="rounded-xl border border-[var(--border)] bg-white p-3">
              <p className="font-semibold">{thread.title}</p>
              <p className="text-xs text-[var(--text-secondary)]">{thread.replies} replies</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
