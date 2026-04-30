"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { NicheAccentBar } from "@/components/niche-accent-bar";
import { useUserRole } from "@/context/user-role-context";
import { Creator, ModelingCapability } from "@/lib/types";

const MODELING_CAPABILITIES: ModelingCapability[] = ["Commercial", "Runway", "Editorial"];

function getCapabilityLayoutClass(count: number) {
  if (count === 1) {
    return "grid grid-cols-1";
  }

  if (count === 2) {
    return "grid grid-cols-2";
  }

  return "grid grid-cols-3 gap-0 overflow-hidden rounded bg-[#e8f0ea]";
}

function getCapabilityItemClass(count: number, idx: number) {
  const shared =
    "flex min-h-10 items-center justify-center px-2 py-2 text-center text-[12px] font-semibold uppercase leading-tight tracking-[0.08em] text-[var(--text-primary)]";

  if (count === 1) {
    return `${shared} bg-[#f2f7f3]`;
  }

  if (count === 2) {
    return `${shared} bg-[#f2f7f3] ${idx > 0 ? "border-l border-white/80" : ""}`;
  }

  return `${shared} bg-[#f2f7f3] ${idx > 0 ? "border-l border-white/80" : ""}`;
}

type ModelPaneProps = Pick<
  Creator,
  | "id"
  | "name"
  | "credentialNumber"
  | "niche"
  | "location"
  | "slug"
  | "ownerAccountId"
  | "headshotImage"
  | "fullBodyImages"
  | "race"
  | "gender"
  | "modelingCapabilities"
>;

type ModelPaneDraftData = {
  name?: string;
  location?: string;
  headshotImage?: string | null;
  fullBodyImages?: string[];
  race?: string;
  gender?: string;
  modelingCapabilities?: ModelingCapability[];
};

export function ModelPane({
  id,
  name,
  credentialNumber,
  niche,
  location,
  slug,
  ownerAccountId,
  headshotImage,
  fullBodyImages = [],
  race = "Chinese",
  gender = "Female",
  modelingCapabilities = MODELING_CAPABILITIES,
}: ModelPaneProps) {
  const { account } = useUserRole();
  const ownsCreator =
    Boolean(account?.id && ownerAccountId && account.id === ownerAccountId) ||
    Boolean(account?.creatorSlug && account.creatorSlug === slug);
  const draftAccountId = ownsCreator ? account?.id : undefined;
  const shouldLoadLatestCreatorDraft = !ownsCreator;
  const [paneDraft, setPaneDraft] = useState<ModelPaneDraftData | null>(null);
  const resolvedName = paneDraft?.name ?? name;
  const resolvedLocation = paneDraft?.location ?? location;
  const resolvedHeadshotImage = paneDraft?.headshotImage ?? headshotImage;
  const resolvedFullBodyImages = paneDraft?.fullBodyImages ?? fullBodyImages;
  const resolvedRace = paneDraft?.race ?? race;
  const resolvedGender = paneDraft?.gender ?? gender;
  const resolvedModelingCapabilities = paneDraft?.modelingCapabilities ?? modelingCapabilities;
  const activeModelingCapabilities = MODELING_CAPABILITIES.filter((capability) =>
    resolvedModelingCapabilities.includes(capability),
  );
  const capabilityCount = activeModelingCapabilities.length;

  useEffect(() => {
    if (!draftAccountId && !shouldLoadLatestCreatorDraft) return;

    let cancelled = false;
    const searchParams = new URLSearchParams({
      creatorId: id,
      template: "model-pane",
    });
    if (draftAccountId) {
      searchParams.set("accountId", draftAccountId);
    } else {
      searchParams.set("latestForCreator", "true");
    }

    async function loadPaneDraft() {
      const response = await fetch(`/api/drafts?${searchParams.toString()}`);
      const result = (await response.json()) as { draft?: { data?: ModelPaneDraftData } | null };

      if (!cancelled && result.draft?.data) {
        setPaneDraft(result.draft.data);
      }
    }

    void loadPaneDraft();

    return () => {
      cancelled = true;
    };
  }, [draftAccountId, id, shouldLoadLatestCreatorDraft]);

  return (
    <Link
      href={`/creator/${slug}`}
      className="card-surface group block overflow-hidden border-[var(--border)] bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#c4d7c9] hover:shadow-[0_18px_36px_rgba(16,33,24,0.12)]"
    >
      <NicheAccentBar niche={niche} />
      <div className="space-y-4 p-4">
        <p className="editorial-kicker">Talent - Model</p>
        <div className="grid h-[clamp(104px,8vw,124px)] w-full grid-cols-[0.9fr_repeat(4,minmax(0,0.62fr))] overflow-hidden rounded-xl bg-[#f8faf8]">
          <div className="relative h-full min-w-0 overflow-hidden bg-gradient-to-br from-[#cad7ce] via-[#e1e9e3] to-[#f4f8f5]">
            {resolvedHeadshotImage ? (
              <Image
                src={resolvedHeadshotImage}
                alt={`${resolvedName} headshot`}
                fill
                sizes="140px"
                quality={100}
                unoptimized
                className="object-cover object-[50%_24%]"
              />
            ) : null}
          </div>
          {Array.from({ length: 4 }).map((_, idx) => {
            const image = resolvedFullBodyImages[idx];

            return (
              <div
                key={`fullbody-${idx}`}
                className="relative h-full min-w-0 overflow-hidden bg-white"
              >
                {image ? (
                  <Image
                    src={image}
                    alt={`${resolvedName} full body ${idx + 1}`}
                    fill
                    sizes="80px"
                    quality={100}
                    unoptimized
                    className="object-cover object-[50%_4%]"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="space-y-1.5 text-sm">
          <p className="text-[1.2rem] font-bold leading-tight">{resolvedName}</p>
          <p className="credential-font text-[10px] tracking-[0.1em] text-[var(--text-secondary)]">{credentialNumber}</p>
          <p className="text-[var(--text-secondary)]">{resolvedLocation}</p>
          <div className="grid grid-cols-2 gap-1 pt-1 text-xs">
            <p className="rounded bg-[#f2f7f3] px-2 py-2 text-center text-[12px] font-semibold uppercase leading-tight tracking-[0.08em]">
              <span className="text-[var(--text-secondary)]">Race - </span>
              <span className="text-[var(--text-primary)]">{resolvedRace}</span>
            </p>
            <p className="rounded bg-[#f2f7f3] px-2 py-2 text-center text-[12px] font-semibold uppercase leading-tight tracking-[0.08em]">
              <span className="text-[var(--text-secondary)]">Gender - </span>
              <span className="text-[var(--text-primary)]">{resolvedGender}</span>
            </p>
            <div className={`col-span-2 overflow-hidden rounded bg-[#e8f0ea] ${getCapabilityLayoutClass(capabilityCount)}`}>
              {activeModelingCapabilities.map((capability, idx) => (
                <span key={capability} className={getCapabilityItemClass(capabilityCount, idx)}>
                  {capability}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-blue)]">Open Talent Card</p>
      </div>
    </Link>
  );
}
