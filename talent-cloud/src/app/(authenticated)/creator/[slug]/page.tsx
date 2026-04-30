"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ModelCard } from "@/components/model-card";
import { useUserRole } from "@/context/user-role-context";
import { mockCreators } from "@/lib/mock-data";

export default function CreatorProfilePage() {
  const router = useRouter();
  const { account, role, isHydrated } = useUserRole();
  const params = useParams<{ slug: string }>();
  const creator = mockCreators.find((item) => item.slug === params.slug) || mockCreators[0];

  useEffect(() => {
    if (!isHydrated) return;

    if (role === "unauthenticated") {
      router.replace("/login");
      return;
    }
  }, [isHydrated, role, router]);

  if (!isHydrated || role === "unauthenticated") {
    return null;
  }

  const isOwner =
    Boolean(account?.id && creator.ownerAccountId && account.id === creator.ownerAccountId) ||
    Boolean(account?.creatorSlug && account.creatorSlug === creator.slug);

  return <ModelCard creator={creator} viewer={isOwner ? "creator" : "brand"} />;
}
