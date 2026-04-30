"use client";

import Image from "next/image";
import {
  ChangeEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
  WheelEvent as ReactWheelEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnalyticsCharts,
  createDefaultRateCardItems,
  createDefaultTalentAnalyticsData,
} from "@/components/analytics-chart";
import type { RateCardTextBox, TalentAnalyticsData } from "@/components/analytics-chart";
import {
  DEFAULT_TALENT_SECTION_TEMPLATES,
  resolveTalentSectionTemplates,
  SectionTemplatePicker,
} from "@/components/talent-section-template-picker";
import type { TalentSectionId, TalentSectionTemplateSelection } from "@/components/talent-section-template-picker";
import { useUserRole } from "@/context/user-role-context";
import { BRAND_CATALOG, BrandCatalogEntry, getBrandCatalogEntry, normalizeBrandName } from "@/lib/brand-catalog";
import { Creator, ModelingCapability } from "@/lib/types";

type ModelCardProps = {
  creator: Creator;
  viewer: "creator" | "brand";
  isAdmin?: boolean;
};

type ProfileState = {
  name: string;
  location: string;
  niche: string;
  audience: string;
  contentDescription: string;
  race: string;
  gender: string;
  modelingCapabilities: ModelingCapability[];
};

type BrandMediaItem = {
  id: string;
  type: "image" | "video";
  title: string;
  description?: string;
  src: string | null;
  aspectRatio: number | null;
};

type MediaPreview = {
  src: string;
  title: string;
  description?: string;
  type: BrandMediaItem["type"];
  allowDownload?: boolean;
};

type TalentContentCollection = {
  id: string;
  title: string;
  description: string;
  featureSelectionId?: string | null;
  items: BrandMediaItem[];
};

type BrandCampaignMetrics = {
  totalViews?: number;
  campaignCount?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
};

type BrandCampaignInfo = {
  launched: string;
  theme: string;
  type: string;
};

type BrandMediaCollection = {
  headline: string;
  summary: string;
  items: BrandMediaItem[];
  campaignInfo?: BrandCampaignInfo;
  metrics?: BrandCampaignMetrics;
  collections?: TalentContentCollection[];
  activeCollectionId?: string | null;
};

type SocialLinks = {
  instagram: string;
  tiktok: string;
};

type ModelCardDraftData = {
  profile?: Partial<ProfileState>;
  cardTypeLabel?: string;
  headshotImage?: string | null;
  showcaseImage?: string | null;
  cardPlaceholderImage?: string | null;
  socialLinks?: SocialLinks;
  brands?: string[];
  talentContentWall?: BrandMediaCollection;
  brandMediaCollections?: Record<string, BrandMediaCollection>;
  brandFeatureSelectionByBrand?: Record<string, string | null>;
  talentFeatureSelectionId?: string | null;
  sectionTemplates?: TalentSectionTemplateSelection;
  dataNotes?: string;
  analyticsData?: TalentAnalyticsData;
  rateCardItems?: RateCardTextBox[];
};

const MODELING_CAPABILITIES: ModelingCapability[] = ["Commercial", "Runway", "Editorial"];
const BRAND_CAROUSEL_PAUSE_MS = 20000;
const BRAND_CAROUSEL_SPEED_PX_PER_MS = 0.02;
const BRAND_CAROUSEL_WHEEL_LINE_PX = 24;
const BRAND_CAROUSEL_WHEEL_ACCELERATION = 0.012;
const BRAND_CAROUSEL_WHEEL_DAMPING_PER_MS = 0.009;
const BRAND_CAROUSEL_WHEEL_MAX_VELOCITY = 3.2;
const BRAND_CAROUSEL_WHEEL_STOP_THRESHOLD = 0.02;
const HIGHLIGHT_WINDOWS_PAUSE_MS = 20000;
const HIGHLIGHT_WINDOWS_SPEED_PX_PER_MS = 0.028;
const HIGHLIGHT_WINDOWS_WHEEL_ACCELERATION = 0.009;
const HIGHLIGHT_WINDOWS_WHEEL_DAMPING_PER_MS = 0.012;
const HIGHLIGHT_WINDOWS_WHEEL_MAX_VELOCITY = 2.4;
const HIGHLIGHT_WINDOWS_WHEEL_STOP_THRESHOLD = 0.015;
const HIGHLIGHT_SIDE_TILE_HEIGHT_PX = 238;
const HIGHLIGHT_SIDE_TILE_MIN_RATIO = 3 / 4;
const HIGHLIGHT_SIDE_TILE_MAX_RATIO = 1;
const HIGHLIGHT_WINDOWS_COLLAPSED_HEIGHT_PX = HIGHLIGHT_SIDE_TILE_HEIGHT_PX * 2 + 16 + 24;
const FEATURED_MEDIA_MIN_RATIO = 9 / 16;
const FEATURED_MEDIA_MAX_RATIO = 16 / 9;
const FEATURED_MEDIA_MIN_MAX_WIDTH_PX = 380;
const FEATURED_MEDIA_MAX_MAX_WIDTH_PX = 920;
const FEATURED_MEDIA_VIEWPORT_EXPAND_TRANSITION_MS = 760;
const FEATURED_MEDIA_VIEWPORT_SHRINK_TRANSITION_MS = 980;
const TALENT_WALL_SIDE_TILE_ASPECT_RATIO = 4 / 5;
const TALENT_WALL_WINDOWS_GAP_PX = 16;
const TALENT_WALL_WINDOWS_PADDING_X_PX = 24;
const TALENT_WALL_WINDOWS_PADDING_Y_PX = 24;
const TALENT_WALL_WINDOWS_FALLBACK_HEIGHT_PX = 860;

function createDefaultProfile(creator: Creator): ProfileState {
  return {
    name: creator.name,
    location: creator.location,
    niche: creator.niche,
    audience: creator.audience,
    contentDescription: creator.contentDescription,
    race: creator.race ?? "Chinese",
    gender: creator.gender ?? "Female",
    modelingCapabilities: creator.modelingCapabilities ?? MODELING_CAPABILITIES,
  };
}

function normalizeProfileDraft(creator: Creator, draftProfile?: Partial<ProfileState>): ProfileState {
  const defaultProfile = createDefaultProfile(creator);
  const draftCapabilities = draftProfile?.modelingCapabilities;

  return {
    ...defaultProfile,
    ...draftProfile,
    modelingCapabilities:
      Array.isArray(draftCapabilities) && draftCapabilities.length > 0
        ? draftCapabilities
        : defaultProfile.modelingCapabilities,
  };
}

function createDefaultSocialLinks(handle: string): SocialLinks {
  const normalizedHandle = handle.replace(/^@/, "");

  return {
    instagram: `https://www.instagram.com/${normalizedHandle}`,
    tiktok: `https://www.tiktok.com/@${normalizedHandle}`,
  };
}

function normalizeSocialHref(href: string) {
  const trimmed = href.trim();

  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `https://${trimmed}`;
}

function stringifyDraft(data: ModelCardDraftData) {
  return JSON.stringify(data);
}

function formatMetricValue(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatEngagementRate(value: number) {
  return `${value.toFixed(2).replace(/\.?0+$/, "")}%`;
}

function parseOptionalMetric(value: string) {
  if (value.trim() === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function ViewportEditControls({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-20 grid gap-2" onClick={(event) => event.stopPropagation()}>
      {children}
    </div>
  );
}

const viewportEditControlClassName =
  "block w-full cursor-pointer rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#5e5548] shadow-[0_10px_24px_rgba(30,35,29,0.14)] backdrop-blur transition hover:bg-white";

function getDownloadFileName(title: string, src: string) {
  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const dataUrlExtension = src.match(/^data:(?:image|video)\/([a-z0-9+.-]+);/i)?.[1]?.replace("jpeg", "jpg");
  const pathExtension = src.split("?")[0]?.match(/\.([a-z0-9]+)$/i)?.[1];
  const extension = dataUrlExtension || pathExtension || "jpg";

  return `${normalizedTitle || "talent-showcase-image"}.${extension}`;
}

function MediaPreviewDialog({ media, onClose }: { media: MediaPreview; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07100b]/88 px-3 py-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`${media.title} preview`}
      onClick={onClose}
    >
      <div
        className="relative flex h-[calc(100vh-2rem)] w-full max-w-[min(1600px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-white/18 bg-[#101a13] shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 px-4 py-3 text-white sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{media.title}</p>
            {media.description ? <p className="mt-1 line-clamp-1 text-xs text-white/62">{media.description}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {media.allowDownload ? (
              <a
                href={media.src}
                download={getDownloadFileName(media.title, media.src)}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/18"
              >
                Download
              </a>
            ) : null}
            <a
              href={media.src}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/18"
            >
              Open
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl leading-none text-white transition hover:bg-white/18"
              aria-label="Close image preview"
            >
              x
            </button>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/28">
          {media.type === "image" ? (
            <Image src={media.src} alt={media.title} fill sizes="100vw" className="object-contain" priority />
          ) : (
            <video src={media.src} className="h-full w-full object-contain" controls autoPlay playsInline />
          )}
        </div>
      </div>
    </div>
  );
}

function SocialCredentialRow({
  credentialNumber,
  isEditView,
  socialLinks,
  onSocialLinkChange,
}: {
  credentialNumber: string;
  isEditView: boolean;
  socialLinks: SocialLinks;
  onSocialLinkChange: (platform: keyof SocialLinks, value: string) => void;
}) {
  const socialItems = [
    {
      label: "Instagram",
      href: normalizeSocialHref(socialLinks.instagram),
      icon: "/Icons/instagram-icon.png",
      platform: "instagram" as const,
    },
    {
      label: "TikTok",
      href: normalizeSocialHref(socialLinks.tiktok),
      icon: "/Icons/tiktok-icon.png",
      platform: "tiktok" as const,
    },
  ];

  return (
    <div className="credential-font flex w-full items-center justify-between gap-4 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm tracking-[0.16em] text-slate-900 shadow-[var(--shadow-soft)]">
      <span className="min-w-0 truncate">{credentialNumber}</span>
      {isEditView ? (
        <div className="grid min-w-[280px] max-w-[430px] flex-1 grid-cols-2 gap-2">
          {socialItems.map((social) => (
            <input
              key={social.label}
              value={socialLinks[social.platform]}
              onChange={(event) => onSocialLinkChange(social.platform, event.target.value)}
              aria-label={`${social.label} URL`}
              placeholder={`${social.label} URL`}
              className="min-w-0 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] tracking-[0.04em] text-slate-900 outline-none transition focus:border-[var(--accent-blue)]"
            />
          ))}
        </div>
      ) : (
        <div className="grid w-24 shrink-0 grid-cols-2 place-items-center gap-4">
          {socialItems.map((social) =>
            social.href ? (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${social.label} profile`}
                title={`${social.label} profile`}
                className="relative h-5 w-5 rounded-full transition hover:scale-105"
              >
                <Image src={social.icon} alt="" fill sizes="20px" className="object-contain" />
              </a>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

function toWheelPixels(delta: number, deltaMode: number, viewportWidth: number) {
  if (deltaMode === 1) {
    return delta * BRAND_CAROUSEL_WHEEL_LINE_PX;
  }

  if (deltaMode === 2) {
    return delta * viewportWidth;
  }

  return delta;
}

type BrandVisual = {
  name: string;
  logoPath?: string;
  monogram: string;
  category: string;
  accent: string;
  surface: string;
  badge: string;
  ink: string;
};

function buildBrandVisual(brand: string): BrandVisual {
  const catalogEntry = getBrandCatalogEntry(brand);

  if (catalogEntry) {
    return catalogEntry;
  }

  const monogram = brand
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return {
    name: brand,
    monogram: monogram || "BR",
    category: "Custom Brand",
    accent: "#6a7a71",
    surface: "linear-gradient(135deg, #f7f6f2 0%, #ece7de 100%)",
    badge: "linear-gradient(135deg, #5d6e65 0%, #8ea096 100%)",
    ink: "#f8fbf8",
  };
}

function BrandMark({
  visual,
  size = "large",
}: {
  visual: BrandVisual;
  size?: "hero" | "large" | "small";
}) {
  const [showFallback, setShowFallback] = useState(!visual.logoPath);

  const containerClassName =
    size === "hero"
      ? "h-44 w-full max-w-[250px] rounded-[2.25rem] text-[1.8rem] tracking-[0.22em]"
      : size === "large"
        ? "h-12 w-12 rounded-2xl text-sm tracking-[0.16em]"
        : "h-8 w-8 rounded-full text-[0.65rem] tracking-[0.12em]";

  if (showFallback) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center border font-black uppercase ${containerClassName}`}
        style={{
          background: visual.badge,
          borderColor: visual.accent,
          color: visual.ink,
        }}
      >
        {visual.monogram}
      </div>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border bg-white ${containerClassName}`}
      style={{ borderColor: visual.accent }}
    >
      <Image
        src={visual.logoPath!}
        alt={`${visual.name} logo`}
        fill
        sizes={size === "hero" ? "250px" : size === "large" ? "48px" : "32px"}
        className={size === "hero" ? "object-contain p-1" : "object-contain p-1.5"}
        onError={() => setShowFallback(true)}
      />
    </div>
  );
}

function BrandSelectionButton({
  brand,
  active,
  onClick,
}: {
  brand: string;
  active: boolean;
  onClick: () => void;
}) {
  const visual = buildBrandVisual(brand);

  return (
    <button
      onClick={onClick}
      data-brand-carousel-item
      className={`flex min-h-[248px] w-[252px] shrink-0 snap-start flex-col items-center justify-between rounded-[28px] border px-3 py-3 text-center transition sm:w-[276px] ${
        active
          ? "shadow-[0_18px_36px_rgba(47,127,95,0.18)]"
          : "bg-white hover:-translate-y-1 hover:shadow-[0_14px_26px_rgba(16,33,24,0.1)]"
      }`}
      style={{
        background: active ? visual.surface : "white",
        borderColor: active ? visual.accent : "var(--border)",
      }}
    >
      <div className="flex w-full justify-center">
        <BrandMark visual={visual} size="hero" />
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-base font-semibold text-[var(--text-primary)]">{visual.name}</p>
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          {visual.category}
        </p>
      </div>
      <span
        className={`mt-3 rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] ${
          active ? "bg-white/80 text-[#234b38]" : "bg-[#f3f7f4] text-[var(--text-secondary)]"
        }`}
      >
        {active ? "Selected" : "Open"}
      </span>
    </button>
  );
}

function SelectedBrandTag({
  brand,
  onRemove,
}: {
  brand: string;
  onRemove: () => void;
}) {
  const visual = buildBrandVisual(brand);

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[#f6faf7] px-3 py-2">
      <BrandMark visual={visual} size="small" />
      <div>
        <p className="text-xs font-semibold text-[var(--text-primary)]">{visual.name}</p>
        <p className="text-[0.6rem] uppercase tracking-[0.14em] text-[var(--text-secondary)]">{visual.category}</p>
      </div>
      <button
        onClick={onRemove}
        className="rounded-full px-1.5 py-1 text-[var(--text-secondary)] transition hover:bg-[#dce9df] hover:text-[#2d4638]"
        aria-label={`Remove ${brand}`}
      >
        x
      </button>
    </div>
  );
}

function BrandLibraryCard({
  entry,
  onAdd,
}: {
  entry: BrandCatalogEntry;
  onAdd: () => void;
}) {
  return (
    <button
      onClick={onAdd}
      className="rounded-2xl border border-[var(--border)] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#bfd1c4] hover:shadow-[0_14px_26px_rgba(16,33,24,0.08)]"
      style={{ background: entry.surface }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandMark visual={entry} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{entry.name}</p>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--text-secondary)]">{entry.category}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#305d49]">
          Add
        </span>
      </div>
    </button>
  );
}

function SectionHeader({ title, kicker }: { title: string; kicker: string }) {
  return (
    <div>
      <p className="editorial-kicker">{kicker}</p>
      <h2 className="text-4xl font-bold text-[#174d38] md:text-5xl">{title}</h2>
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function imageToDataUrl(
  event: ChangeEvent<HTMLInputElement>,
  setTarget: (value: string | null) => void
) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      setTarget(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

function getImageAspectRatio(file: File) {
  return new Promise<number | null>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      const ratio = image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : null;
      URL.revokeObjectURL(objectUrl);
      resolve(ratio);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    image.src = objectUrl;
  });
}

function getVideoAspectRatio(file: File) {
  return new Promise<number | null>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const ratio = video.videoHeight > 0 ? video.videoWidth / video.videoHeight : null;
      cleanup();
      resolve(ratio);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
    video.src = objectUrl;
  });
}

async function getFileAspectRatio(file: File) {
  if (file.type.startsWith("image/")) {
    return getImageAspectRatio(file);
  }

  if (file.type.startsWith("video/")) {
    return getVideoAspectRatio(file);
  }

  return null;
}

function getDefaultMediaDescription(title: string, type: BrandMediaItem["type"]) {
  const normalizedTitle = normalizeBrandName(title);
  const talentDefaults: Record<string, string> = {
    "signature reel": "A featured reel for reviewing movement, pacing, and on-camera presence.",
    "editorial still 01": "A full-body editorial frame for casting teams to review styling, posture, and camera presence.",
    "lifestyle still 02": "A softer lifestyle frame showing range beyond studio-led campaign imagery.",
    "campaign cutdown": "A short-form edit that highlights movement, pacing, and brand-ready delivery.",
    "behind-the-scenes 03": "A candid production moment that adds texture to the talent showcase.",
  };

  return (
    talentDefaults[normalizedTitle] ??
    `A featured ${type} highlight for reviewing this talent's visual style and campaign fit.`
  );
}

function createMediaItem(
  id: string,
  type: BrandMediaItem["type"],
  title: string,
  description = getDefaultMediaDescription(title, type)
): BrandMediaItem {
  return { id, type, title, description, src: null, aspectRatio: null };
}

function createDefaultBrandCampaignInfo(brand: string): BrandCampaignInfo {
  return {
    launched: "Q2 2026",
    theme: `${brand} creator launch`,
    type: "",
  };
}

function getBrandCampaignInfo(collection: BrandMediaCollection, brand: string): BrandCampaignInfo {
  return {
    ...createDefaultBrandCampaignInfo(brand),
    ...collection.campaignInfo,
  };
}

function normalizeMediaItems(items: BrandMediaItem[]) {
  return items.map((item) => ({
    ...item,
    description: item.description ?? getDefaultMediaDescription(item.title, item.type),
  }));
}

function createTalentCollection(
  id: string,
  title: string,
  description: string,
  items: BrandMediaItem[],
  featureSelectionId: string | null = null
): TalentContentCollection {
  return {
    id,
    title,
    description,
    featureSelectionId,
    items: normalizeMediaItems(items),
  };
}

function normalizeMediaCollection(collection: BrandMediaCollection): BrandMediaCollection {
  const normalizedItems = normalizeMediaItems(collection.items);
  const collections =
    collection.collections && collection.collections.length > 0
      ? collection.collections.map((entry, index) =>
          createTalentCollection(
            entry.id || `talent-collection-${index + 1}`,
            entry.title || entry.items[0]?.title || collection.headline,
            entry.description || entry.items[0]?.description || collection.summary,
            entry.items.length > 0 ? entry.items : normalizedItems,
            entry.featureSelectionId ?? null
          )
        )
      : [
          createTalentCollection(
            "talent-collection-default",
            normalizedItems[0]?.title || collection.headline,
            normalizedItems[0]?.description || collection.summary,
            normalizedItems
          ),
        ];
  const activeCollectionId = collections.some((entry) => entry.id === collection.activeCollectionId)
    ? collection.activeCollectionId ?? collections[0]?.id ?? null
    : collections[0]?.id ?? null;

  return {
    ...collection,
    items: normalizedItems,
    metrics: collection.metrics,
    collections,
    activeCollectionId,
  };
}

function createDefaultBrandMediaCollection(brand: string): BrandMediaCollection {
  const normalizedBrand = normalizeBrandName(brand).replace(/\s+/g, "-") || "brand";

  return {
    headline: `${brand} campaign content`,
    summary: `A curated brand-specific wall for ${brand}. Use this space to show reels, stills, and final campaign cuts that prove fit.`,
    campaignInfo: createDefaultBrandCampaignInfo(brand),
    items: [
      createMediaItem(`${normalizedBrand}-hero-video`, "video", "Hero reel"),
      createMediaItem(`${normalizedBrand}-still-01`, "image", "Campaign still 01"),
      createMediaItem(`${normalizedBrand}-still-02`, "image", "Campaign still 02"),
      createMediaItem(`${normalizedBrand}-video-cut`, "video", "Short-form cutdown"),
      createMediaItem(`${normalizedBrand}-still-03`, "image", "Lifestyle still 03"),
    ],
  };
}

function createDefaultTalentContentCollection(name: string): BrandMediaCollection {
  const normalizedName = normalizeBrandName(name).replace(/\s+/g, "-") || "talent";

  return {
    headline: "Talent content wall",
    summary: `A standing showcase of ${name}'s signature content style across formats, moods, and editing approaches.`,
    items: [
      createMediaItem(`${normalizedName}-talent-hero-video`, "video", "Signature reel"),
      createMediaItem(
        `${normalizedName}-talent-still-01`,
        "image",
        "Editorial still 01",
        "A full-body editorial frame for casting teams to review styling, posture, and camera presence."
      ),
      createMediaItem(
        `${normalizedName}-talent-still-02`,
        "image",
        "Lifestyle still 02",
        "A softer lifestyle frame showing range beyond studio-led campaign imagery."
      ),
      createMediaItem(
        `${normalizedName}-talent-video-02`,
        "video",
        "Campaign cutdown",
        "A short-form edit that highlights movement, pacing, and brand-ready delivery."
      ),
      createMediaItem(
        `${normalizedName}-talent-still-03`,
        "image",
        "Behind-the-scenes 03",
        "A candid production moment that adds texture to the talent showcase."
      ),
    ],
  };
}

function createBrandMediaCollections(brands: string[]) {
  return Object.fromEntries(brands.map((brand) => [brand, createDefaultBrandMediaCollection(brand)]));
}

function MediaTypeBadge({ type }: { type: BrandMediaItem["type"] }) {
  return (
    <span className="rounded-full border border-white/60 bg-white/85 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#244735]">
      {type}
    </span>
  );
}

function resolveMediaAspectRatio(item: BrandMediaItem, featured: boolean) {
  const fallbackRatio = featured ? 16 / 9 : 4 / 5;

  if (!item.src || !item.aspectRatio || item.aspectRatio <= 0) {
    return fallbackRatio;
  }

  return Math.min(16 / 9, Math.max(9 / 16, item.aspectRatio));
}

function resolveSideWindowAspectRatio(item: BrandMediaItem) {
  const fallbackRatio = 4 / 5;

  if (!item.src || !item.aspectRatio || item.aspectRatio <= 0) {
    return fallbackRatio;
  }

  return Math.min(HIGHLIGHT_SIDE_TILE_MAX_RATIO, Math.max(HIGHLIGHT_SIDE_TILE_MIN_RATIO, item.aspectRatio));
}

function getSideWindowWidth(item: BrandMediaItem) {
  return Math.round(HIGHLIGHT_SIDE_TILE_HEIGHT_PX * resolveSideWindowAspectRatio(item));
}

function getFeaturedMediaMaxWidthPx(mediaAspectRatio: number) {
  const featuredWidthProgress = Math.min(
    1,
    Math.max(0, (mediaAspectRatio - FEATURED_MEDIA_MIN_RATIO) / (FEATURED_MEDIA_MAX_RATIO - FEATURED_MEDIA_MIN_RATIO))
  );

  return Math.round(
    FEATURED_MEDIA_MIN_MAX_WIDTH_PX +
      featuredWidthProgress * (FEATURED_MEDIA_MAX_MAX_WIDTH_PX - FEATURED_MEDIA_MIN_MAX_WIDTH_PX)
  );
}

function FeaturedMediaCaption({
  title,
  description,
  mediaAspectRatio,
  isEditView,
  onTitleChange,
  onDescriptionChange,
}: {
  title: string;
  description: string;
  mediaAspectRatio: number;
  isEditView: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}) {
  const maxWidth = `${getFeaturedMediaMaxWidthPx(mediaAspectRatio)}px`;

  return (
    <div className="mx-auto grid w-full gap-2" style={{ maxWidth }}>
      {isEditView ? (
        <>
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-base font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-blue)]"
            placeholder="Collection title"
          />
          <textarea
            rows={3}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] outline-none transition focus:border-[var(--accent-blue)]"
            placeholder="Collection description"
          />
        </>
      ) : (
        <>
          <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">
            <p className="text-base font-semibold text-[var(--text-primary)]">{title}</p>
          </div>
          <div className="min-h-[74px] rounded-xl border border-[var(--border)] bg-[#f8fbf9] px-4 py-3">
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              {description.trim() || "Add a description in edit view."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function BrandMediaTile({
  item,
  featured = false,
  showDetails = true,
  selected = false,
  onSelect,
  onMediaOpen,
  forcedAspectRatio,
  cropMedia = false,
  editControls,
}: {
  item: BrandMediaItem;
  featured?: boolean;
  showDetails?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onMediaOpen?: (media: MediaPreview) => void;
  forcedAspectRatio?: number;
  cropMedia?: boolean;
  editControls?: ReactNode;
}) {
  const mediaAspectRatio = forcedAspectRatio ?? resolveMediaAspectRatio(item, featured);
  const isInteractive = Boolean(onSelect);
  const isSideWindow = !featured && typeof forcedAspectRatio === "number";
  const shouldCropMedia = cropMedia || (isSideWindow && item.type === "video");
  const mediaPreview = item.src ? { src: item.src, title: item.title, description: item.description, type: item.type } : null;
  const featuredMaxWidthPx = getFeaturedMediaMaxWidthPx(mediaAspectRatio);
  const tileStyle = featured
    ? {
        aspectRatio: mediaAspectRatio,
        maxWidth: `${featuredMaxWidthPx}px`,
      }
    : { aspectRatio: mediaAspectRatio };

  return (
    <article
      onClick={
        onSelect
          ? (event) => {
              event.stopPropagation();
              onSelect();
            }
          : undefined
      }
      className={`relative overflow-hidden rounded-[28px] border bg-white transition ${
        featured ? "" : "min-h-[200px]"
      } ${featured ? "mx-auto w-full" : "w-full"} ${
        selected ? "border-[#2f7f5f] shadow-[0_0_0_2px_rgba(47,127,95,0.2)]" : "border-[var(--border)]"
      } ${isInteractive ? "cursor-pointer hover:brightness-[1.02]" : ""}`}
      style={tileStyle}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onSelect();
              }
            }
          : undefined
      }
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#09110d_0%,#112018_100%)]" />
      {item.src ? (
        item.type === "image" ? (
          <div className="absolute inset-0">
            {mediaPreview && onMediaOpen ? (
              <button
                type="button"
                aria-label={`Open ${item.title}`}
                className="absolute inset-0 z-10 cursor-zoom-in appearance-none border-0 bg-transparent p-0"
                onClick={(event) => {
                  event.stopPropagation();
                  onMediaOpen(mediaPreview);
                }}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  className={shouldCropMedia ? "object-cover scale-[1.04]" : "object-contain"}
                  sizes={featured ? "50vw" : "25vw"}
                />
              </button>
            ) : (
              <Image
                src={item.src}
                alt={item.title}
                fill
                className={shouldCropMedia ? "object-cover scale-[1.04]" : "object-contain"}
                sizes={featured ? "50vw" : "25vw"}
              />
            )}
          </div>
        ) : (
          <>
            <video
              src={item.src}
              className={`absolute inset-0 h-full w-full ${
                shouldCropMedia ? "object-cover scale-[1.07]" : "object-contain"
              }`}
              muted
              loop
              autoPlay
              playsInline
            />
            {mediaPreview && onMediaOpen ? (
              <button
                type="button"
                aria-label={`Open ${item.title}`}
                className="absolute inset-0 z-10 cursor-zoom-in appearance-none border-0 bg-transparent p-0"
                onClick={(event) => {
                  event.stopPropagation();
                  onMediaOpen(mediaPreview);
                }}
              />
            ) : null}
          </>
        )
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(224,240,229,0.9),rgba(235,241,236,0.72)_45%,rgba(247,249,246,1)_100%)]" />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4">
        <div className="flex items-start justify-between gap-3">
          <MediaTypeBadge type={item.type} />
          <span className="rounded-full bg-[#f4f8f5]/90 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {featured ? "Feature" : "Media"}
          </span>
        </div>
      </div>

      {showDetails ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#102118]/90 via-[#102118]/55 to-transparent px-4 pb-4 pt-16 text-white">
          <p className={`font-semibold ${featured ? "text-lg" : "text-sm"}`}>{item.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/72">
            {item.src ? "Uploaded by talent" : "Awaiting upload"}
          </p>
        </div>
      ) : null}
      {editControls ? <ViewportEditControls>{editControls}</ViewportEditControls> : null}
    </article>
  );
}

function getTalentCollectionFeaturedItem(collection: TalentContentCollection | null) {
  if (!collection || collection.items.length === 0) return null;

  if (collection.featureSelectionId) {
    const selectedItem = collection.items.find((item) => item.id === collection.featureSelectionId);
    if (selectedItem) return selectedItem;
  }

  return collection.items.find((item) => item.type === "video") ?? collection.items[0] ?? null;
}

export function ModelCard({ creator, viewer, isAdmin = false }: ModelCardProps) {
  const { account } = useUserRole();
  const ownsCreator =
    Boolean(account?.id && creator.ownerAccountId && account.id === creator.ownerAccountId) ||
    Boolean(account?.creatorSlug && account.creatorSlug === creator.slug);
  const canEdit = viewer === "creator" && ownsCreator;
  const [editView, setEditView] = useState(false);
  const isEditView = canEdit && editView;
  const brandCarouselViewportRef = useRef<HTMLDivElement>(null);
  const brandCarouselRef = useRef<HTMLDivElement>(null);
  const carouselPausedUntilRef = useRef(0);
  const carouselOffsetRef = useRef(0);
  const carouselWheelVelocityRef = useRef(0);
  const featuredAspectRatioAnimationFrameRef = useRef(0);
  const featuredAspectRatioRef = useRef(4 / 5);
  const highlightFeaturedColumnRef = useRef<HTMLDivElement>(null);
  const highlightWindowsViewportRef = useRef<HTMLDivElement>(null);
  const highlightWindowsTrackRef = useRef<HTMLDivElement>(null);
  const highlightWindowsPausedUntilRef = useRef(0);
  const highlightWindowsOffsetRef = useRef(0);
  const highlightWindowsWheelVelocityRef = useRef(0);
  const highlightViewportHeightRef = useRef(HIGHLIGHT_WINDOWS_COLLAPSED_HEIGHT_PX);
  const talentWallWindowsViewportRef = useRef<HTMLDivElement>(null);
  const talentWallWindowsScrollRef = useRef<HTMLDivElement>(null);
  const talentWallWindowsTrackRef = useRef<HTMLDivElement>(null);
  const editControlDragRef = useRef({
    moved: false,
    pointerId: 0,
    startLeft: 0,
    startTop: 0,
    startX: 0,
    startY: 0,
  });
  const talentCollectionSwipeRef = useRef({
    pointerId: 0,
    startX: 0,
    startY: 0,
  });
  const draggedTalentCollectionIdRef = useRef<string | null>(null);
  const talentCollectionWheelLockedUntilRef = useRef(0);
  const [isXlLayout, setIsXlLayout] = useState(false);
  const [hasScrolledPastHeroStart, setHasScrolledPastHeroStart] = useState(false);
  const [editControlPosition, setEditControlPosition] = useState<{ left: number; top: number } | null>(null);
  const [isEditControlDragging, setIsEditControlDragging] = useState(false);
  const [talentWallViewportHeightPx, setTalentWallViewportHeightPx] = useState(
    TALENT_WALL_WINDOWS_FALLBACK_HEIGHT_PX
  );
  const [showTalentWallScrollHint, setShowTalentWallScrollHint] = useState(false);
  const [highlightViewportHeightPx, setHighlightViewportHeightPx] = useState(
    HIGHLIGHT_WINDOWS_COLLAPSED_HEIGHT_PX
  );
  const [featuredAnimatedAspectRatio, setFeaturedAnimatedAspectRatio] = useState(4 / 5);

  const [profile, setProfile] = useState<ProfileState>(() => createDefaultProfile(creator));
  const [cardTypeLabel, setCardTypeLabel] = useState("Model");

  const [headshotImage, setHeadshotImage] = useState<string | null>(creator.headshotImage ?? null);
  const [showcaseImage, setShowcaseImage] = useState<string | null>(null);
  const [cardPlaceholderImage, setCardPlaceholderImage] = useState<string | null>(() =>
    creator.cardPlaceholderImage ?? (isAdmin ? "/Model 1/1.png" : null)
  );
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => createDefaultSocialLinks(creator.handle));

  const [brands, setBrands] = useState<string[]>(creator.brandsWorkedWith);
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const deferredBrandSearch = useDeferredValue(brandSearch);
  const [talentContentWall, setTalentContentWall] = useState<BrandMediaCollection>(() =>
    normalizeMediaCollection(createDefaultTalentContentCollection(creator.name))
  );
  const [brandMediaCollections, setBrandMediaCollections] = useState<Record<string, BrandMediaCollection>>(() =>
    createBrandMediaCollections(creator.brandsWorkedWith)
  );
  const [brandFeatureSelectionByBrand, setBrandFeatureSelectionByBrand] = useState<Record<string, string | null>>({});
  const [talentFeatureSelectionId, setTalentFeatureSelectionId] = useState<string | null>(null);
  const [sectionTemplates, setSectionTemplates] = useState<Record<TalentSectionId, string>>(
    DEFAULT_TALENT_SECTION_TEMPLATES,
  );

  const [dataNotes, setDataNotes] = useState(
    "Data panel can be filtered by brand selections and content highlights to compare campaign performance trends."
  );
  const [talentAnalyticsData, setTalentAnalyticsData] = useState<TalentAnalyticsData>(() =>
    createDefaultTalentAnalyticsData()
  );
  const [rateCardItems, setRateCardItems] = useState<RateCardTextBox[]>(() => createDefaultRateCardItems());

  const draftAccountId = ownsCreator ? account?.id : undefined;
  const shouldLoadLatestCreatorDraft = !ownsCreator;
  const draftLoadKey = `${draftAccountId ?? (shouldLoadLatestCreatorDraft ? "latest" : "anonymous")}:${creator.id}`;
  const hasLoadedDraftRef = useRef(false);
  const lastSavedDraftRef = useRef("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showExitSavePrompt, setShowExitSavePrompt] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);

  const dataCaption =
    viewer === "creator"
      ? "Data updates as your content and campaigns change."
      : "Brand-view preview of this talent's performance.";

  const activeModelingCapabilities = useMemo(
    () => MODELING_CAPABILITIES.filter((capability) => profile.modelingCapabilities.includes(capability)),
    [profile.modelingCapabilities],
  );
  const modelingCapabilityCount = activeModelingCapabilities.length;

  useEffect(() => {
    hasLoadedDraftRef.current = false;
    lastSavedDraftRef.current = "";
    setHasUnsavedChanges(false);
    setCardTypeLabel("Model");
    setSectionTemplates(resolveTalentSectionTemplates());
  }, [draftLoadKey]);

  useEffect(() => {
    if (!draftAccountId && !shouldLoadLatestCreatorDraft) {
      hasLoadedDraftRef.current = true;
      return;
    }

    let cancelled = false;

    async function loadDraft() {
      const searchParams = new URLSearchParams({
        creatorId: creator.id,
        template: "model-card",
      });
      if (draftAccountId) {
        searchParams.set("accountId", draftAccountId);
      } else {
        searchParams.set("latestForCreator", "true");
      }

      try {
        const response = await fetch(`/api/drafts?${searchParams.toString()}`);
        const result = (await response.json()) as { draft?: { data?: ModelCardDraftData } | null };
        const draft = result.draft?.data;

        if (cancelled || !draft) return;

        if (draft.profile) setProfile(normalizeProfileDraft(creator, draft.profile));
        if ("cardTypeLabel" in draft) setCardTypeLabel(draft.cardTypeLabel ?? "Model");
        if ("headshotImage" in draft) setHeadshotImage(draft.headshotImage ?? null);
        if ("showcaseImage" in draft) setShowcaseImage(draft.showcaseImage ?? null);
        if ("cardPlaceholderImage" in draft) setCardPlaceholderImage(draft.cardPlaceholderImage ?? null);
        if (draft.socialLinks) setSocialLinks({ ...createDefaultSocialLinks(creator.handle), ...draft.socialLinks });
        if (draft.brands) setBrands(draft.brands);
        if (draft.talentContentWall) {
          const normalizedTalentWall = normalizeMediaCollection(draft.talentContentWall);
          if (draft.talentFeatureSelectionId && normalizedTalentWall.collections?.[0]) {
            normalizedTalentWall.collections[0] = {
              ...normalizedTalentWall.collections[0],
              featureSelectionId: draft.talentFeatureSelectionId,
            };
          }
          setTalentContentWall(normalizedTalentWall);
        }
        if (draft.brandMediaCollections) setBrandMediaCollections(draft.brandMediaCollections);
        if (draft.brandFeatureSelectionByBrand) setBrandFeatureSelectionByBrand(draft.brandFeatureSelectionByBrand);
        if ("talentFeatureSelectionId" in draft) setTalentFeatureSelectionId(draft.talentFeatureSelectionId ?? null);
        if (draft.sectionTemplates) setSectionTemplates(resolveTalentSectionTemplates(draft.sectionTemplates));
        if (draft.dataNotes) setDataNotes(draft.dataNotes);
        if (draft.analyticsData) setTalentAnalyticsData(draft.analyticsData);
        if (draft.rateCardItems) setRateCardItems(draft.rateCardItems);
      } finally {
        if (!cancelled) {
          hasLoadedDraftRef.current = true;
        }
      }
    }

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [creator, creator.id, draftAccountId, shouldLoadLatestCreatorDraft]);

  useEffect(() => {
    if (!mediaPreview) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMediaPreview(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mediaPreview]);

  const modelCardDraft = useMemo<ModelCardDraftData>(
    () => ({
      profile,
      cardTypeLabel,
      headshotImage,
      showcaseImage,
      cardPlaceholderImage,
      socialLinks,
      brands,
      talentContentWall,
      brandMediaCollections,
      brandFeatureSelectionByBrand,
      talentFeatureSelectionId,
      sectionTemplates,
      dataNotes,
      analyticsData: talentAnalyticsData,
      rateCardItems,
    }),
    [
      brandFeatureSelectionByBrand,
      brandMediaCollections,
      brands,
      cardPlaceholderImage,
      cardTypeLabel,
      dataNotes,
      headshotImage,
      profile,
      rateCardItems,
      sectionTemplates,
      showcaseImage,
      socialLinks,
      talentAnalyticsData,
      talentContentWall,
      talentFeatureSelectionId,
    ],
  );
  const modelCardDraftRef = useRef<ModelCardDraftData>(modelCardDraft);

  useEffect(() => {
    modelCardDraftRef.current = modelCardDraft;
  }, [modelCardDraft]);

  useEffect(() => {
    if (!hasLoadedDraftRef.current || lastSavedDraftRef.current) return;
    lastSavedDraftRef.current = stringifyDraft(modelCardDraft);
    setHasUnsavedChanges(false);
  }, [modelCardDraft]);

  useEffect(() => {
    if (!hasLoadedDraftRef.current) return;
    setHasUnsavedChanges(stringifyDraft(modelCardDraft) !== lastSavedDraftRef.current);
  }, [modelCardDraft]);

  const updateSectionTemplate = (sectionId: TalentSectionId, templateId: string) => {
    setSectionTemplates((currentTemplates) =>
      resolveTalentSectionTemplates({
        ...currentTemplates,
        [sectionId]: templateId,
      }),
    );
  };

  const addBrand = (brandName: string) => {
    const trimmed = brandName.trim();
    if (!trimmed) return;
    if (brands.some((brand) => normalizeBrandName(brand) === normalizeBrandName(trimmed))) return;
    const nextBrands = [...brands, trimmed];
    setBrands(nextBrands);
    setBrandMediaCollections((prev) => ({
      ...prev,
      [trimmed]: prev[trimmed] ?? createDefaultBrandMediaCollection(trimmed),
    }));
    setSelectedBrand((prev) => prev ?? trimmed);
    setBrandSearch("");
  };

  const removeBrand = (brandToRemove: string) => {
    const nextBrands = brands.filter((brand) => brand !== brandToRemove);
    setBrands(nextBrands);
    setBrandFeatureSelectionByBrand((prev) => {
      const brandKey = normalizeBrandName(brandToRemove);
      if (!(brandKey in prev)) return prev;
      const next = { ...prev };
      delete next[brandKey];
      return next;
    });
    setBrandMediaCollections((prev) => {
      const nextCollections = { ...prev };
      delete nextCollections[brandToRemove];
      return nextCollections;
    });
    if (selectedBrand === brandToRemove) {
      setSelectedBrand(undefined);
    }
  };

  const selectedBrandKeys = useMemo(
    () => new Set(brands.map((brand) => normalizeBrandName(brand))),
    [brands]
  );

  const brandLibraryResults = useMemo(() => {
    const normalizedQuery = normalizeBrandName(deferredBrandSearch);

    return BRAND_CATALOG.filter((entry) => !selectedBrandKeys.has(normalizeBrandName(entry.name)))
      .filter((entry) => {
        if (!normalizedQuery) return true;

        const searchableValues = [entry.name, ...(entry.aliases ?? []), entry.category];

        return searchableValues.some((value) => normalizeBrandName(value).includes(normalizedQuery));
      })
      .slice(0, normalizedQuery ? 8 : 6);
  }, [deferredBrandSearch, selectedBrandKeys]);

  const customBrandCandidate = useMemo(() => {
    const trimmed = brandSearch.trim();
    if (!trimmed) return null;

    const normalizedCandidate = normalizeBrandName(trimmed);

    if (selectedBrandKeys.has(normalizedCandidate)) {
      return null;
    }

    if (getBrandCatalogEntry(trimmed)) {
      return null;
    }

    return trimmed;
  }, [brandSearch, selectedBrandKeys]);

  const carouselBrands = useMemo(
    () => Array.from({ length: 3 }, (_, groupIndex) => brands.map((brand) => ({ brand, groupIndex }))).flat(),
    [brands]
  );

  const selectedBrandCollection = useMemo(
    () => (selectedBrand ? brandMediaCollections[selectedBrand] ?? createDefaultBrandMediaCollection(selectedBrand) : null),
    [brandMediaCollections, selectedBrand]
  );
  const selectedBrandCampaignInfo = useMemo(
    () => (selectedBrandCollection && selectedBrand ? getBrandCampaignInfo(selectedBrandCollection, selectedBrand) : null),
    [selectedBrandCollection, selectedBrand]
  );
  const selectedBrandKey = selectedBrand ? normalizeBrandName(selectedBrand) : null;

  const defaultBrandFeaturedItem = useMemo(() => {
    if (!selectedBrandCollection) return null;
    return selectedBrandCollection.items.find((item) => item.type === "video") ?? selectedBrandCollection.items[0] ?? null;
  }, [selectedBrandCollection]);

  const selectedBrandFeaturedItem = useMemo(() => {
    if (!selectedBrandCollection || !selectedBrandKey) return null;

    const selectedItemId = brandFeatureSelectionByBrand[selectedBrandKey];
    if (!selectedItemId) {
      return defaultBrandFeaturedItem;
    }

    return (
      selectedBrandCollection.items.find((item) => item.id === selectedItemId) ??
      defaultBrandFeaturedItem
    );
  }, [brandFeatureSelectionByBrand, defaultBrandFeaturedItem, selectedBrandCollection, selectedBrandKey]);
  const selectedBrandFeaturedAspectRatio = useMemo(
    () => (selectedBrandFeaturedItem ? resolveMediaAspectRatio(selectedBrandFeaturedItem, true) : 4 / 5),
    [selectedBrandFeaturedItem]
  );

  const selectedBrandSideItems = useMemo(
    () => selectedBrandCollection?.items.filter((item) => item.id !== selectedBrandFeaturedItem?.id) ?? [],
    [selectedBrandCollection, selectedBrandFeaturedItem]
  );
  const selectedBrandSideItemsSignature = useMemo(
    () => selectedBrandSideItems.map((item) => `${item.id}:${item.aspectRatio ?? "na"}`).join("|"),
    [selectedBrandSideItems]
  );
  const highlightWindowsLoopGroupCount = isEditView ? 1 : 3;
  const highlightWindowsCarouselItems = useMemo(
    () =>
      Array.from(
        { length: highlightWindowsLoopGroupCount },
        (_, groupIndex) => selectedBrandSideItems.map((item) => ({ item, groupIndex }))
      ).flat(),
    [highlightWindowsLoopGroupCount, selectedBrandSideItems]
  );
  const selectedBrandFeaturedIsVideo = selectedBrandFeaturedItem?.type === "video";
  const shouldExpandHighlightWindows = Boolean(selectedBrandFeaturedIsVideo && !isEditView && isXlLayout);
  const highlightWindowsHeightPx = highlightViewportHeightPx;

  const selectedBrandMediaCounts = useMemo(() => {
    if (!selectedBrandCollection) {
      return { images: 0, videos: 0 };
    }

    return selectedBrandCollection.items.reduce(
      (counts, item) => {
        if (item.type === "image") counts.images += 1;
        if (item.type === "video") counts.videos += 1;
        return counts;
      },
      { images: 0, videos: 0 }
    );
  }, [selectedBrandCollection]);
  const selectedBrandMetrics = useMemo(
    () => selectedBrandCollection?.metrics ?? {},
    [selectedBrandCollection?.metrics]
  );
  const selectedBrandAverageEngagement = useMemo(() => {
    const views = selectedBrandMetrics.totalViews;
    const likes = selectedBrandMetrics.likes;
    const comments = selectedBrandMetrics.comments;
    const shares = selectedBrandMetrics.shares;
    const saves = selectedBrandMetrics.saves;

    if (
      views === undefined ||
      views <= 0 ||
      likes === undefined ||
      comments === undefined ||
      shares === undefined ||
      saves === undefined
    ) {
      return null;
    }

    return ((likes + comments + shares + saves) / views) * 100;
  }, [selectedBrandMetrics]);

  const talentCollections = useMemo(() => talentContentWall.collections ?? [], [talentContentWall.collections]);
  const activeTalentCollection = useMemo(() => {
    if (talentCollections.length === 0) return null;

    return (
      talentCollections.find((collection) => collection.id === talentContentWall.activeCollectionId) ??
      talentCollections[0]
    );
  }, [talentCollections, talentContentWall.activeCollectionId]);
  const activeTalentCollectionIndex = activeTalentCollection
    ? talentCollections.findIndex((collection) => collection.id === activeTalentCollection.id)
    : -1;
  const talentCollectionStackItems = useMemo(() => {
    if (talentCollections.length === 0 || activeTalentCollectionIndex < 0) return [];

    return talentCollections
      .map((collection, index) => {
        const forwardDistance = (index - activeTalentCollectionIndex + talentCollections.length) % talentCollections.length;
        const backwardDistance = forwardDistance - talentCollections.length;
        const offset =
          Math.abs(forwardDistance) <= Math.abs(backwardDistance) ? forwardDistance : backwardDistance;

        return { collection, offset };
      })
      .filter(({ offset }) => Math.abs(offset) <= 1)
      .sort((a, b) => Math.abs(b.offset) - Math.abs(a.offset));
  }, [activeTalentCollectionIndex, talentCollections]);
  const selectedTalentFeaturedItem = useMemo(
    () => getTalentCollectionFeaturedItem(activeTalentCollection),
    [activeTalentCollection]
  );

  const selectedTalentFeaturedAspectRatio = selectedTalentFeaturedItem
    ? resolveMediaAspectRatio(selectedTalentFeaturedItem, true)
    : 4 / 5;
  const selectedTalentFeaturedMaxWidthPx = getFeaturedMediaMaxWidthPx(selectedTalentFeaturedAspectRatio);

  const talentSideItems = useMemo(
    () => activeTalentCollection?.items.filter((item) => item.id !== selectedTalentFeaturedItem?.id) ?? [],
    [activeTalentCollection, selectedTalentFeaturedItem]
  );
  const hasMoreTalentWallRows = talentSideItems.length > 4;

  const isEditControlMinimized = hasScrolledPastHeroStart;
  const editControlLabel = isEditView ? "Exit Edit View" : "Enter Edit View";

  const saveModelDraft = useCallback(async () => {
    if (!draftAccountId || !hasLoadedDraftRef.current) return false;

    setIsSavingDraft(true);
    const draftToSave = modelCardDraftRef.current;

    try {
      const responses = await Promise.all([
        fetch("/api/drafts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: draftAccountId,
            creatorId: creator.id,
            template: "model-card",
            data: draftToSave,
          }),
        }),
        fetch("/api/drafts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: draftAccountId,
            creatorId: creator.id,
            template: "model-pane",
            data: {
              name: draftToSave.profile?.name ?? profile.name,
              location: draftToSave.profile?.location ?? profile.location,
              headshotImage: draftToSave.headshotImage ?? headshotImage,
              race: draftToSave.profile?.race ?? profile.race,
              gender: draftToSave.profile?.gender ?? profile.gender,
              modelingCapabilities: draftToSave.profile?.modelingCapabilities ?? profile.modelingCapabilities,
            },
          }),
        }),
      ]);

      if (responses.some((response) => !response.ok)) {
        return false;
      }

      lastSavedDraftRef.current = stringifyDraft(draftToSave);
      setHasUnsavedChanges(false);
      return true;
    } finally {
      setIsSavingDraft(false);
    }
  }, [creator.id, draftAccountId, headshotImage, profile]);

  const restoreLastSavedDraft = () => {
    const savedDraft = lastSavedDraftRef.current
      ? (JSON.parse(lastSavedDraftRef.current) as ModelCardDraftData)
      : null;

    if (!savedDraft) return;

    setProfile(normalizeProfileDraft(creator, savedDraft.profile));
    setCardTypeLabel(savedDraft.cardTypeLabel ?? "Model");
    setHeadshotImage(savedDraft.headshotImage ?? creator.headshotImage ?? null);
    setShowcaseImage(savedDraft.showcaseImage ?? null);
    setCardPlaceholderImage(savedDraft.cardPlaceholderImage ?? null);
    setSocialLinks({ ...createDefaultSocialLinks(creator.handle), ...savedDraft.socialLinks });
    setBrands(savedDraft.brands ?? creator.brandsWorkedWith);
    const restoredTalentWall = normalizeMediaCollection(
      savedDraft.talentContentWall ?? createDefaultTalentContentCollection(creator.name)
    );
    if (savedDraft.talentFeatureSelectionId && restoredTalentWall.collections?.[0]) {
      restoredTalentWall.collections[0] = {
        ...restoredTalentWall.collections[0],
        featureSelectionId: savedDraft.talentFeatureSelectionId,
      };
    }
    setTalentContentWall(restoredTalentWall);
    setBrandMediaCollections(savedDraft.brandMediaCollections ?? createBrandMediaCollections(creator.brandsWorkedWith));
    setBrandFeatureSelectionByBrand(savedDraft.brandFeatureSelectionByBrand ?? {});
    setTalentFeatureSelectionId(savedDraft.talentFeatureSelectionId ?? null);
    setSectionTemplates(resolveTalentSectionTemplates(savedDraft.sectionTemplates));
    setDataNotes(
      savedDraft.dataNotes ??
        "Data panel can be filtered by brand selections and content highlights to compare campaign performance trends.",
    );
    setTalentAnalyticsData(savedDraft.analyticsData ?? createDefaultTalentAnalyticsData());
    setRateCardItems(savedDraft.rateCardItems ?? createDefaultRateCardItems());
    setHasUnsavedChanges(false);
  };

  const toggleEditView = () => {
    const nextEditView = !isEditView;
    if (nextEditView) {
      setSelectedBrand(undefined);
    }
    setEditView(nextEditView);
  };

  const handleEditControlPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    editControlDragRef.current = {
      moved: false,
      pointerId: event.pointerId,
      startLeft: buttonRect.left,
      startTop: buttonRect.top,
      startX: event.clientX,
      startY: event.clientY,
    };
    setEditControlPosition({ left: buttonRect.left, top: buttonRect.top });
    setIsEditControlDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleEditControlPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = editControlDragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.moved = true;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const maxLeft = Math.max(12, window.innerWidth - buttonRect.width - 12);
    const maxTop = Math.max(12, window.innerHeight - buttonRect.height - 12);

    setEditControlPosition({
      left: Math.min(maxLeft, Math.max(12, drag.startLeft + deltaX)),
      top: Math.min(maxTop, Math.max(12, drag.startTop + deltaY)),
    });
  };

  const handleEditControlClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (editControlDragRef.current.moved) {
      event.preventDefault();
      editControlDragRef.current.moved = false;
      return;
    }

    if (isEditView && hasUnsavedChanges) {
      setShowExitSavePrompt(true);
      return;
    }

    toggleEditView();
  };

  const handleEditControlPointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    editControlDragRef.current.pointerId = 0;
    setIsEditControlDragging(false);
  };

  const registerCarouselInteraction = () => {
    carouselPausedUntilRef.current = Date.now() + BRAND_CAROUSEL_PAUSE_MS;
  };

  const registerHighlightWindowsInteraction = () => {
    highlightWindowsPausedUntilRef.current = Date.now() + HIGHLIGHT_WINDOWS_PAUSE_MS;
  };

  const syncTalentWallScrollHint = useCallback(() => {
    const scroller = talentWallWindowsScrollRef.current;

    if (!scroller || isEditView || !hasMoreTalentWallRows) {
      setShowTalentWallScrollHint(false);
      return;
    }

    const remainingScroll = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
    setShowTalentWallScrollHint(remainingScroll > 2);
  }, [hasMoreTalentWallRows, isEditView]);

  const syncBrandCarouselOffset = (nextOffset: number) => {
    const container = brandCarouselRef.current;
    if (!container) return;

    const setWidth = container.scrollWidth / 3;
    if (setWidth === 0) return;

    let normalizedOffset = nextOffset;

    while (normalizedOffset >= setWidth * 2) normalizedOffset -= setWidth;
    while (normalizedOffset <= 0) normalizedOffset += setWidth;

    carouselOffsetRef.current = normalizedOffset;
    container.style.transform = `translate3d(${-normalizedOffset}px, 0, 0)`;
  };

  const syncHighlightWindowsOffset = useCallback(
    (nextOffset: number) => {
      const container = highlightWindowsTrackRef.current;
      if (!container || highlightWindowsLoopGroupCount < 2) return;

      const setWidth = container.scrollWidth / highlightWindowsLoopGroupCount;
      if (setWidth === 0) return;

      let normalizedOffset = nextOffset;

      while (normalizedOffset >= setWidth * 2) normalizedOffset -= setWidth;
      while (normalizedOffset <= 0) normalizedOffset += setWidth;

      highlightWindowsOffsetRef.current = normalizedOffset;
      container.style.transform = `translate3d(${-normalizedOffset}px, 0, 0)`;
    },
    [highlightWindowsLoopGroupCount]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const syncLayoutBreakpoint = () => setIsXlLayout(mediaQuery.matches);

    syncLayoutBreakpoint();
    mediaQuery.addEventListener("change", syncLayoutBreakpoint);

    return () => {
      mediaQuery.removeEventListener("change", syncLayoutBreakpoint);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncScrollState = () => {
      setHasScrolledPastHeroStart(window.scrollY > 72);
    };

    syncScrollState();
    window.addEventListener("scroll", syncScrollState, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncScrollState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const viewport = talentWallWindowsViewportRef.current;
    if (!viewport) return;

    const syncTalentWallViewportHeight = () => {
      const innerWidth = Math.max(0, viewport.clientWidth - TALENT_WALL_WINDOWS_PADDING_X_PX);
      const isTwoColumn = window.matchMedia("(min-width: 640px)").matches;
      const columns = isTwoColumn ? 2 : 1;
      const rowsToShow = Math.max(1, Math.min(2, Math.ceil(talentSideItems.length / columns)));
      const totalColumnGap = columns === 2 ? TALENT_WALL_WINDOWS_GAP_PX : 0;
      const tileWidth = columns === 2 ? (innerWidth - totalColumnGap) / 2 : innerWidth;
      const tileHeight = tileWidth / TALENT_WALL_SIDE_TILE_ASPECT_RATIO;
      const nextHeight =
        TALENT_WALL_WINDOWS_PADDING_Y_PX +
        rowsToShow * tileHeight +
        Math.max(0, rowsToShow - 1) * TALENT_WALL_WINDOWS_GAP_PX;

      setTalentWallViewportHeightPx(Math.round(nextHeight));
    };

    syncTalentWallViewportHeight();

    const resizeObserver = new ResizeObserver(syncTalentWallViewportHeight);
    resizeObserver.observe(viewport);
    window.addEventListener("resize", syncTalentWallViewportHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncTalentWallViewportHeight);
    };
  }, [talentSideItems.length]);

  useEffect(() => {
    const scroller = talentWallWindowsScrollRef.current;
    if (!scroller) return;

    scroller.scrollTop = 0;
    syncTalentWallScrollHint();
  }, [activeTalentCollection?.id, syncTalentWallScrollHint]);

  useEffect(() => {
    const scroller = talentWallWindowsScrollRef.current;
    const track = talentWallWindowsTrackRef.current;
    const frameId = window.requestAnimationFrame(syncTalentWallScrollHint);

    if (!scroller) {
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    scroller.addEventListener("scroll", syncTalentWallScrollHint, { passive: true });

    const resizeObserver = new ResizeObserver(syncTalentWallScrollHint);
    resizeObserver.observe(scroller);
    if (track) {
      resizeObserver.observe(track);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      scroller.removeEventListener("scroll", syncTalentWallScrollHint);
      resizeObserver.disconnect();
    };
  }, [syncTalentWallScrollHint, talentSideItems.length, talentWallViewportHeightPx]);

  useEffect(() => {
    const startRatio = featuredAspectRatioRef.current;
    const targetRatio = selectedBrandFeaturedAspectRatio;
    const startViewportHeight = highlightViewportHeightRef.current;
    const shouldAnimateViewport = isXlLayout && !isEditView;
    const readExpandedViewportHeight = () => {
      const featuredColumn = highlightFeaturedColumnRef.current;
      if (!featuredColumn) {
        return HIGHLIGHT_WINDOWS_COLLAPSED_HEIGHT_PX;
      }

      return Math.max(
        HIGHLIGHT_WINDOWS_COLLAPSED_HEIGHT_PX,
        Math.round(featuredColumn.getBoundingClientRect().height)
      );
    };
    const targetViewportHeight = shouldAnimateViewport
      ? shouldExpandHighlightWindows
        ? readExpandedViewportHeight()
        : HIGHLIGHT_WINDOWS_COLLAPSED_HEIGHT_PX
      : startViewportHeight;
    const isViewportShrinking = shouldAnimateViewport && targetViewportHeight < startViewportHeight;
    const animationDurationMs = isViewportShrinking
      ? FEATURED_MEDIA_VIEWPORT_SHRINK_TRANSITION_MS
      : FEATURED_MEDIA_VIEWPORT_EXPAND_TRANSITION_MS;
    const shouldAnimateRatio = Math.abs(targetRatio - startRatio) >= 0.001;
    const shouldAnimateHeight = shouldAnimateViewport && Math.abs(targetViewportHeight - startViewportHeight) >= 1;
    if (!shouldAnimateRatio && !shouldAnimateHeight) {
      return;
    }

    const easeInOutSine = (progress: number) => 0.5 - Math.cos(Math.PI * progress) / 2;

    const startTime = performance.now();

    if (featuredAspectRatioAnimationFrameRef.current !== 0) {
      window.cancelAnimationFrame(featuredAspectRatioAnimationFrameRef.current);
      featuredAspectRatioAnimationFrameRef.current = 0;
    }

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / animationDurationMs);
      const easedProgress = easeInOutSine(progress);

      if (shouldAnimateRatio) {
        const nextRatio = startRatio + (targetRatio - startRatio) * easedProgress;
        featuredAspectRatioRef.current = nextRatio;
        setFeaturedAnimatedAspectRatio(nextRatio);
      }

      if (shouldAnimateViewport) {
        const dynamicTargetHeight = shouldExpandHighlightWindows
          ? readExpandedViewportHeight()
          : HIGHLIGHT_WINDOWS_COLLAPSED_HEIGHT_PX;
        const nextViewportHeight =
          startViewportHeight + (dynamicTargetHeight - startViewportHeight) * easedProgress;
        const roundedViewportHeight = Math.round(nextViewportHeight);

        if (Math.abs(roundedViewportHeight - highlightViewportHeightRef.current) >= 1) {
          highlightViewportHeightRef.current = roundedViewportHeight;
          setHighlightViewportHeightPx(roundedViewportHeight);
        }
      }

      if (progress < 1) {
        featuredAspectRatioAnimationFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      featuredAspectRatioAnimationFrameRef.current = 0;

      if (shouldAnimateRatio) {
        featuredAspectRatioRef.current = targetRatio;
        setFeaturedAnimatedAspectRatio(targetRatio);
      }

      if (shouldAnimateViewport) {
        const settledViewportHeight = shouldExpandHighlightWindows
          ? readExpandedViewportHeight()
          : HIGHLIGHT_WINDOWS_COLLAPSED_HEIGHT_PX;
        highlightViewportHeightRef.current = settledViewportHeight;
        setHighlightViewportHeightPx(settledViewportHeight);
      }
    };

    featuredAspectRatioAnimationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (featuredAspectRatioAnimationFrameRef.current !== 0) {
        window.cancelAnimationFrame(featuredAspectRatioAnimationFrameRef.current);
        featuredAspectRatioAnimationFrameRef.current = 0;
      }
    };
  }, [isEditView, isXlLayout, selectedBrandFeaturedAspectRatio, shouldExpandHighlightWindows]);

  useEffect(() => {
    const container = brandCarouselRef.current;
    const viewport = brandCarouselViewportRef.current;
    if (!container || !viewport || brands.length === 0) return;

    syncBrandCarouselOffset(container.scrollWidth / 3);
    carouselWheelVelocityRef.current = 0;

    let frameId = 0;
    let previousTime = 0;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

      if (dominantDelta === 0) return;

      registerCarouselInteraction();

      const deltaInPixels = toWheelPixels(
        dominantDelta,
        event.deltaMode,
        viewport.clientWidth || window.innerWidth
      );

      carouselWheelVelocityRef.current += deltaInPixels * BRAND_CAROUSEL_WHEEL_ACCELERATION;

      if (carouselWheelVelocityRef.current > BRAND_CAROUSEL_WHEEL_MAX_VELOCITY) {
        carouselWheelVelocityRef.current = BRAND_CAROUSEL_WHEEL_MAX_VELOCITY;
      } else if (carouselWheelVelocityRef.current < -BRAND_CAROUSEL_WHEEL_MAX_VELOCITY) {
        carouselWheelVelocityRef.current = -BRAND_CAROUSEL_WHEEL_MAX_VELOCITY;
      }
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    const tick = (time: number) => {
      const activeContainer = brandCarouselRef.current;
      if (!activeContainer) return;

      if (previousTime === 0) {
        previousTime = time;
      }

      const delta = time - previousTime;
      previousTime = time;

      if (Math.abs(carouselWheelVelocityRef.current) > BRAND_CAROUSEL_WHEEL_STOP_THRESHOLD) {
        syncBrandCarouselOffset(carouselOffsetRef.current + carouselWheelVelocityRef.current * delta);
        carouselWheelVelocityRef.current *= Math.exp(-BRAND_CAROUSEL_WHEEL_DAMPING_PER_MS * delta);
      } else {
        carouselWheelVelocityRef.current = 0;
        if (activeContainer.scrollWidth > 0 && Date.now() >= carouselPausedUntilRef.current) {
          syncBrandCarouselOffset(carouselOffsetRef.current + delta * BRAND_CAROUSEL_SPEED_PX_PER_MS);
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
      window.cancelAnimationFrame(frameId);
    };
  }, [brands.length]);

  useEffect(() => {
    const viewport = highlightWindowsViewportRef.current;
    const track = highlightWindowsTrackRef.current;
    if (!viewport || !track) return;

    if (highlightWindowsLoopGroupCount < 2 || selectedBrandSideItems.length === 0) {
      highlightWindowsWheelVelocityRef.current = 0;
      highlightWindowsOffsetRef.current = 0;
      track.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    syncHighlightWindowsOffset(track.scrollWidth / highlightWindowsLoopGroupCount);

    highlightWindowsWheelVelocityRef.current = 0;
    let frameId = 0;
    let previousTime = 0;

    const handleWheel = (event: WheelEvent) => {
      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

      if (dominantDelta === 0) return;

      event.preventDefault();
      event.stopPropagation();
      registerHighlightWindowsInteraction();

      const deltaInPixels = toWheelPixels(
        dominantDelta,
        event.deltaMode,
        viewport.clientWidth || window.innerWidth
      );

      highlightWindowsWheelVelocityRef.current += deltaInPixels * HIGHLIGHT_WINDOWS_WHEEL_ACCELERATION;
      if (highlightWindowsWheelVelocityRef.current > HIGHLIGHT_WINDOWS_WHEEL_MAX_VELOCITY) {
        highlightWindowsWheelVelocityRef.current = HIGHLIGHT_WINDOWS_WHEEL_MAX_VELOCITY;
      } else if (highlightWindowsWheelVelocityRef.current < -HIGHLIGHT_WINDOWS_WHEEL_MAX_VELOCITY) {
        highlightWindowsWheelVelocityRef.current = -HIGHLIGHT_WINDOWS_WHEEL_MAX_VELOCITY;
      }
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    const tick = (time: number) => {
      const activeTrack = highlightWindowsTrackRef.current;
      if (!activeTrack) return;

      if (previousTime === 0) {
        previousTime = time;
      }

      const delta = time - previousTime;
      previousTime = time;

      if (Math.abs(highlightWindowsWheelVelocityRef.current) > HIGHLIGHT_WINDOWS_WHEEL_STOP_THRESHOLD) {
        syncHighlightWindowsOffset(highlightWindowsOffsetRef.current + highlightWindowsWheelVelocityRef.current * delta);
        highlightWindowsWheelVelocityRef.current *= Math.exp(-HIGHLIGHT_WINDOWS_WHEEL_DAMPING_PER_MS * delta);
      } else {
        highlightWindowsWheelVelocityRef.current = 0;
        if (activeTrack.scrollWidth > 0 && Date.now() >= highlightWindowsPausedUntilRef.current) {
          syncHighlightWindowsOffset(highlightWindowsOffsetRef.current + delta * HIGHLIGHT_WINDOWS_SPEED_PX_PER_MS);
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
      window.cancelAnimationFrame(frameId);
    };
  }, [
    highlightWindowsLoopGroupCount,
    selectedBrandSideItems.length,
    selectedBrandSideItemsSignature,
    selectedBrandFeaturedItem?.id,
    syncHighlightWindowsOffset,
  ]);

  const updateBrandMediaCollection = (
    brand: string,
    updater: (collection: BrandMediaCollection) => BrandMediaCollection
  ) => {
    setBrandMediaCollections((prev) => {
      const currentCollection = prev[brand] ?? createDefaultBrandMediaCollection(brand);

      return {
        ...prev,
        [brand]: updater(currentCollection),
      };
    });
  };

  const updateBrandHeadline = (brand: string, key: "headline" | "summary", value: string) => {
    updateBrandMediaCollection(brand, (collection) => ({
      ...collection,
      [key]: value,
    }));
  };

  const updateBrandCampaignInfo = (brand: string, key: keyof BrandCampaignInfo, value: string) => {
    updateBrandMediaCollection(brand, (collection) => ({
      ...collection,
      campaignInfo: {
        ...getBrandCampaignInfo(collection, brand),
        [key]: value,
      },
    }));
  };

  const updateBrandMetric = (brand: string, key: keyof BrandCampaignMetrics, value: string) => {
    updateBrandMediaCollection(brand, (collection) => {
      const nextMetrics = { ...(collection.metrics ?? {}) };
      const parsedValue = parseOptionalMetric(value);

      if (parsedValue === undefined) {
        delete nextMetrics[key];
      } else {
        nextMetrics[key] = parsedValue;
      }

      return {
        ...collection,
        metrics: Object.keys(nextMetrics).length > 0 ? nextMetrics : undefined,
      };
    });
  };

  const updateTalentWall = (updater: (collection: BrandMediaCollection) => BrandMediaCollection) => {
    setTalentContentWall((prev) => {
      const nextTalentContentWall = normalizeMediaCollection(updater(prev));
      const nextDraft = {
        ...modelCardDraftRef.current,
        talentContentWall: nextTalentContentWall,
      };

      modelCardDraftRef.current = nextDraft;
      if (hasLoadedDraftRef.current) {
        setHasUnsavedChanges(stringifyDraft(nextDraft) !== lastSavedDraftRef.current);
      }

      return nextTalentContentWall;
    });
  };

  const updateTalentCollection = (
    collectionId: string,
    updater: (collection: TalentContentCollection) => TalentContentCollection
  ) => {
    updateTalentWall((collection) => ({
      ...collection,
      collections: (collection.collections ?? []).map((entry) =>
        entry.id === collectionId ? updater(entry) : entry
      ),
    }));
  };

  const setActiveTalentCollection = (collectionId: string) => {
    updateTalentWall((collection) => ({
      ...collection,
      activeCollectionId: collectionId,
    }));
  };

  const moveTalentCollection = (direction: -1 | 1) => {
    if (talentCollections.length <= 1) return;

    const currentIndex = Math.max(0, activeTalentCollectionIndex);
    const nextIndex = (currentIndex + direction + talentCollections.length) % talentCollections.length;
    setActiveTalentCollection(talentCollections[nextIndex].id);
  };

  const reorderTalentCollection = (draggedCollectionId: string, targetCollectionId: string) => {
    if (draggedCollectionId === targetCollectionId) return;

    updateTalentWall((collection) => {
      const collections = [...(collection.collections ?? [])];
      const draggedIndex = collections.findIndex((entry) => entry.id === draggedCollectionId);
      const targetIndex = collections.findIndex((entry) => entry.id === targetCollectionId);

      if (draggedIndex < 0 || targetIndex < 0) {
        return collection;
      }

      const [draggedCollection] = collections.splice(draggedIndex, 1);
      collections.splice(targetIndex, 0, draggedCollection);

      return {
        ...collection,
        collections,
        activeCollectionId: draggedCollectionId,
      };
    });
  };

  const handleTalentCollectionPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (talentCollections.length <= 1) return;

    talentCollectionSwipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handleTalentCollectionPointerUp = (event: PointerEvent<HTMLElement>) => {
    const swipe = talentCollectionSwipeRef.current;
    if (swipe.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;
    talentCollectionSwipeRef.current = { pointerId: 0, startX: 0, startY: 0 };

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    moveTalentCollection(deltaX < 0 ? 1 : -1);
  };

  const handleTalentCollectionWheel = (event: ReactWheelEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (talentCollections.length <= 1) return;

    const dominantDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(dominantDelta) < 24) return;
    if (Date.now() < talentCollectionWheelLockedUntilRef.current) return;

    talentCollectionWheelLockedUntilRef.current = Date.now() + 420;
    moveTalentCollection(dominantDelta > 0 ? 1 : -1);
  };

  const updateTalentCollectionText = (collectionId: string, key: "title" | "description", value: string) => {
    updateTalentCollection(collectionId, (collection) => ({
      ...collection,
      [key]: value,
    }));
  };

  const updateBrandMediaTitle = (brand: string, mediaId: string, value: string) => {
    updateBrandMediaCollection(brand, (collection) => ({
      ...collection,
      items: collection.items.map((item) => (item.id === mediaId ? { ...item, title: value } : item)),
    }));
  };

  const updateTalentMediaTitle = (mediaId: string, value: string) => {
    updateTalentWall((collection) => ({
      ...collection,
      items: collection.items.map((item) => (item.id === mediaId ? { ...item, title: value } : item)),
      collections: (collection.collections ?? []).map((entry) => ({
        ...entry,
        items: entry.items.map((item) => (item.id === mediaId ? { ...item, title: value } : item)),
      })),
    }));
  };

  const updateTalentMediaDescription = (mediaId: string, value: string) => {
    updateTalentWall((collection) => ({
      ...collection,
      items: collection.items.map((item) => (item.id === mediaId ? { ...item, description: value } : item)),
      collections: (collection.collections ?? []).map((entry) => ({
        ...entry,
        items: entry.items.map((item) => (item.id === mediaId ? { ...item, description: value } : item)),
      })),
    }));
  };

  const addBrandMediaWindow = (brand: string, type: BrandMediaItem["type"]) => {
    const normalizedBrand = normalizeBrandName(brand).replace(/\s+/g, "-") || "brand";

    updateBrandMediaCollection(brand, (collection) => {
      const ordinal = collection.items.filter((item) => item.type === type).length + 1;

      return {
        ...collection,
        items: [
          ...collection.items,
          createMediaItem(
            `${normalizedBrand}-${type}-${Date.now().toString(36)}`,
            type,
            type === "video" ? `Video window ${ordinal}` : `Image window ${ordinal}`
          ),
        ],
      };
    });
  };

  const addTalentMediaWindow = (type: BrandMediaItem["type"]) => {
    const normalizedName = normalizeBrandName(creator.name).replace(/\s+/g, "-") || "talent";

    updateTalentWall((collection) => {
      const collections = collection.collections ?? [];
      const activeCollection =
        collections.find((entry) => entry.id === collection.activeCollectionId) ?? collections[0] ?? null;
      const ordinal = (activeCollection?.items ?? collection.items).filter((item) => item.type === type).length + 1;
      const nextItem = createMediaItem(
        `${normalizedName}-talent-${type}-${Date.now().toString(36)}`,
        type,
        type === "video" ? `Video window ${ordinal}` : `Image window ${ordinal}`
      );

      return {
        ...collection,
        items: activeCollection ? collection.items : [...collection.items, nextItem],
        collections: activeCollection
          ? collections.map((entry) =>
              entry.id === activeCollection.id ? { ...entry, items: [...entry.items, nextItem] } : entry
            )
          : collections,
      };
    });
  };

  const addTalentCollection = () => {
    const normalizedName = normalizeBrandName(creator.name).replace(/\s+/g, "-") || "talent";

    updateTalentWall((collection) => {
      const collections = collection.collections ?? [];
      const ordinal = collections.length + 1;
      const collectionId = `${normalizedName}-collection-${Date.now().toString(36)}`;
      const items = [
        createMediaItem(`${collectionId}-feature-video`, "video", "Feature reel"),
        createMediaItem(`${collectionId}-still-01`, "image", "Collection still 01"),
        createMediaItem(`${collectionId}-still-02`, "image", "Collection still 02"),
      ];
      const nextCollection = createTalentCollection(
        collectionId,
        `Collection ${ordinal}`,
        "Add a title and description for this collection.",
        items
      );

      return {
        ...collection,
        collections: [...collections, nextCollection],
        activeCollectionId: collectionId,
      };
    });
  };

  const clearBrandFeaturedSelection = () => {
    if (!selectedBrandKey) return;

    setBrandFeatureSelectionByBrand((prev) => {
      if (!prev[selectedBrandKey]) return prev;
      return { ...prev, [selectedBrandKey]: null };
    });
  };

  const toggleBrandFeaturedSelection = (itemId: string) => {
    if (!selectedBrandKey) return;

    setBrandFeatureSelectionByBrand((prev) => {
      const explicitSelection = prev[selectedBrandKey] ?? null;
      const currentlyDisplayedId = explicitSelection ?? defaultBrandFeaturedItem?.id ?? null;
      const nextSelection = currentlyDisplayedId === itemId ? null : itemId;

      if (explicitSelection === nextSelection) {
        return prev;
      }

      return { ...prev, [selectedBrandKey]: nextSelection };
    });
  };

  const toggleTalentFeaturedSelection = (itemId: string) => {
    if (!activeTalentCollection) return;

    updateTalentCollection(activeTalentCollection.id, (collection) => {
      const defaultItem = getTalentCollectionFeaturedItem({ ...collection, featureSelectionId: null });
      const currentlyDisplayedId = collection.featureSelectionId ?? defaultItem?.id ?? null;
      const nextSelection = currentlyDisplayedId === itemId ? null : itemId;

      return {
        ...collection,
        featureSelectionId: nextSelection,
      };
    });
  };

  const uploadBrandMediaAsset = async (
    brand: string,
    mediaId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const [src, aspectRatio] = await Promise.all([fileToDataUrl(file), getFileAspectRatio(file)]);

    updateBrandMediaCollection(brand, (collection) => ({
      ...collection,
      items: collection.items.map((item) =>
        item.id === mediaId
          ? {
              ...item,
              src,
              type: file.type.startsWith("video/") ? "video" : "image",
              aspectRatio,
            }
          : item
      ),
    }));
  };

  const uploadTalentMediaAsset = async (mediaId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const [src, aspectRatio] = await Promise.all([fileToDataUrl(file), getFileAspectRatio(file)]);

    updateTalentWall((collection) => ({
      ...collection,
      items: collection.items.map((item) =>
        item.id === mediaId
          ? {
              ...item,
              src,
              type: file.type.startsWith("video/") ? "video" : "image",
              aspectRatio,
            }
          : item
      ),
      collections: (collection.collections ?? []).map((entry) => ({
        ...entry,
        items: entry.items.map((item) =>
          item.id === mediaId
            ? {
                ...item,
                src,
                type: file.type.startsWith("video/") ? "video" : "image",
                aspectRatio,
              }
            : item
        ),
      })),
    }));
  };

  const removeBrandMediaAsset = (brand: string, mediaId: string) => {
    updateBrandMediaCollection(brand, (collection) => ({
      ...collection,
      items: collection.items.map((item) => (item.id === mediaId ? { ...item, src: null, aspectRatio: null } : item)),
    }));
  };

  const removeTalentMediaAsset = (mediaId: string) => {
    updateTalentWall((collection) => ({
      ...collection,
      items: collection.items.map((item) => (item.id === mediaId ? { ...item, src: null, aspectRatio: null } : item)),
      collections: (collection.collections ?? []).map((entry) => ({
        ...entry,
        items: entry.items.map((item) => (item.id === mediaId ? { ...item, src: null, aspectRatio: null } : item)),
      })),
    }));
  };

  const deleteTalentMediaWindow = (mediaId: string) => {
    updateTalentWall((collection) => ({
      ...collection,
      items: collection.items.filter((item) => item.id !== mediaId),
      collections: (collection.collections ?? []).map((entry) => ({
        ...entry,
        featureSelectionId: entry.featureSelectionId === mediaId ? null : entry.featureSelectionId,
        items: entry.items.filter((item) => item.id !== mediaId),
      })),
    }));
  };

  const toggleModelingCapability = (capability: ModelingCapability) => {
    setProfile((prev) => {
      const hasCapability = prev.modelingCapabilities.includes(capability);
      const nextCapabilities = hasCapability
        ? prev.modelingCapabilities.filter((item) => item !== capability)
        : [...prev.modelingCapabilities, capability];

      return {
        ...prev,
        modelingCapabilities: nextCapabilities.length > 0 ? nextCapabilities : [capability],
      };
    });
  };

  return (
    <div className="space-y-5">
      {mediaPreview ? <MediaPreviewDialog media={mediaPreview} onClose={() => setMediaPreview(null)} /> : null}
      {canEdit ? (
        <button
          type="button"
          aria-label={editControlLabel}
          title={editControlLabel}
          onPointerDown={handleEditControlPointerDown}
          onPointerMove={handleEditControlPointerMove}
          onPointerUp={handleEditControlPointerEnd}
          onPointerCancel={handleEditControlPointerEnd}
          onClick={handleEditControlClick}
          className={`fixed z-50 inline-flex touch-none select-none items-center justify-center gap-2 overflow-hidden border font-semibold uppercase tracking-[0.12em] shadow-[0_18px_38px_rgba(16,33,24,0.2)] backdrop-blur transition-[width,height,border-radius,background-color,color,border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98] ${
            editControlPosition ? "" : "right-5 top-20 md:right-8 md:top-24"
          } ${
            isEditControlMinimized
              ? "h-14 w-14 rounded-full p-0"
              : "h-10 w-[166px] rounded-xl px-3 text-xs"
          } ${
            isEditView
              ? "border-[#174d38] bg-[#174d38] text-white hover:bg-[#1f6047]"
              : "border-[#d8d2c5] bg-[#f3f1eb]/95 text-[#7d7464] hover:border-[#cabda4] hover:text-[#3d3a34]"
          } ${isEditControlDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={
            editControlPosition
              ? {
                  left: `${editControlPosition.left}px`,
                  top: `${editControlPosition.top}px`,
                }
              : undefined
          }
        >
          <span className="pointer-events-none relative h-8 w-8 shrink-0 select-none">
            <Image
              src="/Icons/edit.png"
              alt=""
              fill
              sizes="32px"
              draggable={false}
              className="pointer-events-none select-none object-contain"
              aria-hidden
            />
          </span>
          <span
            className={`whitespace-nowrap transition-[max-width,opacity] duration-300 ease-out ${
              isEditControlMinimized ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"
            }`}
          >
            {editControlLabel}
          </span>
        </button>
      ) : null}
      {canEdit && isEditView && hasUnsavedChanges ? (
        <button
          type="button"
          onClick={() => {
            void saveModelDraft();
          }}
          disabled={isSavingDraft}
          className={`fixed z-50 inline-flex h-10 items-center justify-center rounded-xl border border-[#174d38] bg-[#174d38] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-[0_18px_38px_rgba(16,33,24,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1f6047] disabled:cursor-wait disabled:opacity-70 ${
            editControlPosition ? "" : "right-5 top-[132px] md:right-8 md:top-[138px]"
          }`}
          style={
            editControlPosition
              ? {
                  left: `${editControlPosition.left + (isEditControlMinimized ? 68 : 178)}px`,
                  top: `${editControlPosition.top}px`,
                }
              : undefined
          }
        >
          {isSavingDraft ? "Saving..." : "Save"}
        </button>
      ) : null}
      {showExitSavePrompt ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#d8d2c5] bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <p className="text-lg font-bold text-[var(--text-primary)]">Save changes?</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              You have unsaved changes on this model card. Save them before exiting edit view?
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setShowExitSavePrompt(false)}
                className="rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitSavePrompt(false);
                  restoreLastSavedDraft();
                  setEditView(false);
                }}
                className="rounded-lg border border-[#d8d2c5] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464]"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={isSavingDraft}
                onClick={async () => {
                  const saved = await saveModelDraft();
                  if (saved) {
                    setShowExitSavePrompt(false);
                    setEditView(false);
                  }
                }}
                className="rounded-lg border border-[#174d38] bg-[#174d38] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-wait disabled:opacity-70"
              >
                {isSavingDraft ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section className="card-surface overflow-hidden bg-[#f9f8f3]">
        <div className="h-[7px] w-full bg-[linear-gradient(90deg,#cfc5b2_0%,#e2dac9_34%,#f4f1e8_100%)]" />
        <div className="grid gap-6 px-5 py-4 lg:min-h-[860px] lg:grid-cols-[1.3fr_1fr_1fr] lg:items-stretch lg:py-4">
          <div className="flex h-full flex-col space-y-4">
            <p className="editorial-kicker">{viewer === "creator" ? "Talent Showcase" : "Talent Profile"}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold text-[var(--text-primary)] md:text-5xl">
                Talent Card -{" "}
                {isEditView ? (
                  <input
                    value={cardTypeLabel}
                    onChange={(event) => setCardTypeLabel(event.target.value)}
                    className="inline-block min-w-[6ch] max-w-full rounded-lg border border-[#b9d3bf] bg-white/75 px-2 py-1 text-[#174d38] outline-none transition focus:border-[#174d38] focus:bg-white"
                    style={{ width: `${Math.max(5, Math.min(18, cardTypeLabel.length || 5))}ch` }}
                    placeholder="Model"
                    aria-label="Talent card type label"
                  />
                ) : (
                  <span className="text-[#174d38]">{cardTypeLabel || "Model"}</span>
                )}
              </h1>
            </div>
            <p className="text-2xl font-semibold md:text-3xl">{profile.name}</p>
            <SocialCredentialRow
              credentialNumber={creator.credentialNumber}
              isEditView={isEditView}
              socialLinks={socialLinks}
              onSocialLinkChange={(platform, value) =>
                setSocialLinks((prev) => ({ ...prev, [platform]: value }))
              }
            />

            <div className="flex flex-1 flex-col gap-4 lg:grid lg:h-[560px] lg:flex-none lg:grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] lg:gap-0">
              <div className="mx-auto w-full max-w-[320px] lg:row-start-2">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-[#d9d0c1] bg-[linear-gradient(180deg,#ebe9e1_0%,#f7f5ef_100%)]">
                  {headshotImage ? (
                    <button
                      type="button"
                      aria-label={`Open ${profile.name} headshot`}
                      className="absolute inset-0 z-10 cursor-zoom-in appearance-none border-0 bg-transparent p-0"
                      onClick={() =>
                        setMediaPreview({
                          src: headshotImage,
                          title: `${profile.name} headshot`,
                          type: "image",
                        })
                      }
                    >
                      <Image
                        src={headshotImage}
                        alt={`${profile.name} headshot`}
                        fill
                        sizes="(min-width: 1024px) 320px, 80vw"
                        className="object-cover object-center"
                        unoptimized
                      />
                    </button>
                  ) : (
                    <div className="flex h-full items-center justify-center p-5 text-center">
                      <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7d7464]">
                        4:5 Headshot
                      </span>
                    </div>
                  )}
                  {isEditView ? (
                    <ViewportEditControls>
                      <label className={viewportEditControlClassName}>
                        Upload Headshot
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => imageToDataUrl(event, setHeadshotImage)}
                        />
                      </label>
                      {headshotImage ? (
                        <button
                          type="button"
                          onClick={() => setHeadshotImage(null)}
                          className={viewportEditControlClassName}
                        >
                          Remove Headshot
                        </button>
                      ) : null}
                    </ViewportEditControls>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs lg:row-start-4">
                <div>
                  {isEditView ? (
                    <input
                      value={profile.race}
                      onChange={(event) => setProfile((prev) => ({ ...prev, race: event.target.value }))}
                      aria-label="Race"
                      className="credential-font w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-center text-sm leading-tight tracking-[0.16em] text-slate-900 shadow-[var(--shadow-soft)] outline-none transition focus:border-[var(--accent-blue)]"
                    />
                  ) : (
                    <p className="credential-font rounded-md border border-slate-300 bg-white px-3 py-1.5 text-center text-sm leading-tight tracking-[0.16em] text-slate-900 shadow-[var(--shadow-soft)]">
                      <span>Race - </span>
                      <span>{profile.race}</span>
                    </p>
                  )}
                </div>
                <div>
                  {isEditView ? (
                    <input
                      value={profile.gender}
                      onChange={(event) => setProfile((prev) => ({ ...prev, gender: event.target.value }))}
                      aria-label="Gender"
                      className="credential-font w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-center text-sm leading-tight tracking-[0.16em] text-slate-900 shadow-[var(--shadow-soft)] outline-none transition focus:border-[var(--accent-blue)]"
                    />
                  ) : (
                    <p className="credential-font rounded-md border border-slate-300 bg-white px-3 py-1.5 text-center text-sm leading-tight tracking-[0.16em] text-slate-900 shadow-[var(--shadow-soft)]">
                      <span>Gender - </span>
                      <span>{profile.gender}</span>
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  {isEditView ? (
                    <div className="grid grid-cols-3 gap-2">
                      {MODELING_CAPABILITIES.map((capability) => {
                        const active = profile.modelingCapabilities.includes(capability);

                        return (
                          <button
                            key={capability}
                            type="button"
                            onClick={() => toggleModelingCapability(capability)}
                            className={`credential-font flex min-h-9 items-center justify-center rounded-md border px-3 py-1.5 text-center text-sm leading-tight tracking-[0.16em] shadow-[var(--shadow-soft)] transition ${
                              active
                                ? "border-slate-300 bg-white text-slate-900"
                                : "border-slate-200 bg-white/45 text-slate-400 hover:border-slate-300 hover:text-slate-700"
                            }`}
                          >
                            {capability}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`grid gap-2 ${modelingCapabilityCount === 1 ? "grid-cols-1" : modelingCapabilityCount === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {(modelingCapabilityCount > 0 ? activeModelingCapabilities : ["Not specified"]).map((capability) => (
                        <span
                          key={capability}
                          className="credential-font flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-center text-sm leading-tight tracking-[0.16em] text-slate-900 shadow-[var(--shadow-soft)]"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[230px] space-y-2 lg:w-[394px] lg:max-w-none lg:justify-self-center lg:self-center">
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-[#ced6ce] bg-[linear-gradient(180deg,#e6ece6_0%,#dfe6df_100%)] lg:h-[700px]">
              {showcaseImage ? (
                <button
                  type="button"
                  aria-label="Open talent showcase"
                  className="absolute inset-0 z-10 cursor-zoom-in appearance-none border-0 bg-transparent p-0"
                  onClick={() =>
                    setMediaPreview({
                      src: showcaseImage,
                      title: "Talent showcase",
                      type: "image",
                    })
                  }
                >
                  <Image
                    src={showcaseImage}
                    alt="Talent showcase"
                    fill
                    sizes="(min-width: 1024px) 394px, 230px"
                    className="object-contain object-center"
                    unoptimized
                  />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center">
                  <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5f6b61]">9:16 Talent Showcase</span>
                </div>
              )}
              {isEditView ? (
                <ViewportEditControls>
                  <label className={viewportEditControlClassName}>
                    Upload Showcase
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => imageToDataUrl(event, setShowcaseImage)}
                    />
                  </label>
                </ViewportEditControls>
              ) : null}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[230px] space-y-2 lg:w-auto lg:max-w-none lg:justify-self-end lg:self-center">
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-[#d8d4ca] bg-[linear-gradient(180deg,#f7f6f2_0%,#efede7_100%)] lg:h-[700px] lg:w-auto">
              {cardPlaceholderImage ? (
                <button
                  type="button"
                  aria-label="Open talent card visual"
                  className="absolute inset-0 z-10 cursor-zoom-in appearance-none border-0 bg-transparent p-0"
                  onClick={() =>
                    setMediaPreview({
                      src: cardPlaceholderImage,
                      title: "Talent card visual",
                      type: "image",
                      allowDownload: true,
                    })
                  }
                >
                  <Image
                    src={cardPlaceholderImage}
                    alt="Talent card placeholder"
                    fill
                    sizes="(min-width: 1024px) 394px, 230px"
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ) : (
                <div className="h-full w-full p-4">
                  <div className="mb-3 rounded-lg border border-[#ddd8cc] bg-white/85 p-3">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <p className="text-3xl font-bold tracking-[0.06em] text-[#2f2f2d]">Compcard card here</p>
                      <div className="h-9 w-9 rounded bg-[conic-gradient(from_0deg,#aaa_0_10%,#fff_10_20%,#aaa_20_30%,#fff_30_40%,#aaa_40_50%,#fff_50_60%,#aaa_60_70%,#fff_70_80%,#aaa_80_90%,#fff_90_100%)]" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.09em] text-[#7e7a73]">Model sheet placeholder</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={`card-ph-${idx}`}
                        className="aspect-[3/4] rounded-md border border-[#e0dbcf] bg-gradient-to-br from-[#eceae4] to-[#f9f8f5]"
                      />
                    ))}
                  </div>
                </div>
              )}
              {isEditView ? (
                <ViewportEditControls>
                  <label className={viewportEditControlClassName}>
                    Upload Card Visual
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => imageToDataUrl(event, setCardPlaceholderImage)}
                    />
                  </label>
                  {isAdmin && cardPlaceholderImage ? (
                    <button
                      type="button"
                      onClick={() => setCardPlaceholderImage(null)}
                      className={viewportEditControlClassName}
                    >
                      Remove Card Visual
                    </button>
                  ) : null}
                </ViewportEditControls>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="card-surface min-w-0 space-y-4 overflow-hidden p-5">
        <SectionHeader title="Names I Have Worked With" kicker="Past Experience" />
        {isEditView ? (
          <SectionTemplatePicker
            sectionId="brand-experience"
            selectedTemplateId={sectionTemplates["brand-experience"]}
            onTemplateChange={updateSectionTemplate}
          />
        ) : null}
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Select a brand to reveal content highlights.</p>
          <p className="text-xs text-[var(--text-secondary)]/80">
            Scroll with your mouse or trackpad. Auto motion resumes after 20 seconds of no interaction.
          </p>
        </div>
        <div
          ref={brandCarouselViewportRef}
          className={`relative min-w-0 max-w-full overflow-hidden ${
            sectionTemplates["brand-experience"] === "compact-rail"
              ? "h-[292px] rounded-[18px] border border-[#d9e4db] bg-[#f7faf8]"
              : "h-[330px] rounded-[32px]"
          }`}
          onPointerDown={registerCarouselInteraction}
          onTouchStart={registerCarouselInteraction}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-white via-white/88 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white via-white/88 to-transparent" />
          <div
            ref={brandCarouselRef}
            className={`absolute left-0 flex w-max pb-4 pt-1 will-change-transform ${
              sectionTemplates["brand-experience"] === "compact-rail" ? "top-4 gap-4 px-4" : "top-2 gap-6 px-6"
            }`}
          >
            {carouselBrands.map(({ brand, groupIndex }, index) => (
              <BrandSelectionButton
                key={`${brand}-${groupIndex}-${index}`}
                brand={brand}
                active={brand === selectedBrand}
                onClick={() => {
                  registerCarouselInteraction();
                  setSelectedBrand((prev) => (prev === brand ? undefined : brand));
                }}
              />
            ))}
          </div>
        </div>
        {isEditView ? (
          <div className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                Manage Brand Experience
              </p>
              <span className="rounded-full bg-[#edf5ef] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#315844]">
                {brands.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <SelectedBrandTag
                  key={`${brand}-edit`}
                  brand={brand}
                  onRemove={() => removeBrand(brand)}
                />
              ))}
            </div>
            <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[#f8fbf9] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Brand library</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Search known brands, then keep custom entry as a fallback.
                  </p>
                </div>
                <span className="rounded-full border border-[#d9e4db] bg-white px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  Catalog-backed UI
                </span>
              </div>
              <input
                value={brandSearch}
                onChange={(event) => setBrandSearch(event.target.value)}
                placeholder="Search brand library or type a custom brand"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent-blue)]"
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {brandLibraryResults.map((entry) => (
                  <BrandLibraryCard
                    key={entry.name}
                    entry={entry}
                    onAdd={() => addBrand(entry.name)}
                  />
                ))}
              </div>
              {brandLibraryResults.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No library matches yet. You can still add a custom brand below.
                </p>
              ) : null}
              {customBrandCandidate ? (
                <button
                  onClick={() => addBrand(customBrandCandidate)}
                  className="inline-flex rounded-xl bg-[var(--accent-blue)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105"
                >
                  Add &quot;{customBrandCandidate}&quot; as custom brand
                </button>
              ) : (
                <p className="text-xs text-[var(--text-secondary)]">
                  Typed brands that are not in the library can still be saved and shown with a fallback mark.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <div
        className={`overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${
          selectedBrandCollection && selectedBrand ? "max-h-[5200px] translate-y-0 opacity-100" : "max-h-0 -translate-y-3 opacity-0"
        }`}
      >
        {selectedBrandCollection && selectedBrand ? (
          <section className="card-surface space-y-4 p-5">
            <SectionHeader title="Content Highlight" kicker="Brand Focus" />
            {isEditView ? (
              <SectionTemplatePicker
                sectionId="content-highlight"
                selectedTemplateId={sectionTemplates["content-highlight"]}
                onTemplateChange={updateSectionTemplate}
              />
            ) : null}
            <div
              className={`grid gap-4 ${
                sectionTemplates["content-highlight"] === "gallery-focus"
                  ? "xl:grid-cols-[0.95fr_1.05fr]"
                  : "xl:grid-cols-[1.2fr_0.9fr]"
              }`}
            >
              <article className="relative overflow-hidden rounded-[28px] border border-[#b9d3bf] bg-white p-5 shadow-[0_18px_44px_rgba(23,77,56,0.12)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-[#174d38]" />
                <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#174d38]">
                      Selected brand
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-[#102018]">{selectedBrandCollection.headline}</h3>
                    <p className="mt-2 inline-flex rounded-full border border-[#c9a84c]/50 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#174d38]">
                      {selectedBrand}
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                      {selectedBrandCollection.summary}
                    </p>
                  </div>
                  {selectedBrandCampaignInfo ? (
                    <div className="grid gap-2">
                      {[
                        ["Campaign launched", selectedBrandCampaignInfo.launched],
                        ["Theme", selectedBrandCampaignInfo.theme],
                        ["Type", selectedBrandCampaignInfo.type],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-[#d9c27e]/60 bg-white/80 px-4 py-3 shadow-[0_10px_26px_rgba(23,77,56,0.08)]"
                        >
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#6f6a45]">
                            {label}
                          </p>
                          <p
                            className={`mt-1 text-sm font-semibold ${
                              value ? "text-[#112018]" : "text-[var(--text-secondary)]"
                            }`}
                          >
                            {value || "Not specified"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                {isEditView ? (
                  <div className="mt-4 grid gap-2 rounded-xl border border-[#b9d3bf] bg-white/90 p-3 shadow-[0_10px_28px_rgba(23,77,56,0.08)] md:grid-cols-2">
                    <input
                      value={selectedBrandCollection.headline}
                      onChange={(event) => updateBrandHeadline(selectedBrand, "headline", event.target.value)}
                      className="rounded-lg border border-[#cbded0] px-3 py-2 text-sm outline-none transition placeholder:text-[#9aa79f] focus:border-[#174d38]"
                      placeholder="Brand highlight headline"
                    />
                    <input
                      value={selectedBrand}
                      disabled
                      className="rounded-lg border border-[#cbded0] bg-[#f7faf8] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none"
                    />
                    <textarea
                      rows={3}
                      value={selectedBrandCollection.summary}
                      onChange={(event) => updateBrandHeadline(selectedBrand, "summary", event.target.value)}
                      className="rounded-lg border border-[#cbded0] px-3 py-2 text-sm outline-none transition placeholder:text-[#9aa79f] focus:border-[#174d38] md:col-span-2"
                      placeholder="Describe the selected brand content collection"
                    />
                    {selectedBrandCampaignInfo ? (
                      <>
                        <input
                          value={selectedBrandCampaignInfo.launched}
                          onChange={(event) => updateBrandCampaignInfo(selectedBrand, "launched", event.target.value)}
                          className="rounded-lg border border-[#cbded0] px-3 py-2 text-sm outline-none transition placeholder:text-[#9aa79f] focus:border-[#174d38]"
                          placeholder="Campaign launched"
                        />
                        <input
                          value={selectedBrandCampaignInfo.theme}
                          onChange={(event) => updateBrandCampaignInfo(selectedBrand, "theme", event.target.value)}
                          className="rounded-lg border border-[#cbded0] px-3 py-2 text-sm outline-none transition placeholder:text-[#9aa79f] focus:border-[#174d38]"
                          placeholder="Theme"
                        />
                        <input
                          value={selectedBrandCampaignInfo.type}
                          onChange={(event) => updateBrandCampaignInfo(selectedBrand, "type", event.target.value)}
                          className="rounded-lg border border-[#cbded0] px-3 py-2 text-sm outline-none transition placeholder:text-[#9aa79f] focus:border-[#174d38] md:col-span-2"
                          placeholder="e.g. Paid Media or Organic"
                          aria-label="Campaign type"
                        />
                      </>
                    ) : null}
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <button
                        type="button"
                        onClick={() => addBrandMediaWindow(selectedBrand, "image")}
                        className="rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                      >
                        Add Image Window
                      </button>
                      <button
                        type="button"
                        onClick={() => addBrandMediaWindow(selectedBrand, "video")}
                        className="rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                      >
                        Add Video Window
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>

              <article className="relative grid gap-3 overflow-hidden rounded-[28px] border border-[#c7d9cb] bg-white p-5 shadow-[0_18px_44px_rgba(23,77,56,0.1)]">
                <div className="absolute inset-x-0 top-0 h-1 bg-[#174d38]" />
                <div className="relative flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#174d38]">Deliverable mix</p>
                  <span className="rounded-full border border-[#c9a84c]/50 bg-[#fbf6e6] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#6f5d22]">
                    {selectedBrandCollection.items.length} assets
                  </span>
                </div>
                <div className="relative grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#c7d9cb] bg-white/82 p-4 shadow-[0_12px_28px_rgba(23,77,56,0.08)]">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#174d38]">Images</p>
                    <p className="mt-2 text-3xl font-bold text-[#174d38]">{selectedBrandMediaCounts.images}</p>
                  </div>
                  <div className="rounded-2xl border border-[#c7d9cb] bg-white/82 p-4 shadow-[0_12px_28px_rgba(23,77,56,0.08)]">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#174d38]">Videos</p>
                    <p className="mt-2 text-3xl font-bold text-[#174d38]">{selectedBrandMediaCounts.videos}</p>
                  </div>
                  {isEditView || selectedBrandMetrics.totalViews !== undefined ? (
                    <div className="rounded-2xl border border-[#c7d9cb] bg-white/82 p-4 shadow-[0_12px_28px_rgba(23,77,56,0.08)]">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#174d38]">Total views</p>
                      {isEditView ? (
                        <input
                          type="number"
                          min="0"
                          value={selectedBrandMetrics.totalViews ?? ""}
                          onChange={(event) => updateBrandMetric(selectedBrand, "totalViews", event.target.value)}
                          className="mt-2 w-full rounded-lg border border-[#cbded0] bg-white px-3 py-2 text-2xl font-bold outline-none transition placeholder:text-[#9aa79f] focus:border-[#174d38]"
                          placeholder="0"
                        />
                      ) : (
                        <p className="mt-2 text-3xl font-bold text-[#174d38]">
                          {formatMetricValue(selectedBrandMetrics.totalViews ?? 0)}
                        </p>
                      )}
                    </div>
                  ) : null}
                  {isEditView || selectedBrandMetrics.campaignCount !== undefined ? (
                    <div className="rounded-2xl border border-[#c7d9cb] bg-white/82 p-4 shadow-[0_12px_28px_rgba(23,77,56,0.08)]">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#174d38]">
                        Campaign count
                      </p>
                      {isEditView ? (
                        <input
                          type="number"
                          min="0"
                          value={selectedBrandMetrics.campaignCount ?? ""}
                          onChange={(event) => updateBrandMetric(selectedBrand, "campaignCount", event.target.value)}
                          className="mt-2 w-full rounded-lg border border-[#cbded0] bg-white px-3 py-2 text-2xl font-bold outline-none transition placeholder:text-[#9aa79f] focus:border-[#174d38]"
                          placeholder="Add count"
                        />
                      ) : (
                        <p className="mt-2 text-3xl font-bold text-[#174d38]">
                          {formatMetricValue(selectedBrandMetrics.campaignCount ?? 0)}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
                {isEditView ? (
                  <div className="rounded-2xl border border-[#d9c27e]/70 bg-[#fffaf0] p-4 shadow-[0_12px_28px_rgba(111,93,34,0.1)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#6f5d22]">
                        Average engagement calculator
                      </p>
                      {selectedBrandAverageEngagement !== null ? (
                        <span className="rounded-full border border-[#c9a84c]/50 bg-white px-3 py-1 text-xs font-bold text-[#174d38]">
                          {formatEngagementRate(selectedBrandAverageEngagement)}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          ["likes", "Likes"],
                          ["comments", "Comments"],
                          ["shares", "Shares"],
                          ["saves", "Saves"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="space-y-1">
                          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#6f5d22]">
                            {label}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={selectedBrandMetrics[key] ?? ""}
                            onChange={(event) => updateBrandMetric(selectedBrand, key, event.target.value)}
                            className="w-full rounded-lg border border-[#d9c27e]/70 bg-white px-3 py-2 text-sm font-semibold outline-none transition placeholder:text-[#9aa79f] focus:border-[#174d38]"
                            placeholder="0"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : selectedBrandAverageEngagement !== null ? (
                  <div className="rounded-2xl border border-[#d9c27e]/70 bg-[#fffaf0] p-4 shadow-[0_12px_28px_rgba(111,93,34,0.1)]">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6f5d22]">
                      Average engagement rate
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#174d38]">{formatEngagementRate(selectedBrandAverageEngagement)}</p>
                  </div>
                ) : null}
                <p className="text-sm text-[var(--text-secondary)]">
                  This highlight only appears when a brand is selected from the carousel.
                </p>
              </article>
            </div>
            <div
              className={`grid gap-4 xl:items-start ${
                sectionTemplates["content-highlight"] === "gallery-focus"
                  ? "xl:grid-cols-[1fr_1.25fr]"
                  : "xl:grid-cols-[1.2fr_1fr]"
              }`}
              onClick={clearBrandFeaturedSelection}
            >
              <div
                ref={highlightFeaturedColumnRef}
                className={`space-y-3 ${sectionTemplates["content-highlight"] === "gallery-focus" ? "xl:order-2" : ""}`}
              >
                {selectedBrandFeaturedItem ? (
                  <BrandMediaTile
                    item={selectedBrandFeaturedItem}
                    featured
                    selected
                    onSelect={() => toggleBrandFeaturedSelection(selectedBrandFeaturedItem.id)}
                    onMediaOpen={setMediaPreview}
                    forcedAspectRatio={featuredAnimatedAspectRatio}
                    editControls={
                      isEditView ? (
                        <>
                          <label className={viewportEditControlClassName}>
                            Upload Image or Video
                            <input
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={(event) => {
                                void uploadBrandMediaAsset(selectedBrand, selectedBrandFeaturedItem.id, event);
                              }}
                            />
                          </label>
                          {selectedBrandFeaturedItem.src ? (
                            <button
                              type="button"
                              onClick={() => removeBrandMediaAsset(selectedBrand, selectedBrandFeaturedItem.id)}
                              className={viewportEditControlClassName}
                            >
                              Remove Media
                            </button>
                          ) : null}
                        </>
                      ) : null
                    }
                  />
                ) : (
                  <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[#f7faf8] p-6 text-sm text-[var(--text-secondary)]">
                    Add media windows to start your content highlight.
                  </div>
                )}
                {isEditView && selectedBrandFeaturedItem ? (
                  <div
                    className="space-y-2 rounded-2xl border border-[var(--border)] bg-[#f8fbf9] p-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                        Window {selectedBrandCollection.items.findIndex((item) => item.id === selectedBrandFeaturedItem.id) + 1}
                      </p>
                      <MediaTypeBadge type={selectedBrandFeaturedItem.type} />
                    </div>
                    <input
                      value={selectedBrandFeaturedItem.title}
                      onChange={(event) =>
                        updateBrandMediaTitle(selectedBrand, selectedBrandFeaturedItem.id, event.target.value)
                      }
                      className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                      placeholder="Media title"
                    />
                  </div>
                ) : null}
              </div>
              <div
                ref={highlightWindowsViewportRef}
                className={`relative min-w-0 overflow-y-hidden border border-[var(--border)] bg-[linear-gradient(180deg,#fcfdfc_0%,#f3f8f4_100%)] p-3 ${
                  isEditView
                    ? "overflow-x-auto"
                    : "overflow-hidden"
                } ${sectionTemplates["content-highlight"] === "gallery-focus" ? "rounded-[18px] xl:order-1" : "rounded-[28px]"}`}
                style={!isEditView && isXlLayout ? { height: `${highlightWindowsHeightPx}px` } : undefined}
                onPointerDown={registerHighlightWindowsInteraction}
                onTouchStart={registerHighlightWindowsInteraction}
              >
                {!isEditView ? (
                  <>
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/88 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/88 to-transparent" />
                  </>
                ) : null}
                <div
                  ref={highlightWindowsTrackRef}
                  className={`grid w-max grid-flow-col grid-rows-2 auto-cols-max gap-4 pr-1 will-change-transform ${
                    !isEditView && isXlLayout ? "h-full content-between" : ""
                  }`}
                >
                  {highlightWindowsCarouselItems.map(({ item, groupIndex }, index) => (
                    <div
                      key={`${item.id}-${groupIndex}-${index}`}
                      className="shrink-0 space-y-3"
                      style={{ width: `${getSideWindowWidth(item)}px` }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <BrandMediaTile
                        item={item}
                        selected={item.id === selectedBrandFeaturedItem?.id}
                        onSelect={() => toggleBrandFeaturedSelection(item.id)}
                        forcedAspectRatio={resolveSideWindowAspectRatio(item)}
                        editControls={
                          isEditView ? (
                            <>
                              <label className={viewportEditControlClassName}>
                                Upload Image or Video
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  className="hidden"
                                  onChange={(event) => {
                                    void uploadBrandMediaAsset(selectedBrand, item.id, event);
                                  }}
                                />
                              </label>
                              {item.src ? (
                                <button
                                  type="button"
                                  onClick={() => removeBrandMediaAsset(selectedBrand, item.id)}
                                  className={viewportEditControlClassName}
                                >
                                  Remove Media
                                </button>
                              ) : null}
                            </>
                          ) : null
                        }
                      />
                      {isEditView ? (
                        <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[#f8fbf9] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                              Window {selectedBrandCollection.items.findIndex((entry) => entry.id === item.id) + 1}
                            </p>
                            <MediaTypeBadge type={item.type} />
                          </div>
                          <input
                            value={item.title}
                            onChange={(event) => updateBrandMediaTitle(selectedBrand, item.id, event.target.value)}
                            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                            placeholder="Media title"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <section className="card-surface space-y-4 p-5">
        <SectionHeader title="Content Wall" kicker="Talent Showcase" />
        {isEditView ? (
          <SectionTemplatePicker
            sectionId="content-wall"
            selectedTemplateId={sectionTemplates["content-wall"]}
            onTemplateChange={updateSectionTemplate}
          />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Always-on showcase of the talent&apos;s own content style, regardless of brand selection.
          </p>
          <p className="rounded-full bg-[#edf5ef] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#315844]">
            {talentContentWall.headline}
          </p>
        </div>
        <div
          className={`grid gap-4 xl:items-start ${
            sectionTemplates["content-wall"] === "collection-grid" ? "xl:grid-cols-[0.95fr_1.15fr]" : "xl:grid-cols-[1.2fr_1fr]"
          }`}
        >
          <div className={`space-y-3 ${sectionTemplates["content-wall"] === "collection-grid" ? "xl:order-2" : ""}`}>
            {selectedTalentFeaturedItem ? (
              <>
                <div
                  className="relative touch-pan-y overflow-hidden overscroll-contain py-5"
                  onPointerCancel={() => {
                    talentCollectionSwipeRef.current = { pointerId: 0, startX: 0, startY: 0 };
                  }}
                >
                  <div className="pointer-events-none invisible relative z-0 mx-auto w-full" style={{ maxWidth: `${selectedTalentFeaturedMaxWidthPx}px` }}>
                    <BrandMediaTile
                      item={selectedTalentFeaturedItem}
                      featured
                      showDetails={false}
                      forcedAspectRatio={selectedTalentFeaturedAspectRatio}
                    />
                  </div>
                  {talentCollectionStackItems.map(({ collection, offset }) => {
                    const stackItem = getTalentCollectionFeaturedItem(collection);
                    if (!stackItem) return null;

                    const stackAspectRatio = resolveMediaAspectRatio(stackItem, true);
                    const offsetDirection = offset < 0 ? -1 : offset > 0 ? 1 : 0;
                    const translateOffset = "clamp(118px, 17vw, 190px)";
                    const isActiveStackItem = offset === 0;
                    const stackScale = isActiveStackItem ? 1 : 0.93;
                    const stackOpacity = isActiveStackItem ? 1 : 0.54;
                    const stackZIndex = isActiveStackItem ? 10 : 1;

                    return (
                      <div
                        key={collection.id}
                        onClick={() => {
                          if (!isActiveStackItem) setActiveTalentCollection(collection.id);
                        }}
                        onPointerDown={handleTalentCollectionPointerDown}
                        onPointerUp={handleTalentCollectionPointerUp}
                        onWheel={handleTalentCollectionWheel}
                        role="button"
                        tabIndex={0}
                        className={`absolute bottom-5 left-1/2 w-full transition-[max-width,opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isActiveStackItem ? "cursor-grab active:cursor-grabbing" : "hover:opacity-[0.74]"
                        }`}
                        style={{
                          maxWidth: `${getFeaturedMediaMaxWidthPx(stackAspectRatio)}px`,
                          opacity: stackOpacity,
                          zIndex: stackZIndex,
                          transform: `translateX(calc(-50% + ${offsetDirection} * ${translateOffset})) scale(${stackScale})`,
                        }}
                        aria-label={`Show ${collection.title}`}
                      >
                        <BrandMediaTile
                          item={stackItem}
                          featured
                          showDetails={false}
                          forcedAspectRatio={stackAspectRatio}
                          onMediaOpen={isActiveStackItem ? setMediaPreview : undefined}
                          editControls={
                            isEditView && isActiveStackItem ? (
                              <>
                                <label className={viewportEditControlClassName}>
                                  Upload Image or Video
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={(event) => {
                                      void uploadTalentMediaAsset(stackItem.id, event);
                                    }}
                                  />
                                </label>
                                {stackItem.src ? (
                                  <button
                                    type="button"
                                    onClick={() => removeTalentMediaAsset(stackItem.id)}
                                    className={viewportEditControlClassName}
                                  >
                                    Remove Media
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => deleteTalentMediaWindow(stackItem.id)}
                                  className={viewportEditControlClassName}
                                >
                                  Delete Window
                                </button>
                              </>
                            ) : null
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                {!isEditView ? (
                  <FeaturedMediaCaption
                    title={activeTalentCollection?.title ?? selectedTalentFeaturedItem.title}
                    description={activeTalentCollection?.description ?? selectedTalentFeaturedItem.description ?? ""}
                    mediaAspectRatio={selectedTalentFeaturedAspectRatio}
                    isEditView={false}
                    onTitleChange={(value) =>
                      activeTalentCollection
                        ? updateTalentCollectionText(activeTalentCollection.id, "title", value)
                        : updateTalentMediaTitle(selectedTalentFeaturedItem.id, value)
                    }
                    onDescriptionChange={(value) =>
                      activeTalentCollection
                        ? updateTalentCollectionText(activeTalentCollection.id, "description", value)
                        : updateTalentMediaDescription(selectedTalentFeaturedItem.id, value)
                    }
                  />
                ) : null}
              </>
            ) : (
              <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[#f7faf8] p-6 text-sm text-[var(--text-secondary)]">
                Add media windows to start your content wall.
              </div>
            )}
          </div>
          <div
            ref={talentWallWindowsViewportRef}
            className={`relative min-w-0 overflow-hidden border border-[var(--border)] bg-[linear-gradient(180deg,#fcfdfc_0%,#f3f8f4_100%)] ${
              sectionTemplates["content-wall"] === "collection-grid" ? "rounded-[18px] xl:order-1" : "rounded-[28px]"
            }`}
            style={{ height: `${talentWallViewportHeightPx}px` }}
          >
            <div
              ref={talentWallWindowsScrollRef}
              onScroll={syncTalentWallScrollHint}
              className="h-full overflow-y-auto overflow-x-hidden scroll-smooth p-3"
            >
              <div ref={talentWallWindowsTrackRef} className="grid gap-4 pr-1 sm:grid-cols-2">
                {talentSideItems.map((item) => (
                  <div key={item.id} className="space-y-3">
                    <BrandMediaTile
                      item={item}
                      onSelect={() => toggleTalentFeaturedSelection(item.id)}
                      forcedAspectRatio={TALENT_WALL_SIDE_TILE_ASPECT_RATIO}
                      cropMedia
                      editControls={
                        isEditView ? (
                          <>
                            <label className={viewportEditControlClassName}>
                              Upload Image or Video
                              <input
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(event) => {
                                  void uploadTalentMediaAsset(item.id, event);
                                }}
                              />
                            </label>
                            {item.src ? (
                              <button
                                type="button"
                                onClick={() => removeTalentMediaAsset(item.id)}
                                className={viewportEditControlClassName}
                              >
                                Remove Media
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => deleteTalentMediaWindow(item.id)}
                              className={viewportEditControlClassName}
                            >
                              Delete Window
                            </button>
                          </>
                        ) : null
                      }
                    />
                    {isEditView ? (
                      <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[#f8fbf9] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                            Window {(activeTalentCollection?.items ?? []).findIndex((entry) => entry.id === item.id) + 1}
                          </p>
                          <MediaTypeBadge type={item.type} />
                        </div>
                        <input
                          value={item.title}
                          onChange={(event) => updateTalentMediaTitle(item.id, event.target.value)}
                          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                          placeholder="Media title"
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            {showTalentWallScrollHint ? (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 animate-pulse flex-col items-center rounded-full border border-white/80 bg-white/88 px-4 py-2 shadow-[0_10px_26px_rgba(16,33,24,0.16)]">
                <span className="h-3 w-3 rotate-45 border-b-2 border-r-2 border-[#174d38]" />
                <span className="-mt-1 h-3 w-3 rotate-45 border-b-2 border-r-2 border-[#174d38]/75" />
              </div>
            ) : null}
          </div>
        </div>
        {isEditView ? (
          <div className="space-y-3 rounded-xl border border-[var(--border)] bg-white p-3">
            <div className="max-h-[96px] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
                {talentCollections.map((collection, index) => {
                  const active = collection.id === activeTalentCollection?.id;

                  return (
                    <div
                      key={collection.id}
                      draggable
                      onDragStart={(event) => {
                        draggedTalentCollectionIdRef.current = collection.id;
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", collection.id);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const draggedCollectionId =
                          event.dataTransfer.getData("text/plain") || draggedTalentCollectionIdRef.current;
                        draggedTalentCollectionIdRef.current = null;
                        if (draggedCollectionId) {
                          reorderTalentCollection(draggedCollectionId, collection.id);
                        }
                      }}
                      onDragEnd={() => {
                        draggedTalentCollectionIdRef.current = null;
                      }}
                      className={`flex min-w-[220px] cursor-grab items-center gap-2 rounded-lg border px-3 py-2 active:cursor-grabbing ${
                        active ? "border-[#174d38] bg-[#f1f7f3]" : "border-[var(--border)] bg-[#f8fbf9]"
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464]">
                        {index + 1}
                      </span>
                      <input
                        value={collection.title}
                        onFocus={() => setActiveTalentCollection(collection.id)}
                        onClick={() => setActiveTalentCollection(collection.id)}
                        onChange={(event) => updateTalentCollectionText(collection.id, "title", event.target.value)}
                        className="min-w-0 flex-1 bg-transparent px-1 text-sm font-semibold outline-none"
                        aria-label={`Rename ${collection.title}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            {activeTalentCollection ? (
              <div className="grid gap-2 md:grid-cols-[minmax(220px,0.35fr)_1fr]">
                <input
                  value={activeTalentCollection.title}
                  onChange={(event) => updateTalentCollectionText(activeTalentCollection.id, "title", event.target.value)}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold outline-none transition focus:border-[var(--accent-blue)]"
                  placeholder="Collection title"
                />
                <input
                  value={activeTalentCollection.description}
                  onChange={(event) =>
                    updateTalentCollectionText(activeTalentCollection.id, "description", event.target.value)
                  }
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                  placeholder="Collection description"
                />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={addTalentCollection}
                  className="rounded-lg border border-[#8f8168] bg-[#8f8168] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:border-[#766950] hover:bg-[#766950]"
                >
                  Add Collection
                </button>
                <button
                  type="button"
                  onClick={() => addTalentMediaWindow("image")}
                  className="rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                >
                  Add Image Window
                </button>
                <button
                  type="button"
                  onClick={() => addTalentMediaWindow("video")}
                  className="rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                >
                  Add Video Window
                </button>
            </div>
          </div>
        ) : null}
      </section>

      <AnalyticsCharts
        kicker="Talent Data"
        caption={dataCaption}
        isEditView={isEditView}
        data={talentAnalyticsData}
        onDataChange={setTalentAnalyticsData}
        rateCardItems={rateCardItems}
        onRateCardItemsChange={setRateCardItems}
      />
    </div>
  );
}
