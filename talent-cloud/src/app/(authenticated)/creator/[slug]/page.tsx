"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TalentCard } from "@/components/talent-card";
import { useUserRole } from "@/context/user-role-context";
import { mockCreators } from "@/lib/mock-data";

export default function CreatorProfilePage() {
  const router = useRouter();
  const { role } = useUserRole();
  const params = useParams<{ slug: string }>();
  const creator = mockCreators.find((item) => item.slug === params.slug) || mockCreators[0];

  useEffect(() => {
    if (role === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (role === "free_creator" || role === "paid_creator") {
      router.replace("/talent-card");
    }
  }, [role, router]);

  if (role === "unauthenticated" || role === "free_creator" || role === "paid_creator") {
    return null;
  }

  return <TalentCard creator={creator} viewer="brand" />;
}
