"use client";

import { useParams } from "next/navigation";
import { ModelMenuCard } from "@/components/model-menu-card";
import { useUserRole } from "@/context/user-role-context";
import { mockCreators } from "@/lib/mock-data";

export default function CreatorProfilePage() {
  const { role } = useUserRole();
  const params = useParams<{ slug: string }>();
  const creator = mockCreators.find((item) => item.slug === params.slug) || mockCreators[0];

  return <ModelMenuCard creator={creator} role={role} />;
}
