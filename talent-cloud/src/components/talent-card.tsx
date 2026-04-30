"use client";

import Image from "next/image";
import {
  ChangeEvent,
  MouseEvent,
  PointerEvent,
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
import { CredentialBadge } from "@/components/credential-badge";
import {
  DEFAULT_TALENT_SECTION_TEMPLATES,
  resolveTalentSectionTemplates,
  SectionTemplatePicker,
} from "@/components/talent-section-template-picker";
import type { TalentSectionId, TalentSectionTemplateSelection } from "@/components/talent-section-template-picker";
import { useUserRole } from "@/context/user-role-context";
import { BRAND_CATALOG, BrandCatalogEntry, getBrandCatalogEntry, normalizeBrandName } from "@/lib/brand-catalog";
import { Creator } from "@/lib/types";

type TalentCardProps = {
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
};

type BrandMediaItem = {
  id: string;
  type: "image" | "video";
  title: string;
  src: string | null;
  aspectRatio: number | null;
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
};

type TalentCardDraftData = {
  profile?: Partial<ProfileState>;
  cardTypeLabel?: string;
  talentShowcaseTemplateId?: TalentShowcaseTemplateId;
  keyPointLabels?: Partial<Record<KeyPointId, string>>;
  keyPointIconSelections?: Partial<Record<KeyPointId, KeyPointIconId>>;
  activeKeyPointIds?: KeyPointId[];
  headshotImage?: string | null;
  showcaseImage?: string | null;
  cardPlaceholderImage?: string | null;
  cardVisualItems?: BrandMediaItem[];
  socialLinks?: SocialLinks;
  brands?: string[];
  talentContentWall?: BrandMediaCollection;
  brandMediaCollections?: Record<string, BrandMediaCollection>;
  brandFeatureSelectionByBrand?: Record<string, string | null>;
  talentFeatureSelectionId?: string | null;
  sectionTemplates?: TalentSectionTemplateSelection;
  analyticsData?: TalentAnalyticsData;
  rateCardItems?: RateCardTextBox[];
};

type TalentShowcaseTemplateId = "three-panel" | "right-viewport" | "viewport-table";

type KeyPointId = "niche" | "audience" | "contentDescription";
type KeyPointIconId = "hanger" | "eye" | "camera" | "target";

type MediaPreview = {
  src: string;
  title: string;
  type: BrandMediaItem["type"];
};

type SocialLinks = {
  instagram: string;
  tiktok: string;
};

const TALENT_SHOWCASE_TEMPLATES: Array<{
  id: TalentShowcaseTemplateId;
  name: string;
  description: string;
}> = [
  {
    id: "three-panel",
    name: "Template 1",
    description: "Profile cards with both showcase and card visual viewports.",
  },
  {
    id: "right-viewport",
    name: "Template 2",
    description: "Profile cards with the card visual centered after removing the middle viewport.",
  },
  {
    id: "viewport-table",
    name: "Template 3",
    description: "Template 2 profile column with a six-window visual table.",
  },
];

const BRAND_CAROUSEL_PAUSE_MS = 20000;
const KEY_POINT_ICON_LIBRARY: Array<{
  id: KeyPointIconId;
  label: string;
  src: string;
  scaleClassName?: string;
}> = [
  { id: "hanger", label: "Hanger", src: "/Icons/hanger.png", scaleClassName: "scale-110" },
  { id: "eye", label: "Eye", src: "/Icons/eye.png", scaleClassName: "scale-125" },
  { id: "camera", label: "Camera", src: "/Icons/camera.png" },
  { id: "target", label: "Target", src: "/Icons/audience-target.png" },
];
const DEFAULT_KEY_POINT_ICONS: Record<KeyPointId, KeyPointIconId> = {
  niche: "hanger",
  audience: "eye",
  contentDescription: "camera",
};
const DEFAULT_KEY_POINT_LABELS: Record<KeyPointId, string> = {
  niche: "My Niche",
  audience: "My Audience",
  contentDescription: "My Content Strategy",
};
const CARD_VISUAL_MAX_ITEMS = 6;
const CARD_VISUAL_TABLE_SLOT_COUNT = 6;
const CARD_VISUAL_AUTO_ADVANCE_MS = 7000;
const CARD_VISUAL_INTERACTION_PAUSE_MS = 20000;
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
  };
}

function normalizeProfileDraft(creator: Creator, draftProfile?: Partial<ProfileState>): ProfileState {
  return {
    ...createDefaultProfile(creator),
    ...draftProfile,
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

function stringifyDraft(data: TalentCardDraftData) {
  return JSON.stringify(data);
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

type KeyPointCard = {
  id: KeyPointId;
  label: string;
  iconId: KeyPointIconId;
  multiline?: boolean;
};

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
        <div className="grid min-w-[240px] max-w-[430px] flex-1 grid-cols-2 gap-2">
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

function createMediaItem(id: string, type: BrandMediaItem["type"], title: string): BrandMediaItem {
  return { id, type, title, src: null, aspectRatio: null };
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
      createMediaItem(`${normalizedName}-talent-still-01`, "image", "Editorial still 01"),
      createMediaItem(`${normalizedName}-talent-still-02`, "image", "Lifestyle still 02"),
      createMediaItem(`${normalizedName}-talent-video-02`, "video", "Campaign cutdown"),
      createMediaItem(`${normalizedName}-talent-still-03`, "image", "Behind-the-scenes 03"),
    ],
  };
}

function createDefaultCardVisualItems(creator: Creator): BrandMediaItem[] {
  return [
    {
      id: `${creator.id}-card-visual-01`,
      type: "image",
      title: "Card visual 01",
      src: creator.cardPlaceholderImage ?? null,
      aspectRatio: 9 / 16,
    },
  ];
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

function BrandMediaTile({
  item,
  featured = false,
  showDetails = true,
  selected = false,
  onSelect,
  forcedAspectRatio,
}: {
  item: BrandMediaItem;
  featured?: boolean;
  showDetails?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  forcedAspectRatio?: number;
}) {
  const mediaAspectRatio = forcedAspectRatio ?? resolveMediaAspectRatio(item, featured);
  const isInteractive = Boolean(onSelect);
  const isSideWindow = !featured && typeof forcedAspectRatio === "number";
  const shouldWarpSideVideo = isSideWindow && item.type === "video";
  const featuredWidthProgress = Math.min(
    1,
    Math.max(0, (mediaAspectRatio - FEATURED_MEDIA_MIN_RATIO) / (FEATURED_MEDIA_MAX_RATIO - FEATURED_MEDIA_MIN_RATIO))
  );
  const featuredMaxWidthPx =
    FEATURED_MEDIA_MIN_MAX_WIDTH_PX +
    featuredWidthProgress * (FEATURED_MEDIA_MAX_MAX_WIDTH_PX - FEATURED_MEDIA_MIN_MAX_WIDTH_PX);
  const tileStyle = featured
    ? {
        aspectRatio: mediaAspectRatio,
        maxWidth: `${Math.round(featuredMaxWidthPx)}px`,
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
        featured ? "min-h-[320px]" : "min-h-[200px]"
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
            <Image src={item.src} alt={item.title} fill className="object-contain" sizes={featured ? "50vw" : "25vw"} />
          </div>
        ) : (
          <video
            src={item.src}
            className={`absolute inset-0 h-full w-full ${
              shouldWarpSideVideo ? "object-cover scale-[1.07]" : "object-contain"
            }`}
            muted
            loop
            autoPlay
            playsInline
          />
        )
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(224,240,229,0.9),rgba(235,241,236,0.72)_45%,rgba(247,249,246,1)_100%)]" />
      )}

      <div className="absolute inset-x-0 top-0 p-4">
        <div className="flex items-start justify-between gap-3">
          <MediaTypeBadge type={item.type} />
          <span className="rounded-full bg-[#f4f8f5]/90 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {featured ? "Feature" : "Media"}
          </span>
        </div>
      </div>

      {showDetails ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#102118]/90 via-[#102118]/55 to-transparent px-4 pb-4 pt-16 text-white">
          <p className={`font-semibold ${featured ? "text-lg" : "text-sm"}`}>{item.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/72">
            {item.src ? "Uploaded by talent" : "Awaiting upload"}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function KeyPointIcon({ iconId, size = "large" }: { iconId: KeyPointIconId; size?: "large" | "small" }) {
  const icon = KEY_POINT_ICON_LIBRARY.find((entry) => entry.id === iconId) ?? KEY_POINT_ICON_LIBRARY[0];
  const sizeClassName = size === "large" ? "h-[106px] w-[106px]" : "h-8 w-8";

  return (
    <Image
      src={icon.src}
      alt=""
      width={size === "large" ? 106 : 32}
      height={size === "large" ? 106 : 32}
      className={`${sizeClassName} object-contain ${icon.scaleClassName ?? ""}`}
      aria-hidden
    />
  );
}

function MediaPreviewDialog({ media, onClose }: { media: MediaPreview; onClose: () => void }) {
  const [isZoomed, setIsZoomed] = useState(false);

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
        <div className="flex items-center justify-between gap-3 border-b border-white/12 px-4 py-3 text-white sm:px-5">
          <p className="truncate text-sm font-semibold">{media.title}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl leading-none text-white transition hover:bg-white/18"
            aria-label="Close media preview"
          >
            x
          </button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/28">
          {media.type === "image" ? (
            <button
              type="button"
              onClick={() => setIsZoomed((current) => !current)}
              className={`relative h-full w-full overflow-auto ${
                isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
              aria-label={isZoomed ? "Zoom out image" : "Zoom in image"}
            >
              <Image
                src={media.src}
                alt={media.title}
                fill={!isZoomed}
                width={isZoomed ? 1800 : undefined}
                height={isZoomed ? 2400 : undefined}
                sizes="100vw"
                className={
                  isZoomed
                    ? "mx-auto h-auto min-h-full w-auto max-w-none object-contain"
                    : "object-contain"
                }
                priority
                unoptimized
              />
            </button>
          ) : (
            <video src={media.src} className="h-full w-full object-contain" controls autoPlay playsInline />
          )}
        </div>
      </div>
    </div>
  );
}

export function TalentCard({ creator, viewer, isAdmin = false }: TalentCardProps) {
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
  const cardVisualPausedUntilRef = useRef(0);
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
  const [talentShowcaseTemplateId, setTalentShowcaseTemplateId] =
    useState<TalentShowcaseTemplateId>("right-viewport");
  const [activeKeyPointIds, setActiveKeyPointIds] = useState<KeyPointId[]>([]);
  const [keyPointLabels, setKeyPointLabels] = useState<Record<KeyPointId, string>>(DEFAULT_KEY_POINT_LABELS);
  const [keyPointIconSelections, setKeyPointIconSelections] =
    useState<Record<KeyPointId, KeyPointIconId>>(DEFAULT_KEY_POINT_ICONS);

  const [headshotImage, setHeadshotImage] = useState<string | null>(creator.headshotImage ?? null);
  const [showcaseImage, setShowcaseImage] = useState<string | null>(null);
  const [cardPlaceholderImage, setCardPlaceholderImage] = useState<string | null>(() =>
    creator.cardPlaceholderImage ?? (isAdmin ? "/Model 1/1.png" : null)
  );
  const [cardVisualItems, setCardVisualItems] = useState<BrandMediaItem[]>(() => createDefaultCardVisualItems(creator));
  const [activeCardVisualIndex, setActiveCardVisualIndex] = useState(0);
  const [cardVisualAspectRatios, setCardVisualAspectRatios] = useState<Record<string, number>>({});
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => createDefaultSocialLinks(creator.handle));

  const [brands, setBrands] = useState<string[]>(creator.brandsWorkedWith);
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const deferredBrandSearch = useDeferredValue(brandSearch);
  const [talentContentWall, setTalentContentWall] = useState<BrandMediaCollection>(() =>
    createDefaultTalentContentCollection(creator.name)
  );
  const [brandMediaCollections, setBrandMediaCollections] = useState<Record<string, BrandMediaCollection>>(() =>
    createBrandMediaCollections(creator.brandsWorkedWith)
  );
  const [brandFeatureSelectionByBrand, setBrandFeatureSelectionByBrand] = useState<Record<string, string | null>>({});
  const [talentFeatureSelectionId, setTalentFeatureSelectionId] = useState<string | null>(null);
  const [sectionTemplates, setSectionTemplates] = useState<Record<TalentSectionId, string>>(
    DEFAULT_TALENT_SECTION_TEMPLATES,
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

  const dataCaption =
    viewer === "creator"
      ? "Data updates as your content and campaigns change."
      : "Brand-view preview of this talent's performance.";

  const keyPointCards: KeyPointCard[] = [
    { id: "niche", label: keyPointLabels.niche, iconId: keyPointIconSelections.niche },
    { id: "audience", label: keyPointLabels.audience, iconId: keyPointIconSelections.audience },
    {
      id: "contentDescription",
      label: keyPointLabels.contentDescription,
      iconId: keyPointIconSelections.contentDescription,
      multiline: true,
    },
  ];
  const activeCardVisualItem = cardVisualItems[activeCardVisualIndex] ?? cardVisualItems[0] ?? null;
  const activeCardVisualAspectRatio = activeCardVisualItem
    ? Math.min(16 / 9, Math.max(9 / 16, cardVisualAspectRatios[activeCardVisualItem.id] ?? activeCardVisualItem.aspectRatio ?? 9 / 16))
    : 9 / 16;
  const activeCardVisualMaxWidthPx = Math.round(
    Math.min(560, Math.max(230, 700 * activeCardVisualAspectRatio)),
  );
  const usesModelStyleShowcase =
    talentShowcaseTemplateId === "right-viewport" || talentShowcaseTemplateId === "viewport-table";
  const usesViewportTableShowcase = talentShowcaseTemplateId === "viewport-table";
  const cardVisualTableSlots = Array.from(
    { length: CARD_VISUAL_TABLE_SLOT_COUNT },
    (_, index) => cardVisualItems[index] ?? null,
  );

  useEffect(() => {
    hasLoadedDraftRef.current = false;
    lastSavedDraftRef.current = "";
    setHasUnsavedChanges(false);
    setCardTypeLabel("Model");
    setTalentShowcaseTemplateId("right-viewport");
    setActiveKeyPointIds([]);
    setKeyPointLabels(DEFAULT_KEY_POINT_LABELS);
    setKeyPointIconSelections(DEFAULT_KEY_POINT_ICONS);
    setCardVisualItems(createDefaultCardVisualItems(creator));
    setCardVisualAspectRatios({});
    setActiveCardVisualIndex(0);
    setSectionTemplates(resolveTalentSectionTemplates());
  }, [creator, draftLoadKey]);

  useEffect(() => {
    if (!draftAccountId && !shouldLoadLatestCreatorDraft) {
      hasLoadedDraftRef.current = true;
      return;
    }

    let cancelled = false;

    async function loadDraft() {
      let appliedDraft = false;
      const searchParams = new URLSearchParams({
        creatorId: creator.id,
        template: "kol-card",
      });
      if (draftAccountId) {
        searchParams.set("accountId", draftAccountId);
      } else {
        searchParams.set("latestForCreator", "true");
      }

      try {
        const response = await fetch(`/api/drafts?${searchParams.toString()}`);
        const result = (await response.json()) as { draft?: { data?: TalentCardDraftData } | null };
        const draft = result.draft?.data;

        if (cancelled || !draft) return;

        appliedDraft = true;
        if (draft.profile) setProfile(normalizeProfileDraft(creator, draft.profile));
        if ("cardTypeLabel" in draft) setCardTypeLabel(draft.cardTypeLabel ?? "Model");
        setTalentShowcaseTemplateId(draft.talentShowcaseTemplateId ?? "right-viewport");
        setKeyPointLabels({ ...DEFAULT_KEY_POINT_LABELS, ...draft.keyPointLabels });
        setKeyPointIconSelections({ ...DEFAULT_KEY_POINT_ICONS, ...draft.keyPointIconSelections });
        setActiveKeyPointIds(draft.activeKeyPointIds ?? []);
        if ("headshotImage" in draft) setHeadshotImage(draft.headshotImage ?? null);
        if ("showcaseImage" in draft) setShowcaseImage(draft.showcaseImage ?? null);
        if ("cardPlaceholderImage" in draft) setCardPlaceholderImage(draft.cardPlaceholderImage ?? null);
        if (draft.cardVisualItems) {
          setCardVisualItems(draft.cardVisualItems);
        } else if ("cardPlaceholderImage" in draft) {
          setCardVisualItems([
            {
              id: `${creator.id}-card-visual-01`,
              type: "image",
              title: "Card visual 01",
              src: draft.cardPlaceholderImage ?? null,
              aspectRatio: 9 / 16,
            },
          ]);
        }
        if (draft.socialLinks) setSocialLinks({ ...createDefaultSocialLinks(creator.handle), ...draft.socialLinks });
        if (draft.brands) setBrands(draft.brands);
        if (draft.talentContentWall) setTalentContentWall(draft.talentContentWall);
        if (draft.brandMediaCollections) setBrandMediaCollections(draft.brandMediaCollections);
        if (draft.brandFeatureSelectionByBrand) setBrandFeatureSelectionByBrand(draft.brandFeatureSelectionByBrand);
        if ("talentFeatureSelectionId" in draft) setTalentFeatureSelectionId(draft.talentFeatureSelectionId ?? null);
        if (draft.sectionTemplates) setSectionTemplates(resolveTalentSectionTemplates(draft.sectionTemplates));
        if (draft.analyticsData) setTalentAnalyticsData(draft.analyticsData);
        if (draft.rateCardItems) setRateCardItems(draft.rateCardItems);
      } finally {
        if (!cancelled) {
          hasLoadedDraftRef.current = true;
          if (!appliedDraft && !lastSavedDraftRef.current) {
            lastSavedDraftRef.current = stringifyDraft(talentCardDraftRef.current);
          }
        }
      }
    }

    void loadDraft();

    return () => {
      cancelled = true;
    };
  }, [creator, creator.id, draftAccountId, shouldLoadLatestCreatorDraft]);

  const talentCardDraft = useMemo<TalentCardDraftData>(
    () => ({
      profile,
      cardTypeLabel,
      talentShowcaseTemplateId,
      keyPointLabels,
      keyPointIconSelections,
      activeKeyPointIds,
      headshotImage,
      showcaseImage,
      cardPlaceholderImage: cardVisualItems.find((item) => item.type === "image" && item.src)?.src ?? cardPlaceholderImage,
      cardVisualItems,
      socialLinks,
      brands,
      talentContentWall,
      brandMediaCollections,
      brandFeatureSelectionByBrand,
      talentFeatureSelectionId,
      sectionTemplates,
      analyticsData: talentAnalyticsData,
      rateCardItems,
    }),
    [
      activeKeyPointIds,
      brandFeatureSelectionByBrand,
      brandMediaCollections,
      brands,
      cardTypeLabel,
      cardPlaceholderImage,
      cardVisualItems,
      headshotImage,
      keyPointLabels,
      keyPointIconSelections,
      profile,
      rateCardItems,
      sectionTemplates,
      showcaseImage,
      socialLinks,
      talentShowcaseTemplateId,
      talentAnalyticsData,
      talentContentWall,
      talentFeatureSelectionId,
    ],
  );
  const talentCardDraftRef = useRef<TalentCardDraftData>(talentCardDraft);

  useEffect(() => {
    talentCardDraftRef.current = talentCardDraft;
  }, [talentCardDraft]);

  useEffect(() => {
    if (!hasLoadedDraftRef.current || lastSavedDraftRef.current) return;
    lastSavedDraftRef.current = stringifyDraft(talentCardDraft);
    setHasUnsavedChanges(false);
  }, [talentCardDraft]);

  useEffect(() => {
    if (!hasLoadedDraftRef.current) return;
    setHasUnsavedChanges(stringifyDraft(talentCardDraft) !== lastSavedDraftRef.current);
  }, [talentCardDraft]);

  useEffect(() => {
    if (cardVisualItems.length <= 1) return;

    const intervalId = window.setInterval(() => {
      if (Date.now() < cardVisualPausedUntilRef.current) return;
      setActiveCardVisualIndex((currentIndex) => (currentIndex + 1) % cardVisualItems.length);
    }, CARD_VISUAL_AUTO_ADVANCE_MS);

    return () => window.clearInterval(intervalId);
  }, [cardVisualItems.length]);

  useEffect(() => {
    if (activeCardVisualIndex < cardVisualItems.length) return;
    setActiveCardVisualIndex(0);
  }, [activeCardVisualIndex, cardVisualItems.length]);

  useEffect(() => {
    if (!mediaPreview) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMediaPreview(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mediaPreview]);

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

  const defaultTalentFeaturedItem = useMemo(
    () => talentContentWall.items.find((item) => item.type === "video") ?? talentContentWall.items[0] ?? null,
    [talentContentWall.items]
  );

  const selectedTalentFeaturedItem = useMemo(() => {
    if (!talentContentWall.items.length) return null;

    if (!talentFeatureSelectionId) {
      return defaultTalentFeaturedItem;
    }

    return talentContentWall.items.find((item) => item.id === talentFeatureSelectionId) ?? defaultTalentFeaturedItem;
  }, [defaultTalentFeaturedItem, talentContentWall.items, talentFeatureSelectionId]);

  const selectedTalentFeaturedAspectRatio = selectedTalentFeaturedItem
    ? resolveMediaAspectRatio(selectedTalentFeaturedItem, true)
    : 4 / 5;

  const talentSideItems = useMemo(
    () => talentContentWall.items.filter((item) => item.id !== selectedTalentFeaturedItem?.id),
    [selectedTalentFeaturedItem, talentContentWall.items]
  );
  const hasMoreTalentWallRows = talentSideItems.length > 4;

  const isEditControlMinimized = hasScrolledPastHeroStart;
  const editControlLabel = isEditView ? "Exit Edit View" : "Enter Edit View";

  const saveTalentDraft = useCallback(async () => {
    if (!draftAccountId || !hasLoadedDraftRef.current) return false;

    setIsSavingDraft(true);
    const draftToSave = talentCardDraftRef.current;

    try {
      const responses = await Promise.all([
        fetch("/api/drafts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: draftAccountId,
            creatorId: creator.id,
            template: "kol-card",
            data: draftToSave,
          }),
        }),
        fetch("/api/drafts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: draftAccountId,
            creatorId: creator.id,
            template: "kol-pane",
            data: {
              name: draftToSave.profile?.name ?? profile.name,
              niche: draftToSave.profile?.niche ?? profile.niche,
              audience: draftToSave.profile?.audience ?? profile.audience,
              contentDescription: draftToSave.profile?.contentDescription ?? profile.contentDescription,
              cardPlaceholderImage: draftToSave.cardPlaceholderImage ?? cardPlaceholderImage,
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
  }, [cardPlaceholderImage, creator.id, draftAccountId, profile]);

  const restoreLastSavedDraft = () => {
    const savedDraft = lastSavedDraftRef.current
      ? (JSON.parse(lastSavedDraftRef.current) as TalentCardDraftData)
      : null;

    if (!savedDraft) return;

    setProfile(normalizeProfileDraft(creator, savedDraft.profile));
    setCardTypeLabel(savedDraft.cardTypeLabel ?? "Model");
    setTalentShowcaseTemplateId(savedDraft.talentShowcaseTemplateId ?? "right-viewport");
    setActiveKeyPointIds(savedDraft.activeKeyPointIds ?? []);
    setKeyPointLabels({ ...DEFAULT_KEY_POINT_LABELS, ...savedDraft.keyPointLabels });
    setKeyPointIconSelections({ ...DEFAULT_KEY_POINT_ICONS, ...savedDraft.keyPointIconSelections });
    setHeadshotImage(savedDraft.headshotImage ?? creator.headshotImage ?? null);
    setShowcaseImage(savedDraft.showcaseImage ?? null);
    setCardPlaceholderImage(savedDraft.cardPlaceholderImage ?? creator.cardPlaceholderImage ?? (isAdmin ? "/Model 1/1.png" : null));
    setCardVisualItems(
      savedDraft.cardVisualItems ??
        [
          {
            id: `${creator.id}-card-visual-01`,
            type: "image",
            title: "Card visual 01",
            src: savedDraft.cardPlaceholderImage ?? creator.cardPlaceholderImage ?? null,
            aspectRatio: 9 / 16,
          },
        ],
    );
    setActiveCardVisualIndex(0);
    setSocialLinks({ ...createDefaultSocialLinks(creator.handle), ...savedDraft.socialLinks });
    setBrands(savedDraft.brands ?? creator.brandsWorkedWith);
    setTalentContentWall(savedDraft.talentContentWall ?? createDefaultTalentContentCollection(creator.name));
    setBrandMediaCollections(savedDraft.brandMediaCollections ?? createBrandMediaCollections(creator.brandsWorkedWith));
    setBrandFeatureSelectionByBrand(savedDraft.brandFeatureSelectionByBrand ?? {});
    setTalentFeatureSelectionId(savedDraft.talentFeatureSelectionId ?? null);
    setSectionTemplates(resolveTalentSectionTemplates(savedDraft.sectionTemplates));
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

  const updateTalentWall = (updater: (collection: BrandMediaCollection) => BrandMediaCollection) => {
    setTalentContentWall((prev) => updater(prev));
  };

  const updateTalentHeadline = (key: "headline" | "summary", value: string) => {
    updateTalentWall((collection) => ({
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
      const ordinal = collection.items.filter((item) => item.type === type).length + 1;

      return {
        ...collection,
        items: [
          ...collection.items,
          createMediaItem(
            `${normalizedName}-talent-${type}-${Date.now().toString(36)}`,
            type,
            type === "video" ? `Video window ${ordinal}` : `Image window ${ordinal}`
          ),
        ],
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
    setTalentFeatureSelectionId((prev) => {
      const currentlyDisplayedId = prev ?? defaultTalentFeaturedItem?.id ?? null;
      return currentlyDisplayedId === itemId ? null : itemId;
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
    }));
  };

  const uploadCardVisualAsset = async (event: ChangeEvent<HTMLInputElement>, targetIndex?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const existingTargetItem = typeof targetIndex === "number" ? cardVisualItems[targetIndex] : undefined;
    const isReplacingExistingVisual = Boolean(existingTargetItem?.src);
    if (!isReplacingExistingVisual && cardVisualItems.filter((item) => item.src).length >= CARD_VISUAL_MAX_ITEMS) {
      event.target.value = "";
      return;
    }

    const [src, aspectRatio] = await Promise.all([fileToDataUrl(file), getFileAspectRatio(file)]);
    const resolvedIndex =
      typeof targetIndex === "number" && targetIndex < cardVisualItems.length
        ? targetIndex
        : cardVisualItems.length;
    const nextItem: BrandMediaItem = {
      id: existingTargetItem?.id ?? `card-visual-${Date.now()}`,
      type: file.type.startsWith("video/") ? "video" : "image",
      title: existingTargetItem?.title ?? `Card visual ${String(resolvedIndex + 1).padStart(2, "0")}`,
      src,
      aspectRatio,
    };

    if (typeof targetIndex === "number" && targetIndex < cardVisualItems.length) {
      setCardVisualItems((items) => items.map((item, index) => (index === targetIndex ? nextItem : item)));
      setActiveCardVisualIndex(targetIndex);
    } else if (cardVisualItems.length === 1 && !cardVisualItems[0].src) {
      setCardVisualItems([{ ...nextItem, id: cardVisualItems[0].id, title: "Card visual 01" }]);
      setActiveCardVisualIndex(0);
    } else {
      setCardVisualItems((items) => [...items, nextItem]);
      setActiveCardVisualIndex(resolvedIndex);
    }
    if (nextItem.type === "image") {
      setCardPlaceholderImage(src);
    }
    event.target.value = "";
  };

  const registerCardVisualInteraction = () => {
    cardVisualPausedUntilRef.current = Date.now() + CARD_VISUAL_INTERACTION_PAUSE_MS;
  };

  const showCardVisualIndex = (index: number) => {
    if (cardVisualItems.length <= 0) return;
    registerCardVisualInteraction();
    setActiveCardVisualIndex((index + cardVisualItems.length) % cardVisualItems.length);
  };

  const updateCardVisualAspectRatio = (itemId: string, aspectRatio: number | null) => {
    if (!aspectRatio || aspectRatio <= 0) return;
    setCardVisualAspectRatios((current) => ({ ...current, [itemId]: aspectRatio }));
  };

  const handleCardVisualWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (cardVisualItems.length <= 1) return;
    showCardVisualIndex(activeCardVisualIndex + (event.deltaY >= 0 ? 1 : -1));
  };

  const removeCardVisualAssetAtIndex = (targetIndex: number) => {
    setCardVisualItems((items) => {
      if (targetIndex < 0 || targetIndex >= items.length) return items;

      if (items.length <= 1) {
        setActiveCardVisualIndex(0);
        setCardPlaceholderImage(null);
        return [{ ...createDefaultCardVisualItems(creator)[0], src: null }];
      }

      const nextItems = items.filter((_, index) => index !== targetIndex);
      const nextActiveIndex = Math.min(targetIndex, nextItems.length - 1);
      setActiveCardVisualIndex(nextActiveIndex);
      setCardPlaceholderImage(nextItems.find((item) => item.type === "image" && item.src)?.src ?? null);
      return nextItems;
    });
  };

  const removeActiveCardVisualAsset = () => {
    removeCardVisualAssetAtIndex(activeCardVisualIndex);
  };

  const renderExpandedKeyPointCard = (card: KeyPointCard) => (
    <article className="w-full rounded-2xl border border-[#c4b394] bg-[linear-gradient(180deg,#f8f7f4_0%,#f1eee8_100%)] px-5 py-4 shadow-[0_14px_30px_rgba(30,35,29,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-[104px_1fr] items-center gap-4">
          <div className="place-self-center flex h-[112px] w-[112px] items-center justify-center rounded-xl text-[#8e7f68]">
            <KeyPointIcon iconId={card.iconId} />
          </div>
          <div className="min-w-0 space-y-1 text-left">
            {isEditView ? (
              <input
                value={card.label}
                onChange={(event) =>
                  setKeyPointLabels((current) => ({ ...current, [card.id]: event.target.value }))
                }
                className="w-full rounded-md border border-[#d9d0c1] bg-white/90 px-2 py-1 text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-[#8e7f68] outline-none transition focus:border-[var(--accent-blue)]"
                aria-label={`${card.label} title`}
              />
            ) : (
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-[#8e7f68]">
                {card.label}
              </p>
            )}
            {isEditView ? (
              card.multiline ? (
                <textarea
                  rows={4}
                  value={profile[card.id]}
                  onChange={(event) => setProfile((prev) => ({ ...prev, [card.id]: event.target.value }))}
                  className="w-full rounded-lg border border-[#d9d0c1] bg-white/90 px-3 py-2 text-left text-[1.08rem] font-semibold leading-tight outline-none transition focus:border-[var(--accent-blue)]"
                />
              ) : (
                <input
                  value={profile[card.id]}
                  onChange={(event) => setProfile((prev) => ({ ...prev, [card.id]: event.target.value }))}
                  className="w-full rounded-lg border border-[#d9d0c1] bg-white/90 px-3 py-2 text-left text-[1.18rem] font-semibold leading-tight outline-none transition focus:border-[var(--accent-blue)]"
                />
              )
            ) : (
              <p className="text-[1.28rem] font-semibold leading-tight tracking-[-0.005em] text-[#0f1210] md:text-[1.46rem]">
                {profile[card.id]}
              </p>
            )}
          </div>
        </div>
      </div>
      {isEditView ? (
        <div className="mt-4 rounded-xl border border-[#d9d0c1] bg-white/70 p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#8e7f68]">
            Icon library
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {KEY_POINT_ICON_LIBRARY.map((icon) => {
              const active = icon.id === card.iconId;

              return (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() =>
                    setKeyPointIconSelections((current) => ({
                      ...current,
                      [card.id]: icon.id,
                    }))
                  }
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border transition ${
                    active
                      ? "border-[#174d38] bg-[#f1f7f3]"
                      : "border-[#d9d0c1] bg-white hover:border-[#cabda4]"
                  }`}
                  aria-label={`Use ${icon.label} icon`}
                  title={icon.label}
                >
                  <KeyPointIcon iconId={icon.id} size="small" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );

  const keyPointCardsSection = (
    <div className="space-y-5">
      {keyPointCards.map((card) => renderExpandedKeyPointCard(card))}
    </div>
  );

  const modelStyleProfileDetails = (
    <div className="flex flex-1 flex-col gap-4 lg:grid lg:h-[560px] lg:flex-none lg:grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] lg:gap-0">
      <div className="mx-auto w-full max-w-[320px] lg:row-start-2">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-[#d9d0c1] bg-[linear-gradient(180deg,#ebe9e1_0%,#f7f5ef_100%)]">
          {headshotImage ? (
            <button
              type="button"
              className="absolute inset-0 cursor-zoom-in"
              onClick={() =>
                setMediaPreview({
                  src: headshotImage,
                  title: `${profile.name} headshot`,
                  type: "image",
                })
              }
              aria-label={`Open ${profile.name} headshot`}
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
        </div>
        {isEditView ? (
          <div className="mt-2 grid gap-2">
            <label className="block cursor-pointer rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]">
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
                className="rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
              >
                Remove Headshot
              </button>
            ) : null}
          </div>
        ) : null}
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
          <div className="grid gap-2">
            {keyPointCards.map((card) => (
              <div
                key={card.id}
                className="credential-font rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-slate-900 shadow-[var(--shadow-soft)]"
              >
                <p className="text-[0.62rem] uppercase leading-tight tracking-[0.14em] text-[#7d7464]">
                  {card.label}
                </p>
                {isEditView ? (
                  card.multiline ? (
                    <textarea
                      rows={2}
                      value={profile[card.id]}
                      onChange={(event) => setProfile((prev) => ({ ...prev, [card.id]: event.target.value }))}
                      className="mt-1 w-full resize-none rounded border border-slate-200 bg-white px-2 py-1 text-center text-[0.76rem] font-semibold leading-tight tracking-[0.04em] outline-none transition focus:border-[var(--accent-blue)]"
                    />
                  ) : (
                    <input
                      value={profile[card.id]}
                      onChange={(event) => setProfile((prev) => ({ ...prev, [card.id]: event.target.value }))}
                      className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 text-center text-[0.76rem] font-semibold leading-tight tracking-[0.04em] outline-none transition focus:border-[var(--accent-blue)]"
                    />
                  )
                ) : (
                  <p className="mt-1 text-[0.8rem] font-semibold leading-snug tracking-[0.04em]">
                    {profile[card.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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
            void saveTalentDraft();
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
              You have unsaved changes on this talent card. Save them before exiting edit view?
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
                  const saved = await saveTalentDraft();
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
        <div
          className={`grid gap-6 px-5 py-4 lg:min-h-[860px] lg:items-stretch lg:py-4 ${
            usesModelStyleShowcase
              ? "lg:grid-cols-[minmax(280px,0.95fr)_minmax(280px,1.95fr)]"
              : "lg:grid-cols-[1.3fr_1fr_1fr]"
          }`}
        >
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
            {isEditView ? (
              <div className="rounded-xl border border-[#d9e4db] bg-white/80 p-3 shadow-[0_10px_26px_rgba(16,33,24,0.06)]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#174d38]">First section template</p>
                  <span className="rounded-full border border-[#c9a84c]/50 bg-[#fbf6e6] px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#6f5d22]">
                    Canvas
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {TALENT_SHOWCASE_TEMPLATES.map((template) => {
                    const active = template.id === talentShowcaseTemplateId;

                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setTalentShowcaseTemplateId(template.id)}
                        className={`rounded-lg border px-3 py-2 text-left transition ${
                          active
                            ? "border-[#174d38] bg-[#f1f7f3] shadow-[0_8px_18px_rgba(23,77,56,0.1)]"
                            : "border-[var(--border)] bg-[#fbfcfb] hover:border-[#b9d3bf]"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-[#102018]">{template.name}</span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">
                          {template.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <p className="text-2xl font-semibold md:text-3xl">{profile.name}</p>
            {usesModelStyleShowcase ? (
              <>
                <SocialCredentialRow
                  credentialNumber={creator.credentialNumber}
                  isEditView={isEditView}
                  socialLinks={socialLinks}
                  onSocialLinkChange={(platform, value) =>
                    setSocialLinks((prev) => ({ ...prev, [platform]: value }))
                  }
                />
                {modelStyleProfileDetails}
              </>
            ) : (
              <>
                <CredentialBadge credentialNumber={creator.credentialNumber} />
                <div className="pt-4">{keyPointCardsSection}</div>
              </>
            )}
          </div>

          {talentShowcaseTemplateId === "three-panel" ? (
            <div className="mx-auto w-full max-w-[230px] space-y-2 lg:w-auto lg:max-w-none lg:justify-self-center lg:self-center">
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-[#ced6ce] bg-[linear-gradient(180deg,#e6ece6_0%,#dfe6df_100%)] lg:h-[700px] lg:w-auto">
                {showcaseImage ? (
                  <Image
                    src={showcaseImage}
                    alt="Talent showcase"
                    fill
                    sizes="(min-width: 1024px) 394px, 230px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center">
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5f6b61]">9:16 Talent Showcase</span>
                  </div>
                )}
              </div>
              {isEditView ? (
                <label className="block cursor-pointer rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]">
                  Upload Showcase
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => imageToDataUrl(event, setShowcaseImage)}
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          {usesViewportTableShowcase ? (
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-3 lg:max-w-none lg:justify-self-stretch lg:self-center">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cardVisualTableSlots.map((item, index) => {
                  const canUploadToSlot =
                    Boolean(item?.src) || cardVisualItems.filter((visualItem) => visualItem.src).length < CARD_VISUAL_MAX_ITEMS;

                  return (
                    <div key={item?.id ?? `card-visual-table-slot-${index}`} className="min-w-0 space-y-2">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-[#d8d4ca] bg-[linear-gradient(180deg,#f7f6f2_0%,#efede7_100%)]">
                        {item?.src ? (
                          item.type === "image" ? (
                            <button
                              type="button"
                              className="absolute inset-0 cursor-zoom-in"
                              onClick={() => {
                                registerCardVisualInteraction();
                                setActiveCardVisualIndex(index);
                                setMediaPreview({ src: item.src!, title: item.title, type: item.type });
                              }}
                              aria-label={`Open ${item.title}`}
                            >
                              <Image
                                src={item.src}
                                alt={item.title}
                                fill
                                sizes="(min-width: 1024px) 240px, 45vw"
                                className="object-cover"
                                unoptimized
                                onLoadingComplete={(image) =>
                                  updateCardVisualAspectRatio(
                                    item.id,
                                    image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : null,
                                  )
                                }
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="absolute inset-0 cursor-zoom-in"
                              onClick={() => {
                                registerCardVisualInteraction();
                                setActiveCardVisualIndex(index);
                                setMediaPreview({ src: item.src!, title: item.title, type: item.type });
                              }}
                              aria-label={`Open ${item.title}`}
                            >
                              <video
                                src={item.src}
                                className="h-full w-full object-cover"
                                muted
                                loop
                                autoPlay
                                playsInline
                                onLoadedMetadata={(event) =>
                                  updateCardVisualAspectRatio(
                                    item.id,
                                    event.currentTarget.videoHeight > 0
                                      ? event.currentTarget.videoWidth / event.currentTarget.videoHeight
                                      : null,
                                  )
                                }
                              />
                            </button>
                          )
                        ) : (
                          <div className="flex h-full items-center justify-center p-3 text-center">
                            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#7d7464]">
                              Viewport {index + 1}
                            </span>
                          </div>
                        )}
                      </div>
                      {isEditView ? (
                        <div className="grid gap-1">
                          <label
                            className={`block rounded-lg border px-2 py-1.5 text-center text-[0.62rem] font-semibold uppercase tracking-[0.12em] transition ${
                              canUploadToSlot
                                ? "cursor-pointer border-[#d8d2c5] bg-[#f3f1eb] text-[#7d7464] hover:border-[#cabda4] hover:text-[#3d3a34]"
                                : "cursor-not-allowed border-[#e2ded5] bg-[#f5f3ef] text-[#b1aa9f]"
                            }`}
                          >
                            {item?.src ? "Replace" : "Upload"}
                            <input
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              disabled={!canUploadToSlot}
                              onChange={(event) => {
                                void uploadCardVisualAsset(event, index);
                              }}
                            />
                          </label>
                          {item?.src ? (
                            <button
                              type="button"
                              onClick={() => removeCardVisualAssetAtIndex(index)}
                              className="block w-full rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-2 py-1.5 text-center text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {isEditView ? (
                <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#8e7f68]">
                  {cardVisualItems.filter((item) => item.src).length}/{CARD_VISUAL_MAX_ITEMS} visuals
                </p>
              ) : null}
            </div>
          ) : (
            <div
              className="mx-auto flex w-full max-w-[230px] flex-col items-center space-y-2 lg:max-w-none lg:justify-self-center lg:self-center"
            >
              <div
              className="relative overscroll-contain overflow-hidden rounded-2xl border border-[#d8d4ca] bg-[linear-gradient(180deg,#f7f6f2_0%,#efede7_100%)] transition-[width,max-width,aspect-ratio] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                aspectRatio: activeCardVisualAspectRatio,
                width: `${activeCardVisualMaxWidthPx}px`,
                maxWidth: "100%",
                maxHeight: "700px",
              }}
              onWheel={handleCardVisualWheel}
              onPointerDown={registerCardVisualInteraction}
              onTouchStart={registerCardVisualInteraction}
            >
              {activeCardVisualItem?.src ? (
                <>
                  {cardVisualItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        index === activeCardVisualIndex
                          ? "z-10 translate-x-0 scale-100 opacity-100"
                          : index < activeCardVisualIndex
                            ? "z-0 -translate-x-[16%] scale-[0.96] opacity-0"
                            : "z-0 translate-x-[16%] scale-[0.96] opacity-0"
                      }`}
                    >
                      {item.src ? (
                        item.type === "image" ? (
                          <button
                            type="button"
                            className="absolute inset-0 cursor-zoom-in"
                            onClick={() => {
                              registerCardVisualInteraction();
                              setMediaPreview({ src: item.src!, title: item.title, type: item.type });
                            }}
                            aria-label={`Open ${item.title}`}
                          >
                            <Image
                              src={item.src}
                              alt={item.title}
                              fill
                              sizes="(min-width: 1024px) 560px, 230px"
                              className="object-cover"
                              unoptimized
                              onLoadingComplete={(image) =>
                                updateCardVisualAspectRatio(
                                  item.id,
                                  image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : null,
                                )
                              }
                            />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="absolute inset-0 cursor-zoom-in"
                            onClick={() => {
                              registerCardVisualInteraction();
                              setMediaPreview({ src: item.src!, title: item.title, type: item.type });
                            }}
                            aria-label={`Open ${item.title}`}
                          >
                            <video
                              src={item.src}
                              className="h-full w-full object-cover"
                              muted
                              loop
                              autoPlay
                              playsInline
                              onLoadedMetadata={(event) =>
                                updateCardVisualAspectRatio(
                                  item.id,
                                  event.currentTarget.videoHeight > 0
                                    ? event.currentTarget.videoWidth / event.currentTarget.videoHeight
                                    : null,
                                )
                              }
                            />
                          </button>
                        )
                      ) : null}
                    </div>
                  ))}
                  {cardVisualItems.length > 1 ? (
                    <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2">
                      {cardVisualItems.map((item, index) => (
                        <button
                          key={`${item.id}-dot`}
                          type="button"
                          onClick={() => showCardVisualIndex(index)}
                          className={`h-2.5 rounded-full border border-white/80 transition-all ${
                            index === activeCardVisualIndex ? "w-7 bg-white" : "w-2.5 bg-white/50"
                          }`}
                          aria-label={`Show card visual ${index + 1}`}
                        />
                      ))}
                    </div>
                  ) : null}
                </>
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
            </div>
            {isEditView ? (
              <div className="space-y-2">
                <label
                  className={`block rounded-lg border px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    cardVisualItems.filter((item) => item.src).length >= CARD_VISUAL_MAX_ITEMS
                      ? "cursor-not-allowed border-[#e2ded5] bg-[#f5f3ef] text-[#b1aa9f]"
                      : "cursor-pointer border-[#d8d2c5] bg-[#f3f1eb] text-[#7d7464] hover:border-[#cabda4] hover:text-[#3d3a34]"
                  }`}
                >
                  Add Image or Video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={cardVisualItems.filter((item) => item.src).length >= CARD_VISUAL_MAX_ITEMS}
                    onChange={(event) => {
                      void uploadCardVisualAsset(event);
                    }}
                  />
                </label>
                <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#8e7f68]">
                  {cardVisualItems.filter((item) => item.src).length}/{CARD_VISUAL_MAX_ITEMS} visuals
                </p>
                {activeCardVisualItem?.src ? (
                  <button
                    type="button"
                    onClick={removeActiveCardVisualAsset}
                    className="block w-full rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                  >
                    Remove Current Visual
                  </button>
                ) : null}
              </div>
            ) : null}
            </div>
          )}
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
                </div>
                <p className="relative text-sm text-[var(--text-secondary)]">
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
                    forcedAspectRatio={featuredAnimatedAspectRatio}
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
                    <label className="block cursor-pointer rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]">
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
                        className="block w-full rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                      >
                        Remove Media
                      </button>
                    ) : null}
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
                          <label className="block cursor-pointer rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]">
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
                              className="block w-full rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                            >
                              Remove Media
                            </button>
                          ) : null}
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
              <BrandMediaTile
                item={selectedTalentFeaturedItem}
                featured
                forcedAspectRatio={selectedTalentFeaturedAspectRatio}
              />
            ) : (
              <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[#f7faf8] p-6 text-sm text-[var(--text-secondary)]">
                Add media windows to start your content wall.
              </div>
            )}
            {isEditView && selectedTalentFeaturedItem ? (
              <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[#f8fbf9] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                    Window {talentContentWall.items.findIndex((item) => item.id === selectedTalentFeaturedItem.id) + 1}
                  </p>
                  <MediaTypeBadge type={selectedTalentFeaturedItem.type} />
                </div>
                <input
                  value={selectedTalentFeaturedItem.title}
                  onChange={(event) => updateTalentMediaTitle(selectedTalentFeaturedItem.id, event.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                  placeholder="Media title"
                />
                <label className="block cursor-pointer rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]">
                  Upload Image or Video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(event) => {
                      void uploadTalentMediaAsset(selectedTalentFeaturedItem.id, event);
                    }}
                  />
                </label>
                {selectedTalentFeaturedItem.src ? (
                  <button
                    type="button"
                    onClick={() => removeTalentMediaAsset(selectedTalentFeaturedItem.id)}
                    className="block w-full rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                  >
                    Remove Media
                  </button>
                ) : null}
              </div>
            ) : null}
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
                    />
                    {isEditView ? (
                      <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[#f8fbf9] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                            Window {talentContentWall.items.findIndex((entry) => entry.id === item.id) + 1}
                          </p>
                          <MediaTypeBadge type={item.type} />
                        </div>
                        <input
                          value={item.title}
                          onChange={(event) => updateTalentMediaTitle(item.id, event.target.value)}
                          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                          placeholder="Media title"
                        />
                        <label className="block cursor-pointer rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]">
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
                            className="block w-full rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]"
                          >
                            Remove Media
                          </button>
                        ) : null}
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
            <div className="flex flex-wrap gap-2">
              <input
                value={talentContentWall.headline}
                onChange={(event) => updateTalentHeadline("headline", event.target.value)}
                className="min-w-[220px] rounded-lg border border-[#174d38] bg-[#f1f7f3] px-3 py-2 text-sm font-semibold outline-none transition focus:border-[var(--accent-blue)]"
                aria-label="Rename content wall collection"
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
