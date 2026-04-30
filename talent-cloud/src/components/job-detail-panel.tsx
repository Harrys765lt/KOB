"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  createJobShareUrl,
  JOB_SHARE_STORAGE_KEY,
  jobShareRecipients,
} from "@/lib/job-sharing";
import type { StoredJobShare } from "@/lib/job-sharing";
import { JobListing } from "@/lib/types";

type DetailTab = "pitch" | "reviews" | "community";

function readStoredShares() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedShares = JSON.parse(window.localStorage.getItem(JOB_SHARE_STORAGE_KEY) ?? "[]");
    return Array.isArray(savedShares) ? (savedShares as StoredJobShare[]) : [];
  } catch {
    return [];
  }
}

function formatRateRange(min: number, max: number) {
  return `RM${min.toLocaleString()} - RM${max.toLocaleString()}`;
}

export function JobDetailPanel({ job }: { job: JobListing }) {
  const [tab, setTab] = useState<DetailTab>("pitch");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([jobShareRecipients[0].id]);
  const [shareNote, setShareNote] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const shareUrl = createJobShareUrl(job.id);
  const selectedRecipientNames = jobShareRecipients
    .filter((recipient) => selectedRecipientIds.includes(recipient.id))
    .map((recipient) => recipient.name);

  const openShareDialog = () => {
    setShareStatus("");
    setShareNote("");
    setSelectedRecipientIds([jobShareRecipients[0].id]);
    setIsShareOpen(true);
  };

  const getAbsoluteShareUrl = () =>
    createJobShareUrl(job.id, typeof window === "undefined" ? undefined : window.location.origin);

  const toggleRecipient = (recipientId: string) => {
    setShareStatus("");
    setSelectedRecipientIds((currentRecipientIds) =>
      currentRecipientIds.includes(recipientId)
        ? currentRecipientIds.filter((id) => id !== recipientId)
        : [...currentRecipientIds, recipientId],
    );
  };

  const copyJobLink = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setShareStatus("Copy is unavailable in this browser. Use the link field instead.");
      return;
    }

    try {
      await navigator.clipboard.writeText(getAbsoluteShareUrl());
      setShareStatus("Job link copied.");
    } catch {
      setShareStatus("Copy failed. Use the link field instead.");
    }
  };

  const openNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      await copyJobLink();
      return;
    }

    try {
      await navigator.share({
        title: `${job.brandName} job on Job Sniper`,
        text: `I found this ${job.niche.toLowerCase()} opportunity on Job Sniper.`,
        url: getAbsoluteShareUrl(),
      });
      setShareStatus("Share sheet opened.");
    } catch {
      setShareStatus("Share cancelled.");
    }
  };

  const sendShareToRecipients = () => {
    if (selectedRecipientIds.length === 0) {
      setShareStatus("Choose at least one friend or connection.");
      return;
    }

    if (typeof window !== "undefined") {
      const timestamp = new Date().toISOString();
      const newShares = selectedRecipientIds.map((recipientId) => ({
        id: `share-${job.id}-${recipientId}-${Date.now()}`,
        jobId: job.id,
        recipientId,
        note: shareNote.trim(),
        createdAt: timestamp,
      }));

      window.localStorage.setItem(JOB_SHARE_STORAGE_KEY, JSON.stringify([...readStoredShares(), ...newShares]));
    }

    setShareStatus(
      `Shared with ${selectedRecipientNames.length === 1 ? selectedRecipientNames[0] : `${selectedRecipientNames.length} people`}.`,
    );
    setShareNote("");
  };

  return (
    <section className="card-surface h-full p-5 lg:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="editorial-kicker mb-2">Job Detail</p>
          <h2 className="text-3xl font-bold md:text-4xl">{job.brandName}</h2>
          <p className="text-sm text-[var(--text-secondary)]">Brand Partnership Opportunity</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm transition hover:bg-[#f2f7f3]"
          >
            Track brand
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
                ? "bg-[var(--accent-blue)] text-white shadow-[0_10px_20px_rgba(47,127,95,0.28)]"
                : "bg-[#eef4ef] text-[#45574d] hover:bg-[#e2ece4]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "pitch" ? (
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(280px,0.88fr)_minmax(360px,1.12fr)]">
            <article className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]">
              <div className="border-b border-[var(--border)] bg-[#f7faf8] px-4 py-3">
                <p className="editorial-kicker">Person In Charge</p>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-[120px_1fr] sm:items-center">
                <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-[var(--border)] bg-[#e7f0ea] sm:h-28 sm:w-28">
                  {job.contactPerson.photoUrl ? (
                    <Image
                      src={job.contactPerson.photoUrl}
                      alt={`${job.contactPerson.name} headshot`}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--accent-blue)]">
                      {job.contactPerson.name
                        .split(/\s+/)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold">{job.contactPerson.name}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{job.contactPerson.title}</p>
                  <p className="mt-3 rounded-lg bg-[#eef4ef] px-3 py-2 text-xs font-semibold text-[var(--accent-blue)]">
                    Verified BOXIN brand contact
                  </p>
                </div>
              </div>
              <div className="border-t border-[var(--border)] px-4 py-3">
                <p className="text-sm font-semibold">About {job.brandName}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{job.companyIntro}</p>
              </div>
            </article>

            <article className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-soft)]">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="editorial-kicker mb-1">Job Description</p>
                  <h3 className="text-xl font-bold">{job.niche} Partnership Brief</h3>
                </div>
                <span className="rounded-full bg-[#eef4ef] px-3 py-1 text-xs font-semibold text-[var(--accent-blue)]">
                  {job.matchScore}% match
                </span>
              </div>
              <p className="mb-4 text-sm leading-6 text-[var(--text-secondary)]">{job.description}</p>
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Pay</p>
                  <p className="mt-1 font-bold text-[var(--text-primary)]">
                    {formatRateRange(job.rateRange.min, job.rateRange.max)}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[#fbfdfb] p-3">
                  <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Format</p>
                  <p className="mt-1 font-bold text-[var(--text-primary)]">
                    {job.format} on {job.platform}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-[var(--text-secondary)]">
                  Looking for
                </p>
                <div className="flex flex-wrap gap-2">
                  {job.talentTypes.map((talentType) => (
                    <span key={talentType} className="rounded-full bg-[#eef4ef] px-3 py-1.5 text-xs font-semibold">
                      {talentType}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                <Link
                  href={`/messages?thread=${job.contactPerson.threadId}`}
                  className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Message PIC on BOXIN
                </Link>
                <button className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[#f2f7f3]">
                  Go to Job Link
                </button>
              </div>
            </article>
          </div>

          <section className="rounded-xl border border-[var(--border)] bg-[#fbfdfb] p-4 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="editorial-kicker mb-1">Recommended</p>
                <h3 className="text-2xl font-bold">More jobs like this</h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Similar briefs based on niche and talent fit</p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {(job.similarJobs ?? []).map((similarJob) => (
                <article
                  key={similarJob.id}
                  className="rounded-xl border border-[var(--border)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-blue)] hover:shadow-[0_12px_28px_rgba(16,33,24,0.1)]"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold">{similarJob.brandName}</p>
                      <p className="mt-1 text-xs font-semibold text-[var(--accent-blue)]">
                        {similarJob.platform} · {similarJob.matchScore}% match
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#eef4ef] px-2 py-1 text-xs font-semibold">
                      {formatRateRange(similarJob.rateRange.min, similarJob.rateRange.max)}
                    </span>
                  </div>
                  <p className="line-clamp-2 min-h-10 text-sm text-[var(--text-secondary)]">
                    {similarJob.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {similarJob.talentTypes.slice(0, 2).map((talentType) => (
                      <span key={talentType} className="rounded-full bg-[#eef4ef] px-2 py-1 text-xs">
                        {talentType}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm text-white transition hover:-translate-y-0.5 hover:brightness-105">
              Save Job
            </button>
            <button
              type="button"
              onClick={openShareDialog}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm transition hover:bg-[#f2f7f3]"
            >
              Share
            </button>
          </div>
        </div>
      ) : null}

      {tab === "reviews" ? (
        <div className="space-y-3">
          <p className="text-2xl font-bold">4.2/5</p>
          <div className="grid gap-2 text-sm lg:grid-cols-3">
            <p className="rounded-lg bg-[#eef4ef] p-2">Payment Speed: 4.4</p>
            <p className="rounded-lg bg-[#eef4ef] p-2">Communication: 4.1</p>
            <p className="rounded-lg bg-[#eef4ef] p-2">Creative Freedom: 4.0</p>
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

      {isShareOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#112018]/38 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-job-title"
            className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_24px_70px_rgba(16,33,24,0.22)]"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="editorial-kicker mb-2">Share Job</p>
                <h3 id="share-job-title" className="text-2xl font-bold">
                  {job.brandName}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Send this opportunity to friends and creator connections.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-lg transition hover:bg-[#f2f7f3]"
                aria-label="Close share dialog"
              >
                x
              </button>
            </div>

            <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <label className="min-w-0">
                <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Job link</span>
                <input
                  value={shareUrl}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-[#fbfdfb] px-3 text-sm outline-none"
                  aria-label="Shareable job link"
                />
              </label>
              <button
                type="button"
                onClick={copyJobLink}
                className="self-end rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent-blue)] transition hover:border-[var(--accent-blue)]"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={openNativeShare}
                className="self-end rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--accent-blue)] transition hover:border-[var(--accent-blue)]"
              >
                More options
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">Friends and connections</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {jobShareRecipients.map((recipient) => {
                  const selected = selectedRecipientIds.includes(recipient.id);

                  return (
                    <button
                      key={recipient.id}
                      type="button"
                      onClick={() => toggleRecipient(recipient.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-[var(--accent-blue)] bg-[#eef8f1] shadow-[var(--shadow-soft)]"
                          : "border-[var(--border)] bg-white hover:border-[var(--accent-blue)]"
                      }`}
                      aria-pressed={selected}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-semibold">{recipient.name}</span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                            selected
                              ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                              : "border-[var(--border)] text-transparent"
                          }`}
                          aria-hidden
                        >
                          {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{recipient.title}</p>
                      <p className="mt-2 text-xs font-semibold text-[var(--accent-blue)]">
                        {recipient.relationship}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mb-4 block">
              <span className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Optional note</span>
              <textarea
                value={shareNote}
                onChange={(event) => setShareNote(event.target.value)}
                rows={3}
                placeholder="Add why this job is relevant..."
                className="w-full resize-none rounded-lg border border-[var(--border)] bg-[#fbfdfb] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)] focus:bg-white"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-secondary)]" aria-live="polite">
                {shareStatus || `${selectedRecipientIds.length} selected`}
              </p>
              <button
                type="button"
                onClick={sendShareToRecipients}
                className="rounded-lg bg-[var(--accent-blue)] px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Send to selected
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
