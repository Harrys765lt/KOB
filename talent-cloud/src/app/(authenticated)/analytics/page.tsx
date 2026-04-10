import { AnalyticsCharts } from "@/components/analytics-chart";

export default function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <header>
        <p className="editorial-kicker mb-2">Creator Dashboard</p>
        <h1 className="text-4xl font-bold md:text-5xl">Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)]">Creator view dashboard (mock data)</p>
      </header>
      <AnalyticsCharts />
    </div>
  );
}
