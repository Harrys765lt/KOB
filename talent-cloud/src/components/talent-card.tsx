"use client";

import Image from "next/image";
import {
  ChangeEvent,
  ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  WheelEvent,
} from "react";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CredentialBadge } from "@/components/credential-badge";
import { BRAND_CATALOG, BrandCatalogEntry, getBrandCatalogEntry, normalizeBrandName } from "@/lib/brand-catalog";
import { analyticsData } from "@/lib/mock-data";
import { Creator } from "@/lib/types";

type TalentCardProps = {
  creator: Creator;
  viewer: "creator" | "brand";
};

type ProfileState = {
  name: string;
  niche: string;
  audience: string;
  contentDescription: string;
};

type BrandMediaItem = {
  id: string;
  type: "image" | "video";
  title: string;
  src: string | null;
};

type BrandMediaCollection = {
  headline: string;
  summary: string;
  items: BrandMediaItem[];
};

const audiencePalette = ["#2F7F5F", "#5EA982", "#C9A84C", "#8BB7A1"];
const BRAND_CAROUSEL_PAUSE_MS = 20000;
const BRAND_CAROUSEL_SPEED_PX_PER_MS = 0.02;

type KeyPointCard = {
  id: "niche" | "audience" | "contentDescription";
  label: string;
  icon: ReactNode;
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
      <h2 className="text-3xl font-bold">{title}</h2>
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

function createDefaultBrandMediaCollection(brand: string): BrandMediaCollection {
  const normalizedBrand = normalizeBrandName(brand).replace(/\s+/g, "-") || "brand";

  return {
    headline: `${brand} campaign content`,
    summary: `A curated brand-specific wall for ${brand}. Use this space to show reels, stills, and final campaign cuts that prove fit.`,
    items: [
      { id: `${normalizedBrand}-hero-video`, type: "video", title: "Hero reel", src: null },
      { id: `${normalizedBrand}-still-01`, type: "image", title: "Campaign still 01", src: null },
      { id: `${normalizedBrand}-still-02`, type: "image", title: "Campaign still 02", src: null },
      { id: `${normalizedBrand}-video-cut`, type: "video", title: "Short-form cutdown", src: null },
      { id: `${normalizedBrand}-still-03`, type: "image", title: "Lifestyle still 03", src: null },
    ],
  };
}

function createDefaultTalentContentCollection(name: string): BrandMediaCollection {
  const normalizedName = normalizeBrandName(name).replace(/\s+/g, "-") || "talent";

  return {
    headline: "Talent content wall",
    summary: `A standing showcase of ${name}'s signature content style across formats, moods, and editing approaches.`,
    items: [
      { id: `${normalizedName}-talent-hero-video`, type: "video", title: "Signature reel", src: null },
      { id: `${normalizedName}-talent-still-01`, type: "image", title: "Editorial still 01", src: null },
      { id: `${normalizedName}-talent-still-02`, type: "image", title: "Lifestyle still 02", src: null },
      { id: `${normalizedName}-talent-video-02`, type: "video", title: "Campaign cutdown", src: null },
      { id: `${normalizedName}-talent-still-03`, type: "image", title: "Behind-the-scenes 03", src: null },
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

function BrandMediaTile({
  item,
  featured = false,
}: {
  item: BrandMediaItem;
  featured?: boolean;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-white ${
        featured ? "min-h-[320px]" : "min-h-[200px]"
      }`}
    >
      {item.src ? (
        item.type === "image" ? (
          <div className="absolute inset-0">
            <Image src={item.src} alt={item.title} fill className="object-cover" sizes={featured ? "50vw" : "25vw"} />
          </div>
        ) : (
          <video
            src={item.src}
            className="absolute inset-0 h-full w-full object-cover"
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

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#102118]/90 via-[#102118]/55 to-transparent px-4 pb-4 pt-16 text-white">
        <p className={`font-semibold ${featured ? "text-lg" : "text-sm"}`}>{item.title}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/72">
          {item.src ? "Uploaded by talent" : "Awaiting upload"}
        </p>
      </div>
    </article>
  );
}

function HangerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[106px] w-[106px]" fill="none" stroke="currentColor" strokeWidth="1.45" aria-hidden>
      <path d="M8.5 8.2h7.2L21 16.3H3L8.5 8.2Z" />
      <path d="M12 8.2V5.8a1.8 1.8 0 1 1 3.6 0" />
    </svg>
  );
}

function AudienceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[106px] w-[106px]" fill="none" stroke="currentColor" strokeWidth="1.45" aria-hidden>
      <circle cx="11" cy="9" r="3.1" />
      <path d="M5.7 18.2a5.3 5.3 0 0 1 10.6 0" />
      <circle cx="18.3" cy="10.2" r="1.8" />
      <path d="M16.8 18.2c.2-1.6 1.5-2.9 3-3.2" />
      <path d="M4 11.5h2M3.5 14h2M18.5 5.7h2M17.7 3.9v2" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[106px] w-[106px]" fill="none" stroke="currentColor" strokeWidth="1.45" aria-hidden>
      <rect x="2.8" y="6" width="13.4" height="12" rx="2.2" />
      <path d="m16.2 10 5-2.2v8.4l-5-2.2z" />
      <path d="m9.1 10.2 3.5 1.8-3.5 1.8z" />
    </svg>
  );
}

export function TalentCard({ creator, viewer }: TalentCardProps) {
  const canEdit = viewer === "creator";
  const [editView, setEditView] = useState(false);
  const isEditView = canEdit && editView;
  const brandCarouselRef = useRef<HTMLDivElement>(null);
  const carouselPausedUntilRef = useRef(0);
  const carouselOffsetRef = useRef(0);

  const [profile, setProfile] = useState<ProfileState>({
    name: creator.name,
    niche: creator.niche,
    audience: creator.audience,
    contentDescription: creator.contentDescription,
  });

  const [showcaseImage, setShowcaseImage] = useState<string | null>(null);
  const [cardPlaceholderImage, setCardPlaceholderImage] = useState<string | null>(null);

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

  const [dataNotes, setDataNotes] = useState(
    "Data panel can be filtered by brand selections and content highlights to compare campaign performance trends."
  );

  const dataCaption =
    viewer === "creator"
      ? "Data updates as your content and campaigns change."
      : "Brand-view preview of this talent's performance.";

  const keyPointCards: KeyPointCard[] = [
  { id: "niche", label: "My Niche", icon: <HangerIcon /> },
  { id: "audience", label: "My Audience", icon: <AudienceIcon /> },
  { id: "contentDescription", label: "My Content Strategy", icon: <VideoIcon />, multiline: true },
  ];

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

  const registerCarouselInteraction = () => {
    carouselPausedUntilRef.current = Date.now() + BRAND_CAROUSEL_PAUSE_MS;
  };

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

  useEffect(() => {
    const container = brandCarouselRef.current;
    if (!container || brands.length === 0) return;

    syncBrandCarouselOffset(container.scrollWidth / 3);

    let frameId = 0;
    let previousTime = 0;

    const tick = (time: number) => {
      const activeContainer = brandCarouselRef.current;
      if (!activeContainer) return;

      if (previousTime === 0) {
        previousTime = time;
      }

      const delta = time - previousTime;
      previousTime = time;

      if (activeContainer.scrollWidth > 0 && Date.now() >= carouselPausedUntilRef.current) {
        syncBrandCarouselOffset(carouselOffsetRef.current + delta * BRAND_CAROUSEL_SPEED_PX_PER_MS);
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [brands.length]);

  const handleBrandCarouselWheel = (event: WheelEvent<HTMLDivElement>) => {
    const dominantDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    if (dominantDelta === 0) return;

    event.preventDefault();
    registerCarouselInteraction();
    syncBrandCarouselOffset(carouselOffsetRef.current + dominantDelta);
  };

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

  const uploadBrandMediaAsset = async (
    brand: string,
    mediaId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const src = await fileToDataUrl(file);

    updateBrandMediaCollection(brand, (collection) => ({
      ...collection,
      items: collection.items.map((item) =>
        item.id === mediaId
          ? {
              ...item,
              src,
              type: file.type.startsWith("video/") ? "video" : "image",
            }
          : item
      ),
    }));
  };

  const uploadTalentMediaAsset = async (mediaId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const src = await fileToDataUrl(file);

    updateTalentWall((collection) => ({
      ...collection,
      items: collection.items.map((item) =>
        item.id === mediaId
          ? {
              ...item,
              src,
              type: file.type.startsWith("video/") ? "video" : "image",
            }
          : item
      ),
    }));
  };

  return (
    <div className="space-y-5">
      <section className="card-surface overflow-hidden bg-[#f9f8f3]">
        <div className="h-[7px] w-full bg-[linear-gradient(90deg,#cfc5b2_0%,#e2dac9_34%,#f4f1e8_100%)]" />
        <div className="grid gap-6 px-5 py-4 lg:min-h-[860px] lg:grid-cols-[1.3fr_1fr_1fr] lg:items-stretch lg:py-4">
          <div className="space-y-4">
            <p className="editorial-kicker">{viewer === "creator" ? "Talent Showcase" : "Talent Profile"}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold md:text-5xl">Talent Card</h1>
              {canEdit ? (
                <button
                  onClick={() => setEditView((prev) => !prev)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    isEditView
                      ? "bg-[#174d38] text-white hover:bg-[#1f6047]"
                      : "border border-[#d8d2c5] bg-[#f3f1eb] text-[#7d7464] hover:border-[#cabda4] hover:text-[#3d3a34]"
                  }`}
                >
                  {isEditView ? "Exit Edit View" : "Enter Edit View"}
                </button>
              ) : null}
            </div>
            <p className="text-2xl font-semibold md:text-3xl">{profile.name}</p>
            <CredentialBadge credentialNumber={creator.credentialNumber} />

            <div className="space-y-5 pt-4">
              {keyPointCards.map((card) => (
                <article
                  key={card.id}
                  className="rounded-2xl border border-[#c4b394] bg-[linear-gradient(180deg,#f8f7f4_0%,#f1eee8_100%)] px-5 py-[11px] shadow-[0_14px_30px_rgba(30,35,29,0.08)]"
                >
                  <div className="grid grid-cols-[132px_1fr] items-center gap-5">
                    <div className="place-self-center flex h-[116px] w-[116px] items-center justify-center rounded-xl text-[#8e7f68]">
                      {card.icon}
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-[#8e7f68]">
                        {card.label}
                      </p>
                      {isEditView ? (
                        card.multiline ? (
                          <textarea
                            rows={2}
                            value={profile[card.id]}
                            onChange={(event) =>
                              setProfile((prev) => ({ ...prev, [card.id]: event.target.value }))
                            }
                            className="w-full rounded-lg border border-[#d9d0c1] bg-white/90 px-3 py-2 text-left text-[1.18rem] font-semibold leading-tight outline-none transition focus:border-[var(--accent-blue)]"
                          />
                        ) : (
                          <input
                            value={profile[card.id]}
                            onChange={(event) =>
                              setProfile((prev) => ({ ...prev, [card.id]: event.target.value }))
                            }
                            className="w-full rounded-lg border border-[#d9d0c1] bg-white/90 px-3 py-2 text-left text-[1.18rem] font-semibold leading-tight outline-none transition focus:border-[var(--accent-blue)]"
                          />
                        )
                      ) : (
                        <p className="text-[1.32rem] font-semibold leading-tight tracking-[-0.005em] text-[#0f1210] md:text-[1.58rem]">
                          {profile[card.id]}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[230px] space-y-2 lg:w-auto lg:max-w-none lg:justify-self-center lg:self-center">
            <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl border border-[#ced6ce] bg-[linear-gradient(180deg,#e6ece6_0%,#dfe6df_100%)] lg:h-[700px] lg:w-auto">
              {showcaseImage ? (
                <img src={showcaseImage} alt="Talent showcase" className="h-full w-full object-cover" />
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

          <div className="mx-auto w-full max-w-[230px] space-y-2 lg:w-auto lg:max-w-none lg:justify-self-end lg:self-center">
            <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl border border-[#d8d4ca] bg-[linear-gradient(180deg,#f7f6f2_0%,#efede7_100%)] lg:h-[700px] lg:w-auto">
              {cardPlaceholderImage ? (
                <img src={cardPlaceholderImage} alt="Talent card placeholder" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full p-4">
                  <div className="mb-3 rounded-lg border border-[#ddd8cc] bg-white/85 p-3">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <p className="text-3xl font-bold tracking-[0.06em] text-[#2f2f2d]">EE-EAN</p>
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
              <label className="block cursor-pointer rounded-lg border border-[#d8d2c5] bg-[#f3f1eb] px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#7d7464] transition hover:border-[#cabda4] hover:text-[#3d3a34]">
                Upload Card Visual
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => imageToDataUrl(event, setCardPlaceholderImage)}
                />
              </label>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card-surface min-w-0 space-y-4 overflow-hidden p-5">
        <SectionHeader title="Names I Have Worked With" kicker="Past Experience" />
        <div>
          <p className="text-sm text-[var(--text-secondary)]">Select a brand to reveal content highlights.</p>
          <p className="text-xs text-[var(--text-secondary)]/80">
            Scroll with your mouse or trackpad. Auto motion resumes after 20 seconds of no interaction.
          </p>
        </div>
        <div
          className="relative h-[330px] min-w-0 max-w-full overflow-hidden rounded-[32px]"
          onPointerDown={registerCarouselInteraction}
          onTouchStart={registerCarouselInteraction}
          onWheel={handleBrandCarouselWheel}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-white via-white/88 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white via-white/88 to-transparent" />
          <div
            ref={brandCarouselRef}
            className="absolute left-0 top-2 flex w-max gap-6 px-6 pb-4 pt-1 will-change-transform"
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
          selectedBrandCollection && selectedBrand ? "max-h-[1400px] translate-y-0 opacity-100" : "max-h-0 -translate-y-3 opacity-0"
        }`}
      >
        {selectedBrandCollection && selectedBrand ? (
          <section className="card-surface space-y-4 p-5">
            <SectionHeader title="Content Highlight" kicker="Brand Focus" />
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
              <article className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,#f8fbf9_0%,#eef6f0_100%)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  Selected brand
                </p>
                <h3 className="mt-2 text-3xl font-bold">{selectedBrandCollection.headline}</h3>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  {selectedBrand}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                  {selectedBrandCollection.summary}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedBrandCollection.items.map((item) => (
                    <span
                      key={`${item.id}-chip`}
                      className="rounded-full border border-[var(--border)] bg-white/92 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#254736]"
                    >
                      {item.title}
                    </span>
                  ))}
                </div>
              </article>

              <article className="grid gap-3 rounded-[28px] border border-[var(--border)] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Deliverable mix</p>
                  <span className="rounded-full bg-[#eef5ef] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#2b5440]">
                    {selectedBrandCollection.items.length} assets
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] bg-[#f7faf8] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Images</p>
                    <p className="mt-2 text-3xl font-bold">{selectedBrandMediaCounts.images}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[#f7faf8] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Videos</p>
                    <p className="mt-2 text-3xl font-bold">{selectedBrandMediaCounts.videos}</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  This highlight only appears when a brand is selected from the carousel.
                </p>
              </article>
            </div>
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <BrandMediaTile item={selectedBrandCollection.items[0]} featured />
              <div className="grid gap-4 sm:grid-cols-2">
                {selectedBrandCollection.items.slice(1).map((item) => (
                  <BrandMediaTile key={item.id} item={item} />
                ))}
              </div>
            </div>
            {isEditView ? (
              <>
                <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-white p-3 md:grid-cols-2">
                  <input
                    value={selectedBrandCollection.headline}
                    onChange={(event) => updateBrandHeadline(selectedBrand, "headline", event.target.value)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                    placeholder="Brand highlight headline"
                  />
                  <input
                    value={selectedBrand}
                    disabled
                    className="rounded-lg border border-[var(--border)] bg-[#f7faf8] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none"
                  />
                  <textarea
                    rows={3}
                    value={selectedBrandCollection.summary}
                    onChange={(event) => updateBrandHeadline(selectedBrand, "summary", event.target.value)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)] md:col-span-2"
                    placeholder="Describe the selected brand content collection"
                  />
                </div>
                <div className="grid gap-3 rounded-[24px] border border-[var(--border)] bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
                  {selectedBrandCollection.items.map((item) => (
                    <div
                      key={`${item.id}-editor`}
                      className="space-y-2 rounded-2xl border border-[var(--border)] bg-[#f8fbf9] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                          {item.type}
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
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        ) : null}
      </div>

      <section className="card-surface space-y-4 p-5">
        <SectionHeader title="Content Wall" kicker="Talent Showcase" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Always-on showcase of the talent&apos;s own content style, regardless of brand selection.
          </p>
          <p className="rounded-full bg-[#edf5ef] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#315844]">
            {talentContentWall.headline}
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <BrandMediaTile item={talentContentWall.items[0]} featured />
          <div className="grid gap-4 sm:grid-cols-2">
            {talentContentWall.items.slice(1).map((item) => (
              <BrandMediaTile key={item.id} item={item} />
            ))}
          </div>
        </div>
        {isEditView ? (
          <>
            <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-white p-3 md:grid-cols-2">
              <input
                value={talentContentWall.headline}
                onChange={(event) => updateTalentHeadline("headline", event.target.value)}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                placeholder="Talent wall headline"
              />
              <input
                value={creator.name}
                disabled
                className="rounded-lg border border-[var(--border)] bg-[#f7faf8] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none"
              />
              <textarea
                rows={3}
                value={talentContentWall.summary}
                onChange={(event) => updateTalentHeadline("summary", event.target.value)}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)] md:col-span-2"
                placeholder="Describe the talent content wall"
              />
            </div>
            <div className="grid gap-3 rounded-[24px] border border-[var(--border)] bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
              {talentContentWall.items.map((item) => (
                <div
                  key={`${item.id}-editor`}
                  className="space-y-2 rounded-2xl border border-[var(--border)] bg-[#f8fbf9] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                      {item.type}
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
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="card-surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="editorial-kicker">Talent Data</p>
          <p className="text-xs text-[var(--text-secondary)]">{dataCaption}</p>
        </div>
        <h2 className="text-3xl font-bold">Data Don&apos;t Lie</h2>
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
          <article className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="text-sm text-[var(--text-secondary)]">{dataNotes}</p>
            <div className="mt-3 h-56 rounded-lg border border-[var(--border)] bg-[#f3f8f4] p-3">
              <p className="text-xs text-[var(--text-secondary)]">Talent notes</p>
            </div>
            {isEditView ? (
              <textarea
                rows={3}
                value={dataNotes}
                onChange={(event) => setDataNotes(event.target.value)}
                className="mt-3 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                placeholder="Update the data notes shown in this panel"
              />
            ) : null}
          </article>

          <article className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="mb-2 text-sm font-semibold">Total Audience</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={analyticsData.audience} dataKey="value" nameKey="name" outerRadius={70}>
                    {analyticsData.audience.map((entry, index) => (
                      <Cell key={entry.name} fill={audiencePalette[index % audiencePalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="mb-2 text-sm font-semibold">Performance History</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={analyticsData.performanceHistory}>
                  <XAxis dataKey="year" />
                  <YAxis hide />
                  <Tooltip />
                  <Line type="monotone" dataKey="engagement" stroke="#2F7F5F" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="mb-2 text-sm font-semibold">Engagement Over Seasons</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsData.seasonalEngagement}>
                  <XAxis dataKey="season" />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="instagram" fill="#2F7F5F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tiktok" fill="#5EA982" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="youtube" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mb-2 text-sm font-semibold">Followers Across Months</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={analyticsData.platformGrowth}>
                  <XAxis dataKey="month" />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="instagram" stackId="a" fill="#2F7F5F" />
                  <Bar dataKey="tiktok" stackId="a" fill="#5EA982" />
                  <Bar dataKey="youtube" stackId="a" fill="#C9A84C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
