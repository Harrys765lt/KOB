"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsCharts } from "@/components/analytics-chart";
import { useUserRole } from "@/context/user-role-context";

export default function AnalyticsPage() {
  const router = useRouter();
  const { role } = useUserRole();

  useEffect(() => {
    if (role === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (role === "brand_subscriber") {
      router.replace("/order-book");
    }
  }, [role, router]);

  if (role === "unauthenticated" || role === "brand_subscriber") {
    return null;
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="editorial-kicker mb-2">Talent Dashboard</p>
        <h1 className="text-4xl font-bold md:text-5xl">Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)]">Your card performance and audience trend dashboard.</p>
      </header>
      <AnalyticsCharts />
    </div>
  );
}
