"use client";

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
import { analyticsData } from "@/lib/mock-data";

const palette = ["#2F7F5F", "#5EA982", "#C9A84C", "#8BB7A1"];

export function AnalyticsCharts() {
  return (
    <section className="card-surface space-y-6 p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold tracking-wide">PERFORMANCE SNAPSHOT</p>
        <p className="text-xs text-[var(--text-secondary)]">data changes as post changes</p>
      </div>
      <h2 className="text-center text-4xl font-bold md:text-5xl">Data Don&apos;t Lie</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-surface bg-white p-4">
          <p className="mb-2 text-sm font-semibold">Total Audience</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={analyticsData.audience} dataKey="value" nameKey="name" outerRadius={90}>
                  {analyticsData.audience.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface bg-white p-4">
          <p className="mb-2 text-sm font-semibold">Performance History (2021-2025)</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={analyticsData.performanceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="engagement" stroke="#2F7F5F" strokeWidth={2} />
                <Line type="monotone" dataKey="reach" stroke="#5EA982" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface bg-white p-4">
          <p className="mb-2 text-sm font-semibold">Engagement over the seasons</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analyticsData.seasonalEngagement}>
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
          </div>
        </div>

        <div className="card-surface bg-white p-4">
          <p className="mb-2 text-sm font-semibold">Followers Across Months</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analyticsData.platformGrowth}>
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
          </div>
        </div>
      </div>
    </section>
  );
}
