export type ImpactLevel = 'high' | 'medium' | 'low';

export interface EconomicEvent {
  id: string;
  time: string;
  eventDate?: string;
  currency: string;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
  impact: ImpactLevel;
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
