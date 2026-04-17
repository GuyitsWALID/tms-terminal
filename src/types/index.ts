export type ImpactLevel = 'high' | 'medium' | 'low';

export type MarketKey = "forex" | "crypto" | "commodities";

export interface EconomicEvent {
  id: string;
  eventKey?: string;
  time: string;
  eventDate?: string;
  currency: string;
  event: string;
  detailId?: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: ImpactLevel;
  scrapedDetail?: {
    source?: string;
    usualEffect?: string;
    frequency?: string;
    nextRelease?: string;
    ffNotes?: string;
    whyTradersCare?: string;
    items?: Array<{
      title: string;
      value: string;
    }>;
  };
  verifiedOpinion?: string;
  isStarred: boolean;
}

export interface VerifiedTrader {
  id: string;
  name: string;
  specialization: string;
  rank: string;
  avatarUrl: string;
}

export type PerspectiveBias = "bullish" | "bearish" | "neutral";

export interface VerifiedPerspective {
  id: string;
  eventKey: string;
  market: MarketKey;
  eventDate: string;
  currency: string;
  eventTitle: string;
  impact: ImpactLevel;
  analystId: string;
  analystName: string;
  analystDesk?: string;
  bias: PerspectiveBias;
  confidence: number;
  thesis: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerspectiveConsensus {
  eventKey: string;
  count: number;
  averageConfidence: number;
  dominantBias: PerspectiveBias;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  specialization?: string;
  favoriteMarket?: MarketKey;
  isActive?: boolean;
  role: "user" | "analyst" | "admin";
  isVerifiedAnalyst: boolean;
  inviteCodeUsed?: string;
  rank: string;
  xp: number;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  profile?: UserProfile;
}
