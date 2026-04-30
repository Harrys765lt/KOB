"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyticsData as defaultAnalyticsData } from "@/lib/mock-data";

const palette = ["#2F7F5F", "#5EA982", "#C9A84C", "#8BB7A1"];

export type TalentAnalyticsData = typeof defaultAnalyticsData;

export type RateCardTextBox = {
  id: string;
  text: string;
  bold: boolean;
  italic: boolean;
};

type TalentDataPanel = "rate-card" | "audience" | "performance" | "seasonal" | "growth";

type AnalyticsChartsProps = {
  kicker?: string;
  caption?: string;
  isEditView?: boolean;
  data?: TalentAnalyticsData;
  onDataChange?: (data: TalentAnalyticsData) => void;
  rateCardItems?: RateCardTextBox[];
  onRateCardItemsChange?: (items: RateCardTextBox[]) => void;
};

const defaultRateCardItems: RateCardTextBox[] = [
  {
    id: "rate-standard",
    text: "Instagram Reel: RM1,500 - RM3,000",
    bold: true,
    italic: false,
  },
  {
    id: "rate-usage",
    text: "Usage rights, whitelisting, and exclusivity quoted separately.",
    bold: false,
    italic: true,
  },
];

function cloneAnalyticsData(data: TalentAnalyticsData): TalentAnalyticsData {
  return {
    audience: data.audience.map((item) => ({ ...item })),
    performanceHistory: data.performanceHistory.map((item) => ({ ...item })),
    seasonalEngagement: data.seasonalEngagement.map((item) => ({ ...item })),
    platformGrowth: data.platformGrowth.map((item) => ({ ...item })),
  };
}

function formatPanelLabel(panel: TalentDataPanel) {
  if (panel === "rate-card") return "Rate Card";
  if (panel === "audience") return "Total Audience";
  if (panel === "performance") return "Performance History";
  if (panel === "seasonal") return "Engagement over the seasons";
  return "Followers Across Months";
}

function panelDescription(panel: TalentDataPanel) {
  if (panel === "rate-card") return "Editable commercial pricing and terms.";
  if (panel === "audience") return "Audience split by demographic group.";
  if (panel === "performance") return "Engagement and reach from 2021-2025.";
  if (panel === "seasonal") return "Seasonal channel engagement comparison.";
  return "Monthly follower growth by platform.";
}

function MiniPanelButton({
  panel,
  active,
  onClick,
}: {
  panel: TalentDataPanel;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${
        active
          ? "border-[var(--accent-blue)] bg-[#eef8f1] shadow-[var(--shadow-soft)]"
          : "border-[var(--border)] bg-white hover:-translate-y-0.5 hover:border-[var(--accent-blue)]"
      }`}
    >
      <p className="text-sm font-semibold">{formatPanelLabel(panel)}</p>
      <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{panelDescription(panel)}</p>
    </button>
  );
}

function ChartFrame({ children }: { children: React.ReactNode }) {
  return <div className="h-[340px] min-w-0">{children}</div>;
}

function renderChart(panel: Exclude<TalentDataPanel, "rate-card">, data: TalentAnalyticsData) {
  if (panel === "audience") {
    return (
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.audience} dataKey="value" nameKey="name" outerRadius={116}>
              {data.audience.map((entry, index) => (
                <Cell key={entry.name} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartFrame>
    );
  }

  if (panel === "performance") {
    return (
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.performanceHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="engagement" stroke="#2F7F5F" strokeWidth={2} />
            <Line type="monotone" dataKey="reach" stroke="#5EA982" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    );
  }

  if (panel === "seasonal") {
    return (
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.seasonalEngagement}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="season" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="instagram" fill="#2F7F5F" />
            <Bar dataKey="tiktok" fill="#5EA982" />
            <Bar dataKey="youtube" fill="#C9A84C" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.platformGrowth}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="instagram" stackId="a" fill="#2F7F5F" />
          <Bar dataKey="tiktok" stackId="a" fill="#5EA982" />
          <Bar dataKey="youtube" stackId="a" fill="#C9A84C" />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function createDefaultRateCardItems(): RateCardTextBox[] {
  return defaultRateCardItems.map((item) => ({ ...item }));
}

export function createDefaultTalentAnalyticsData(): TalentAnalyticsData {
  return cloneAnalyticsData(defaultAnalyticsData);
}

export function AnalyticsCharts({
  kicker = "PERFORMANCE SNAPSHOT",
  caption = "data changes as post changes",
  isEditView = false,
  data = defaultAnalyticsData,
  onDataChange,
  rateCardItems = defaultRateCardItems,
  onRateCardItemsChange,
}: AnalyticsChartsProps) {
  const [activePanel, setActivePanel] = useState<TalentDataPanel>("rate-card");
  const resolvedData = data;
  const resolvedRateCardItems = rateCardItems.length > 0 ? rateCardItems : defaultRateCardItems;

  const updateRateCardItem = (id: string, patch: Partial<RateCardTextBox>) => {
    onRateCardItemsChange?.(
      resolvedRateCardItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const addRateCardTextBox = () => {
    onRateCardItemsChange?.([
      ...resolvedRateCardItems,
      {
        id: `rate-${Date.now()}`,
        text: "New rate or package detail",
        bold: false,
        italic: false,
      },
    ]);
  };

  const removeRateCardTextBox = (id: string) => {
    onRateCardItemsChange?.(resolvedRateCardItems.filter((item) => item.id !== id));
  };

  const updateAudienceValue = (index: number, field: "name" | "value", value: string) => {
    const nextData = cloneAnalyticsData(resolvedData);
    nextData.audience[index] = {
      ...nextData.audience[index],
      [field]: field === "value" ? Number(value) || 0 : value,
    };
    onDataChange?.(nextData);
  };

  const updatePerformanceValue = (
    index: number,
    field: "year" | "engagement" | "reach",
    value: string,
  ) => {
    const nextData = cloneAnalyticsData(resolvedData);
    nextData.performanceHistory[index] = {
      ...nextData.performanceHistory[index],
      [field]: field === "year" ? value : Number(value) || 0,
    };
    onDataChange?.(nextData);
  };

  const updateChannelValue = (
    collection: "seasonalEngagement" | "platformGrowth",
    index: number,
    field: "season" | "month" | "instagram" | "tiktok" | "youtube",
    value: string,
  ) => {
    const nextData = cloneAnalyticsData(resolvedData);
    const labelFields = ["season", "month"];
    nextData[collection][index] = {
      ...nextData[collection][index],
      [field]: labelFields.includes(field) ? value : Number(value) || 0,
    };
    onDataChange?.(nextData);
  };

  return (
    <section className="card-surface space-y-6 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-wide">{kicker}</p>
          <h2 className="mt-2 text-4xl font-bold text-[#174d38] md:text-5xl">Transparency</h2>
        </div>
        <p className="max-w-sm text-right text-xs text-[var(--text-secondary)]">{caption}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="card-surface min-w-0 bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="editorial-kicker">{activePanel === "rate-card" ? "Commercials" : "Featured Chart"}</p>
              <h3 className="text-2xl font-bold">{formatPanelLabel(activePanel)}</h3>
            </div>
            {isEditView && activePanel === "rate-card" ? (
              <button
                type="button"
                onClick={addRateCardTextBox}
                className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Add text box
              </button>
            ) : null}
          </div>

          {activePanel === "rate-card" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {resolvedRateCardItems.map((item) => (
                <article
                  key={item.id}
                  className="min-h-32 rounded-xl border border-[var(--border)] bg-[#fbfdfb] p-4 shadow-[var(--shadow-soft)]"
                >
                  {isEditView ? (
                    <div className="space-y-3">
                      <textarea
                        value={item.text}
                        onChange={(event) => updateRateCardItem(item.id, { text: event.target.value })}
                        className={`min-h-24 w-full resize-none rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--accent-blue)] ${
                          item.bold ? "font-bold" : "font-normal"
                        } ${item.italic ? "italic" : "not-italic"}`}
                        aria-label="Rate card text"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateRateCardItem(item.id, { bold: !item.bold })}
                          className={`h-9 w-9 rounded-lg border text-sm font-bold transition ${
                            item.bold
                              ? "border-[var(--accent-blue)] bg-[#eef8f1] text-[var(--accent-blue)]"
                              : "border-[var(--border)] bg-white"
                          }`}
                          aria-label="Toggle bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRateCardItem(item.id, { italic: !item.italic })}
                          className={`h-9 w-9 rounded-lg border text-sm italic transition ${
                            item.italic
                              ? "border-[var(--accent-blue)] bg-[#eef8f1] text-[var(--accent-blue)]"
                              : "border-[var(--border)] bg-white"
                          }`}
                          aria-label="Toggle italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRateCardTextBox(item.id)}
                          className="rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent-blue)]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={`whitespace-pre-wrap text-lg leading-8 text-[var(--text-primary)] ${
                        item.bold ? "font-bold" : "font-normal"
                      } ${item.italic ? "italic" : "not-italic"}`}
                    >
                      {item.text}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {renderChart(activePanel, resolvedData)}
              {isEditView && activePanel === "audience" ? (
                <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[#f8fbf9] p-3 md:grid-cols-2">
                  {resolvedData.audience.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="grid grid-cols-[1fr_90px] gap-2">
                      <input
                        value={item.name}
                        onChange={(event) => updateAudienceValue(index, "name", event.target.value)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                        aria-label="Audience label"
                      />
                      <input
                        value={item.value}
                        type="number"
                        onChange={(event) => updateAudienceValue(index, "value", event.target.value)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                        aria-label="Audience value"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {isEditView && activePanel === "performance" ? (
                <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[#f8fbf9] p-3 md:grid-cols-2">
                  {resolvedData.performanceHistory.map((item, index) => (
                    <div key={`${item.year}-${index}`} className="grid grid-cols-3 gap-2">
                      <input
                        value={item.year}
                        onChange={(event) => updatePerformanceValue(index, "year", event.target.value)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                        aria-label="Performance year"
                      />
                      <input
                        value={item.engagement}
                        type="number"
                        step="0.1"
                        onChange={(event) => updatePerformanceValue(index, "engagement", event.target.value)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                        aria-label="Engagement value"
                      />
                      <input
                        value={item.reach}
                        type="number"
                        onChange={(event) => updatePerformanceValue(index, "reach", event.target.value)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                        aria-label="Reach value"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {isEditView && activePanel === "seasonal" ? (
                <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[#f8fbf9] p-3">
                  {resolvedData.seasonalEngagement.map((item, index) => (
                    <div key={`${item.season}-${index}`} className="grid gap-2 md:grid-cols-4">
                      <input
                        value={item.season}
                        onChange={(event) => updateChannelValue("seasonalEngagement", index, "season", event.target.value)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                        aria-label="Season label"
                      />
                      {(["instagram", "tiktok", "youtube"] as const).map((field) => (
                        <input
                          key={field}
                          value={item[field]}
                          type="number"
                          step="0.1"
                          onChange={(event) => updateChannelValue("seasonalEngagement", index, field, event.target.value)}
                          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                          aria-label={`${field} seasonal value`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
              {isEditView && activePanel === "growth" ? (
                <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[#f8fbf9] p-3">
                  {resolvedData.platformGrowth.map((item, index) => (
                    <div key={`${item.month}-${index}`} className="grid gap-2 md:grid-cols-4">
                      <input
                        value={item.month}
                        onChange={(event) => updateChannelValue("platformGrowth", index, "month", event.target.value)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                        aria-label="Month label"
                      />
                      {(["instagram", "tiktok", "youtube"] as const).map((field) => (
                        <input
                          key={field}
                          value={item[field]}
                          type="number"
                          onChange={(event) => updateChannelValue("platformGrowth", index, field, event.target.value)}
                          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none"
                          aria-label={`${field} growth value`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <aside className="grid content-start gap-3">
          {(["rate-card", "audience", "seasonal", "performance", "growth"] as TalentDataPanel[]).map((panel) => (
            <MiniPanelButton
              key={panel}
              panel={panel}
              active={activePanel === panel}
              onClick={() => setActivePanel(panel)}
            />
          ))}
        </aside>
      </div>
    </section>
  );
}
