export type Niche =
  | "Beauty"
  | "Food"
  | "Fashion"
  | "Lifestyle"
  | "Tech"
  | "Travel";

export type AccessTier = "public" | "free" | "paid";

export type UserRole =
  | "unauthenticated"
  | "free_creator"
  | "paid_creator"
  | "brand_subscriber"
  | "admin";

export type Creator = {
  id: string;
  credentialNumber: string;
  name: string;
  handle: string;
  slug: string;
  niche: Niche;
  location: string;
  followers: number;
  engagementRate: number;
  platforms: string[];
  baseRate: number;
  verified: boolean;
  foundingMember: boolean;
  bio: string;
  audience: string;
  contentDescription: string;
  brandsWorkedWith: string[];
  audienceDemographics: Record<string, number>;
  languages: string[];
};

export type JobListing = {
  id: string;
  brandName: string;
  contactPerson: {
    name: string;
    title: string;
    photoUrl: string;
  };
  description: string;
  niche: Niche;
  format: string;
  platform: string;
  rateRange: {
    min: number;
    max: number;
  };
  matchScore: number;
  brandReviews: Array<{
    rating: number;
    body: string;
    campaignType: string;
    date: string;
  }>;
  communityThreads: Array<{
    title: string;
    replies: number;
  }>;
};
