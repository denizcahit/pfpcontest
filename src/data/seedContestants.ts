import { Contestant, User, SystemSettings, ContestTheme } from '../types.ts';

export const DEFAULT_THEME: ContestTheme = {
  id: 'theme_active',
  title: 'Current Season Theme',
  description: 'Enter your game character profile screenshot and theme portrait. Administrators can set and customize this theme, description, dates, and inspiration photos at any time from the Admin Panel.',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  examplePhotoUrls: [],
  isActive: true,
};

export const DEFAULT_SETTINGS: SystemSettings = {
  maxVotesPerUser: 5,
  requireAccountApproval: true,
  requirePhotoApproval: true,
  currentTheme: DEFAULT_THEME,
};

// Clean initial state: sole administrator account for management, zero fake mockup contestants
export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin',
    nickname: 'admin',
    password: 'admin',
    inGameScreenshotUrl: '',
    avatarUrl: '',
    role: 'admin',
    status: 'approved',
    createdAt: new Date().toISOString(),
    votedContestantIds: [],
  },
];

// Clean state: zero fake contestants, zero fake votes
export const INITIAL_CONTESTANTS: Contestant[] = [];

export const THEME_PRESETS: ContestTheme[] = [];

export const AVATAR_PRESETS: { name: string; url: string }[] = [];
