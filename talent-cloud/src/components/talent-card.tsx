"use client";

import { ChangeEvent, ReactNode, useMemo, useState } from "react";
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

type ContentWallState = {
  left: [string, string];
  hero: string;
  right: [string, string];
};

type HighlightState = {
  hero: string;
  tiles: string[];
};

const audiencePalette = ["#2F7F5F", "#5EA982", "#C9A84C", "#8BB7A1"];

const defaultHighlightText =
  "Content panel here can be changed by choosing left and right arrows or clicking one of the brand logos in this row.";

type KeyPointCard = {
  id: "niche" | "audience" | "contentDescription";
  label: string;
  icon: ReactNode;
  multiline?: boolean;
};

function SectionHeader({ title, kicker }: { title: string; kicker: string }) {
  return (
    <div>
      <p className="editorial-kicker">{kicker}</p>
      <h2 className="text-3xl font-bold">{title}</h2>
    </div>
  );
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

  const [profile, setProfile] = useState<ProfileState>({
    name: creator.name,
    niche: creator.niche,
    audience: creator.audience,
    contentDescription: creator.contentDescription,
  });

  const [showcaseImage, setShowcaseImage] = useState<string | null>(null);
  const [cardPlaceholderImage, setCardPlaceholderImage] = useState<string | null>(null);

  const [brands, setBrands] = useState<string[]>(creator.brandsWorkedWith);
  const [newBrand, setNewBrand] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(creator.brandsWorkedWith[0]);

  const [contentWall, setContentWall] = useState<ContentWallState>({
    left: ["content here", "content here"],
    hero: "hero content",
    right: ["content here", "content here"],
  });

  const [highlight, setHighlight] = useState<HighlightState>({
    hero: defaultHighlightText,
    tiles: Array.from({ length: 6 }, () => "content here"),
  });

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

  const addBrand = () => {
    const trimmed = newBrand.trim();
    if (!trimmed) return;
    if (brands.some((brand) => brand.toLowerCase() === trimmed.toLowerCase())) return;
    const nextBrands = [...brands, trimmed];
    setBrands(nextBrands);
    setSelectedBrand((prev) => prev ?? trimmed);
    setNewBrand("");
  };

  const removeBrand = (brandToRemove: string) => {
    const nextBrands = brands.filter((brand) => brand !== brandToRemove);
    setBrands(nextBrands);
    if (selectedBrand === brandToRemove) {
      setSelectedBrand(nextBrands[0]);
    }
  };

  const updateWallText = (group: "left" | "right", index: 0 | 1, value: string) => {
    setContentWall((prev) => {
      const next = [...prev[group]] as [string, string];
      next[index] = value;
      return { ...prev, [group]: next };
    });
  };

  const updateHighlightTile = (index: number, value: string) => {
    setHighlight((prev) => {
      const nextTiles = [...prev.tiles];
      nextTiles[index] = value;
      return { ...prev, tiles: nextTiles };
    });
  };

  const selectedBrandLabel = useMemo(
    () => selectedBrand || "Select a brand in Past Experience to open this section.",
    [selectedBrand]
  );

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

      <section className="card-surface space-y-4 p-5">
        <SectionHeader title="Names I Have Worked With" kicker="Past Experience" />
        <p className="text-sm text-[var(--text-secondary)]">Select a brand to reveal content highlights.</p>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => {
            const active = brand === selectedBrand;
            return (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`min-w-[120px] rounded-md border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                  active
                    ? "border-[var(--accent-blue)] bg-[#e8f2ec] text-[#1e6047] shadow-[0_8px_18px_rgba(47,127,95,0.2)]"
                    : "border-[var(--border)] bg-white text-[#5f7166] hover:border-[#bfd1c4] hover:text-[var(--text-primary)]"
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
        {isEditView ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              Manage Brand Experience
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {brands.map((brand) => (
                <span
                  key={`${brand}-edit`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[#f2f7f3] px-3 py-1 text-xs"
                >
                  {brand}
                  <button
                    onClick={() => removeBrand(brand)}
                    className="rounded-full px-1 text-[var(--text-secondary)] transition hover:bg-[#dce9df] hover:text-[#2d4638]"
                    aria-label={`Remove ${brand}`}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={newBrand}
                onChange={(event) => setNewBrand(event.target.value)}
                placeholder="Add brand name"
                className="min-w-[220px] flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
              />
              <button
                onClick={addBrand}
                className="rounded-lg bg-[var(--accent-blue)] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                Add Brand
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="card-surface space-y-4 p-5">
        <SectionHeader title="Content Wall" kicker="Talent Showcase" />
        <div className="grid gap-3 md:grid-cols-4">
          <div className="grid gap-3 md:col-span-1">
            <div className="h-24 rounded-md border border-[var(--border)] bg-[#eef4ef] p-2 text-xs text-[#5f7166]">
              {contentWall.left[0]}
            </div>
            <div className="h-24 rounded-md border border-[var(--border)] bg-[#eef4ef] p-2 text-xs text-[#5f7166]">
              {contentWall.left[1]}
            </div>
          </div>
          <div className="h-52 rounded-md border border-[var(--border)] bg-gradient-to-br from-[#d3dfd7] to-[#eef4ef] p-2 text-xs text-[#425348] md:col-span-2">
            {contentWall.hero}
          </div>
          <div className="grid gap-3 md:col-span-1">
            <div className="h-24 rounded-md border border-[var(--border)] bg-[#eef4ef] p-2 text-xs text-[#5f7166]">
              {contentWall.right[0]}
            </div>
            <div className="h-24 rounded-md border border-[var(--border)] bg-[#eef4ef] p-2 text-xs text-[#5f7166]">
              {contentWall.right[1]}
            </div>
          </div>
        </div>
        {isEditView ? (
          <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-white p-3 md:grid-cols-2">
            <input
              value={contentWall.left[0]}
              onChange={(event) => updateWallText("left", 0, event.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
              placeholder="Left content 1"
            />
            <input
              value={contentWall.left[1]}
              onChange={(event) => updateWallText("left", 1, event.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
              placeholder="Left content 2"
            />
            <input
              value={contentWall.right[0]}
              onChange={(event) => updateWallText("right", 0, event.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
              placeholder="Right content 1"
            />
            <input
              value={contentWall.right[1]}
              onChange={(event) => updateWallText("right", 1, event.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
              placeholder="Right content 2"
            />
            <textarea
              rows={2}
              value={contentWall.hero}
              onChange={(event) => setContentWall((prev) => ({ ...prev, hero: event.target.value }))}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)] md:col-span-2"
              placeholder="Hero content"
            />
          </div>
        ) : null}
      </section>

      {selectedBrand ? (
        <section className="card-surface space-y-4 p-5">
          <SectionHeader title="Content Highlight" kicker="Brand Focus" />
          <p className="text-sm text-[var(--text-secondary)]">Selected brand: {selectedBrand}</p>
          <div className="grid gap-3 xl:grid-cols-[1fr_2fr]">
            <article className="rounded-xl border border-[var(--border)] bg-white p-3">
              <p className="text-sm text-[var(--text-secondary)]">{highlight.hero}</p>
              <div className="mt-3 h-48 rounded-md bg-gradient-to-br from-[#d4dfd7] to-[#f4f8f5] p-2 text-xs text-[#5f7166]">
                content hero
              </div>
            </article>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {highlight.tiles.map((tile, index) => (
                <div
                  key={`tile-${index}`}
                  className="h-24 rounded-md border border-[var(--border)] bg-[#eef4ef] p-2 text-xs text-[#5f7166]"
                >
                  {tile}
                </div>
              ))}
            </div>
          </div>
          {isEditView ? (
            <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-white p-3 md:grid-cols-2">
              <textarea
                rows={2}
                value={highlight.hero}
                onChange={(event) => setHighlight((prev) => ({ ...prev, hero: event.target.value }))}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)] md:col-span-2"
                placeholder="Highlight hero text"
              />
              {highlight.tiles.map((tile, index) => (
                <input
                  key={`edit-tile-${index}`}
                  value={tile}
                  onChange={(event) => updateHighlightTile(index, event.target.value)}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)]"
                  placeholder={`Highlight ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : (
        <section className="card-surface p-5">
          <p className="text-sm text-[var(--text-secondary)]">{selectedBrandLabel}</p>
        </section>
      )}

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
