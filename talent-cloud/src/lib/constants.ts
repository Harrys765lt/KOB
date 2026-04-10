import { Niche, UserRole } from "@/lib/types";

export const userRoles: Record<string, UserRole> = {
  UNAUTHENTICATED: "unauthenticated",
  FREE_CREATOR: "free_creator",
  PAID_CREATOR: "paid_creator",
  BRAND_SUBSCRIBER: "brand_subscriber",
  ADMIN: "admin",
};

export const nicheColorMap: Record<Niche, string> = {
  Beauty: "var(--niche-beauty)",
  Food: "var(--niche-food)",
  Fashion: "var(--niche-fashion)",
  Lifestyle: "var(--niche-lifestyle)",
  Tech: "var(--niche-tech)",
  Travel: "var(--niche-travel)",
};

export const roleRank: Record<UserRole, number> = {
  unauthenticated: 0,
  free_creator: 1,
  paid_creator: 2,
  brand_subscriber: 3,
  admin: 4,
};
