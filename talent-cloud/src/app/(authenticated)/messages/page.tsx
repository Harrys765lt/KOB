"use client";

import type { FormEvent } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserRole } from "@/context/user-role-context";
import { JOB_SHARE_STORAGE_KEY, jobShareRecipients } from "@/lib/job-sharing";
import type { StoredJobShare } from "@/lib/job-sharing";
import { mockJobs } from "@/lib/mock-data";

type ThreadMessage = {
  id: string;
  sender: "me" | "them";
  body: string;
  sentAt: string;
  sharedJobId?: string;
};

type MessageThread = {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  profileHref: string;
  status: string;
  lastSeen: string;
  unreadCount: number;
  messages: ThreadMessage[];
};

const starterThreads: MessageThread[] = [
  {
    id: "thread-aina",
    name: "Aina Razak",
    title: "Food creator - Penang",
    avatar: "/Model 1/office 1.jpg",
    profileHref: "/creator/aina-razak",
    status: "Open to job swaps",
    lastSeen: "12:44 PM",
    unreadCount: 2,
    messages: [
      {
        id: "aina-1",
        sender: "them",
        body: "Want to swap rates for the Urban Bite shortlist?",
        sentAt: "12:38 PM",
        sharedJobId: "job-002",
      },
      {
        id: "aina-2",
        sender: "me",
        body: "Yes. I saved that one too. Their approval cycle looks a little slow.",
        sentAt: "12:41 PM",
      },
      {
        id: "aina-3",
        sender: "them",
        body: "I can share my notes after my call. The brief seems flexible if we pitch it as a bundle.",
        sentAt: "12:44 PM",
      },
    ],
  },
  {
    id: "thread-kai",
    name: "Kai Lim",
    title: "Fashion model - JB",
    avatar: "/Model 1/sea 8.jpg",
    profileHref: "/creator/kai-lim",
    status: "Usually replies in 1 hr",
    lastSeen: "10:18 AM",
    unreadCount: 0,
    messages: [
      {
        id: "kai-1",
        sender: "them",
        body: "I can introduce you to the stylist on Threadline.",
        sentAt: "10:18 AM",
        sharedJobId: "job-003",
      },
      {
        id: "kai-2",
        sender: "me",
        body: "Please do. I want to ask about exclusivity before sending final rates.",
        sentAt: "10:22 AM",
      },
    ],
  },
  {
    id: "thread-yana",
    name: "Yana Idris",
    title: "Lifestyle creator - KL",
    avatar: "/Model 1/nature col 4.jpg",
    profileHref: "/creator/yana-idris",
    status: "Shared brief notes",
    lastSeen: "Yesterday",
    unreadCount: 1,
    messages: [
      {
        id: "yana-1",
        sender: "them",
        body: "Shared the brief notes from last season in chat.",
        sentAt: "Yesterday",
      },
      {
        id: "yana-2",
        sender: "them",
        body: "The brand was easy to work with, but make sure payout dates are written clearly.",
        sentAt: "Yesterday",
      },
    ],
  },
  {
    id: "thread-marcus",
    name: "Marcus Thorne",
    title: "Recruiter - Luxe Skincare Co.",
    avatar: "/Model 1/office 6.jpg",
    profileHref: "/job-sniper/job-001",
    status: "Brand representative",
    lastSeen: "Mon",
    unreadCount: 0,
    messages: [
      {
        id: "marcus-1",
        sender: "them",
        body: "We liked your nighttime skincare content and would like to discuss availability.",
        sentAt: "Mon",
        sharedJobId: "job-001",
      },
    ],
  },
  {
    id: "thread-alyssa",
    name: "Alyssa Teh",
    title: "Marketing Lead - Urban Bite",
    avatar: "/Model 1/office 3.jpg",
    profileHref: "/job-sniper/job-002",
    status: "Brand representative",
    lastSeen: "New",
    unreadCount: 0,
    messages: [
      {
        id: "alyssa-1",
        sender: "them",
        body: "Happy to answer questions about the seasonal menu launch.",
        sentAt: "New",
        sharedJobId: "job-002",
      },
    ],
  },
  {
    id: "thread-irfan",
    name: "Irfan Malik",
    title: "Partnership Manager - Threadline Studio",
    avatar: "/Model 1/office 8.jpg",
    profileHref: "/job-sniper/job-003",
    status: "Brand representative",
    lastSeen: "New",
    unreadCount: 0,
    messages: [
      {
        id: "irfan-1",
        sender: "them",
        body: "Send over any fit, styling, or exclusivity questions before you pitch.",
        sentAt: "New",
        sharedJobId: "job-003",
      },
    ],
  },
];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRateRange(min: number, max: number) {
  return `RM${min.toLocaleString()} - RM${max.toLocaleString()}`;
}

function readPersistedJobShares() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const shares = JSON.parse(window.localStorage.getItem(JOB_SHARE_STORAGE_KEY) ?? "[]");
    return Array.isArray(shares) ? (shares as StoredJobShare[]) : [];
  } catch {
    return [];
  }
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedThreadId = searchParams.get("thread");
  const initialThreadId =
    requestedThreadId && starterThreads.some((thread) => thread.id === requestedThreadId)
      ? requestedThreadId
      : starterThreads[0]?.id ?? "";
  const { account, role, isHydrated } = useUserRole();
  const [threads, setThreads] = useState(starterThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (role === "unauthenticated") {
      router.replace("/login");
    }
  }, [isHydrated, role, router]);

  useEffect(() => {
    if (!isHydrated || role === "unauthenticated") {
      return;
    }

    const storedShares = readPersistedJobShares();
    if (storedShares.length === 0) {
      return;
    }

    queueMicrotask(() => {
      setThreads((currentThreads) =>
        currentThreads.map((thread) => {
          const existingMessageIds = new Set(thread.messages.map((message) => message.id));
          const sharesForThread = storedShares.filter((share) => {
            const recipient = jobShareRecipients.find((item) => item.id === share.recipientId);
            return recipient?.threadId === thread.id && !existingMessageIds.has(share.id);
          });

          if (sharesForThread.length === 0) {
            return thread;
          }

          const shareMessages: ThreadMessage[] = sharesForThread.flatMap((share) => {
            const job = mockJobs.find((item) => item.id === share.jobId);
            if (!job) {
              return [];
            }

            return [
              {
                id: share.id,
                sender: "me",
                body: share.note
                  ? `Shared ${job.brandName}: ${share.note}`
                  : `Shared ${job.brandName} for you to review.`,
                sentAt: "Now",
                sharedJobId: job.id,
              },
            ];
          });

          if (shareMessages.length === 0) {
            return thread;
          }

          return {
            ...thread,
            lastSeen: "Now",
            messages: [...thread.messages, ...shareMessages],
          };
        }),
      );
    });
  }, [isHydrated, role]);

  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return threads;
    }

    return threads.filter((thread) =>
      [thread.name, thread.title, thread.status, thread.messages.at(-1)?.body]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, threads]);

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[0];

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = messageDraft.trim();
    if (!body || !selectedThread) {
      return;
    }

    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === selectedThread.id
          ? {
              ...thread,
              lastSeen: "Now",
              messages: [
                ...thread.messages,
                {
                  id: `manual-${Date.now()}`,
                  sender: "me",
                  body,
                  sentAt: "Now",
                },
              ],
            }
          : thread,
      ),
    );
    setMessageDraft("");
  };

  const shareJob = (jobId: string) => {
    if (!selectedThread) {
      return;
    }

    const job = mockJobs.find((item) => item.id === jobId);
    if (!job) {
      return;
    }

    setThreads((currentThreads) =>
      currentThreads.map((thread) =>
        thread.id === selectedThread.id
          ? {
              ...thread,
              lastSeen: "Now",
              messages: [
                ...thread.messages,
                {
                  id: `shared-${job.id}-${Date.now()}`,
                  sender: "me",
                  body: `Shared ${job.brandName} for you to review.`,
                  sentAt: "Now",
                  sharedJobId: job.id,
                },
              ],
            }
          : thread,
      ),
    );
    setIsShareMenuOpen(false);
  };

  if (!isHydrated || role === "unauthenticated") {
    return null;
  }

  return (
    <div className="grid min-h-[calc(100vh-56px)] overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--shadow)] lg:grid-cols-[360px_1fr]">
      <aside className="border-b border-[var(--border)] bg-[#f7faf8] lg:border-b-0 lg:border-r">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="editorial-kicker">Messages</p>
              <h1 className="truncate text-2xl font-bold">{account?.name ?? "Inbox"}</h1>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-lg font-bold text-[var(--accent-blue)] transition hover:-translate-y-0.5 hover:border-[var(--accent-blue)]"
              aria-label="Start new message"
            >
              +
            </button>
          </div>

          <label className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 text-sm text-[var(--text-secondary)]">
            <span aria-hidden>Search</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--text-secondary)]"
              placeholder="Search people, jobs, or notes"
              aria-label="Search messages"
            />
          </label>
        </div>

        <div className="flex items-center justify-between border-y border-[var(--border)] px-4 py-3">
          <p className="font-semibold">Chats</p>
          <button type="button" className="text-sm font-semibold text-[var(--accent-blue)]">
            Requests
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2 lg:max-h-[calc(100vh-220px)]">
          {filteredThreads.map((thread) => {
            const latest = thread.messages.at(-1);
            const active = selectedThread?.id === thread.id;

            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                  active
                    ? "bg-white shadow-[inset_0_0_0_1px_var(--border),0_12px_24px_rgba(16,33,24,0.06)]"
                    : "hover:bg-white/80"
                }`}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#e7f0ea]">
                  {thread.avatar ? (
                    <Image src={thread.avatar} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--accent-blue)]">
                      {getInitials(thread.name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{thread.name}</p>
                    <span className="shrink-0 text-xs text-[var(--text-secondary)]">{thread.lastSeen}</span>
                  </div>
                  <p className="truncate text-xs text-[var(--text-secondary)]">{latest?.body}</p>
                </div>
                {thread.unreadCount ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-blue)] px-1.5 text-xs font-bold text-white">
                    {thread.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-[620px] flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f4faf6_100%)]">
        {selectedThread ? (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-white/82 px-5 py-4 backdrop-blur">
              <Link
                href={selectedThread.profileHref}
                className="flex min-w-0 items-center gap-3 rounded-xl pr-3 transition hover:bg-[#f2f8f4]"
                title={`Open ${selectedThread.name} profile`}
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#e7f0ea]">
                  {selectedThread.avatar ? (
                    <Image src={selectedThread.avatar} alt="" fill sizes="44px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--accent-blue)]">
                      {getInitials(selectedThread.name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{selectedThread.name}</p>
                  <p className="truncate text-xs text-[var(--text-secondary)]">{selectedThread.status}</p>
                </div>
              </Link>
              <Link
                href={selectedThread.profileHref}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--accent-blue)] transition hover:border-[var(--accent-blue)]"
              >
                View profile
              </Link>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-8">
              {selectedThread.messages.map((message) => {
                const job = message.sharedJobId ? mockJobs.find((item) => item.id === message.sharedJobId) : undefined;
                const fromMe = message.sender === "me";

                return (
                  <div key={message.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[min(680px,88%)] space-y-2 ${fromMe ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm shadow-[var(--shadow-soft)] ${
                          fromMe
                            ? "rounded-br-md bg-[var(--accent-blue)] text-white"
                            : "rounded-bl-md border border-[var(--border)] bg-white text-[var(--text-primary)]"
                        }`}
                      >
                        <p>{message.body}</p>
                        <p className={`mt-2 text-[11px] ${fromMe ? "text-white/72" : "text-[var(--text-secondary)]"}`}>
                          {message.sentAt}
                        </p>
                      </div>

                      {job ? (
                        <Link
                          href={`/job-sniper/${job.id}`}
                          className="block rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-soft)] transition hover:border-[var(--accent-blue)]"
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="editorial-kicker">Shared Job</p>
                              <p className="font-semibold">{job.brandName}</p>
                            </div>
                            <span className="rounded-full bg-[#eef4ef] px-2 py-1 text-xs font-semibold text-[var(--accent-blue)]">
                              {job.matchScore}%
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">{job.description}</p>
                          <p className="mt-3 text-xs font-semibold text-[var(--accent-blue)]">
                            {job.niche} - {formatRateRange(job.rateRange.min, job.rateRange.max)}
                          </p>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[var(--border)] bg-white p-4">
              {isShareMenuOpen ? (
                <div className="mb-3 grid gap-2 rounded-xl border border-[var(--border)] bg-[#f7faf8] p-3 md:grid-cols-3">
                  {mockJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => shareJob(job.id)}
                      className="rounded-lg border border-[var(--border)] bg-white p-3 text-left transition hover:border-[var(--accent-blue)]"
                    >
                      <p className="font-semibold">{job.brandName}</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{job.niche} - {job.platform}</p>
                      <p className="mt-2 text-xs font-semibold text-[var(--accent-blue)]">
                        {formatRateRange(job.rateRange.min, job.rateRange.max)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsShareMenuOpen((isOpen) => !isOpen)}
                  className="h-11 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--accent-blue)] transition hover:border-[var(--accent-blue)]"
                >
                  Share job
                </button>
                <input
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder={`Message ${selectedThread.name}`}
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[#fbfdfb] px-4 outline-none transition focus:border-[var(--accent-blue)] focus:bg-white"
                />
                <button
                  type="submit"
                  className="h-11 rounded-lg bg-[var(--accent-blue)] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <div>
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-[var(--border)] bg-white text-4xl text-[var(--accent-blue)]">
                +
              </div>
              <h2 className="text-3xl font-bold">Your messages</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Send a message to start sharing jobs.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesContent />
    </Suspense>
  );
}
