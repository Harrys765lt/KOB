export type Niche =
  | "Beauty"
  | "Food"
  | "Fashion"
  | "Lifestyle"
  | "Tech"
  | "Travel";

export type ModelingCapability = "Commercial" | "Runway" | "Editorial";

export type AccessTier = "public" | "free" | "paid";

export type JobTalentType = "Model" | "KOL" | "Content Creator" | "Food Reviewer";

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
  ownerAccountId?: string;
  headshotImage?: string;
  fullBodyImages?: string[];
  cardPlaceholderImage?: string;
  race?: string;
  gender?: string;
  modelingCapabilities?: ModelingCapability[];
};

export type JobListing = {
  id: string;
  brandName: string;
  contactPerson: {
    name: string;
    title: string;
    photoUrl: string;
    threadId: string;
  };
  companyIntro: string;
  description: string;
  talentTypes: JobTalentType[];
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
  similarJobs?: Array<{
    id: string;
    brandName: string;
    description: string;
    talentTypes: JobTalentType[];
    platform: string;
    rateRange: {
      min: number;
      max: number;
    };
    matchScore: number;
  }>;
};

export type ProfileViewerCategory =
  | "Brands"
  | "Models"
  | "Creators"
  | "Representatives"
  | "Recruiters";

export type ProfileViewer = {
  id: string;
  name: string;
  title: string;
  category: ProfileViewerCategory;
  viewedAt: string;
};

export type TrackedJob = {
  jobId: string;
  status: string;
  nextStep: string;
  updatedAt: string;
};

export type TalentMessage = {
  id: string;
  senderName: string;
  senderTitle: string;
  preview: string;
  sentAt: string;
  unreadCount: number;
};
