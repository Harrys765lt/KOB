export type JobShareRecipient = {
  id: string;
  threadId: string;
  name: string;
  title: string;
  relationship: "Friend" | "Connection";
  avatar?: string;
};

export type StoredJobShare = {
  id: string;
  jobId: string;
  recipientId: string;
  note: string;
  createdAt: string;
};

export const JOB_SHARE_STORAGE_KEY = "boxin_job_shares";

export const jobShareRecipients: JobShareRecipient[] = [
  {
    id: "aina-razak",
    threadId: "thread-aina",
    name: "Aina Razak",
    title: "Food creator - Penang",
    relationship: "Friend",
    avatar: "/Model 1/office 1.jpg",
  },
  {
    id: "kai-lim",
    threadId: "thread-kai",
    name: "Kai Lim",
    title: "Fashion model - JB",
    relationship: "Connection",
    avatar: "/Model 1/sea 8.jpg",
  },
  {
    id: "yana-idris",
    threadId: "thread-yana",
    name: "Yana Idris",
    title: "Lifestyle creator - KL",
    relationship: "Friend",
    avatar: "/Model 1/nature col 4.jpg",
  },
];

export function createJobShareUrl(jobId: string, origin?: string) {
  const path = `/job-sniper/${jobId}`;

  if (!origin) {
    return path;
  }

  return `${origin}${path}`;
}
