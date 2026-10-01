export type UserRole = 'admin' | 'player';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ContestTheme {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  examplePhotoUrls: string[]; // inspiration photos for the theme
  isActive: boolean;
}

export interface User {
  id: string;
  nickname: string; // In-game nickname only (no real names or emails)
  password?: string;
  inGameScreenshotUrl: string; // Proof of in-game profile
  avatarUrl?: string; // Contest profile photo
  role: UserRole;
  status: ApprovalStatus;
  createdAt: string;
  votedContestantIds: string[];
}

export interface Contestant {
  id: string;
  userId: string;
  nickname: string;
  photoUrl: string;
  inGameScreenshotUrl?: string; // accessible to inspect verification
  themeId: string;
  themeTitle: string;
  createdAt: string;
  votesCount: number;
  voterUserIds: string[];
  elo: number;
  duelWins: number;
  duelLosses: number;
  status: ApprovalStatus; // photo approval status
  featuredBadge?: string;
}

export interface SystemSettings {
  maxVotesPerUser: number;
  requireAccountApproval: boolean; // In-game proof verification required
  requirePhotoApproval: boolean; // Whether profile photos need admin approval before public listing
  currentTheme: ContestTheme;
}

export type SortOption = 'votes' | 'elo' | 'newest';

export interface LiveEventPayload {
  type: 'NEW_VOTE' | 'VOTE_REMOVED' | 'NEW_REGISTRATION' | 'ACCOUNT_APPROVED' | 'PHOTO_SUBMITTED' | 'PHOTO_APPROVED' | 'PHOTO_REJECTED' | 'DUEL_RESULT' | 'THEME_UPDATED';
  contestantId?: string;
  nickname?: string;
  winnerName?: string;
  loserName?: string;
  timestamp: string;
  message: string;
}

export type SupportedLanguage = 'en' | 'tr' | 'es' | 'de' | 'fr' | 'ar' | 'ru' | 'zh' | 'ja' | 'pt';
