// Referral program — contracts shared between frontend and backend.
//
// Beta model: users accrue credits while EARLY_ACCESS=true. When the flag
// flips off, an admin job converts unredeemed credits into months of
// subscription (extending users.subscribed_until).

export const REFERRAL_QUALIFY_TASK_CHANGES = 10;
export const REFERRAL_QUALIFY_ACTIVE_DAYS = 7;
export const REFERRAL_QUALIFY_WINDOW_DAYS = 60;
export const REFERRAL_REFERRER_CAP = 3;

export type ReferralStatus = 'pending' | 'qualified' | 'expired';

export interface ReferralInvitee {
  referralId: string;
  status: ReferralStatus;
  createdAt: string;
  expiresAt: string;
  qualifiedAt: string | null;
}

export interface ReferralStats {
  referralCode: string | null;
  qualifiedCount: number;
  cap: number;
  pendingCount: number;
  creditsEarned: number;
  creditsRedeemed: number;
  invitees: ReferralInvitee[];
}

export interface ReferralStatsResponse {
  stats: ReferralStats;
}
