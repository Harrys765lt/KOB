"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TalentCard } from "@/components/talent-card";
import { useUserRole } from "@/context/user-role-context";
import { mockCreators } from "@/lib/mock-data";

const creatorSlugByRole = {
  free_creator: "naomi-tan",
  paid_creator: "kai-lim",
  admin: "naomi-tan",
} as const;

export default function TalentCardPage() {
  const router = useRouter();
  const { role, isHydrated } = useUserRole();

  const creator = useMemo(() => {
    const preferredSlug = creatorSlugByRole[role as keyof typeof creatorSlugByRole] ?? mockCreators[0].slug;
    return mockCreators.find((item) => item.slug === preferredSlug) || mockCreators[0];
  }, [role]);

  useEffect(() => {
    if (!isHydrated) return;

    if (role === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (role === "brand_subscriber") {
      router.replace("/order-book");
    }
  }, [isHydrated, role, router]);

  if (!isHydrated || role === "unauthenticated" || role === "brand_subscriber") {
    return null;
  }

  return (
    <div className="-mt-4 lg:-mt-7">
      <TalentCard creator={creator} viewer="creator" isAdmin={role === "admin"} />
    </div>
  );
}
