import { Contestant, LiveEventPayload, SortOption, SystemSettings, User } from '../types.ts';
import { INITIAL_CONTESTANTS, DEFAULT_SETTINGS } from '../data/seedContestants.ts';

const USER_SESSION_KEY = 'fotopuan_current_player';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
    }
  } catch {
    // Ignore
  }
}

function getAuthHeaders(): HeadersInit {
  const user = getStoredUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user) {
    headers['x-user-id'] = user.id;
  }
  return headers;
}

export async function fetchSettings(): Promise<SystemSettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API error fetching settings, fallback:', err);
  }
  return DEFAULT_SETTINGS;
}

export async function updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update contest settings');
  }
  return await res.json();
}

export async function loginPlayer(nickname: string, password: string): Promise<User> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed. Check your nickname or password.');
  }
  const data = await res.json();
  setStoredUser(data.user);
  return data.user;
}

export async function registerPlayer(data: {
  nickname: string;
  password?: string;
  inGameScreenshotUrl: string;
}): Promise<{ user: User; status: 'pending' | 'approved' }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registration failed');
  }
  const result = await res.json();
  setStoredUser(result.user);
  return result;
}

export async function checkCurrentUser(): Promise<User | null> {
  const stored = getStoredUser();
  if (!stored) return null;
  try {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        setStoredUser(data.user);
        return data.user;
      }
    }
  } catch {
    // Ignore
  }
  return stored;
}

export async function submitContestPhoto(data: {
  photoUrl: string;
  themeId: string;
  themeTitle: string;
}): Promise<{ contestant: Contestant; status: 'pending' | 'approved' }> {
  const res = await fetch('/api/contestants/submit-photo', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Could not submit theme photo');
  }
  return await res.json();
}

export async function fetchContestants(
  sort: SortOption = 'votes',
  query: string = ''
): Promise<{ contestants: Contestant[]; totalCount: number }> {
  try {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (query) params.set('q', query);

    const res = await fetch(`/api/contestants?${params.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API error loading contestants, using fallback:', err);
  }

  return { contestants: INITIAL_CONTESTANTS, totalCount: INITIAL_CONTESTANTS.length };
}

export async function castDirectVote(contestantId: string): Promise<{
  action: 'added' | 'removed';
  contestant: Contestant;
  user: User;
  remainingVotes: number;
  votesUsed: number;
  maxVotes: number;
}> {
  const res = await fetch(`/api/contestants/${contestantId}/direct-vote`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Could not register vote.');
  }

  const data = await res.json();
  setStoredUser(data.user);
  return data;
}

export async function submitContestantDuel(
  winnerId: string,
  loserId: string
): Promise<{ winner: Contestant; loser: Contestant }> {
  const res = await fetch('/api/duel', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ winnerId, loserId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Duel vote failed');
  }
  return await res.json();
}

export async function deleteContestant(contestantId: string): Promise<void> {
  const res = await fetch(`/api/admin/contestants/${contestantId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to remove contestant');
  }
}

export async function clearAllContestants(): Promise<void> {
  const res = await fetch('/api/admin/clear-contestants', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to clear contest data');
  }
}

// Admin APIs
export async function fetchAdminData(): Promise<{
  users: User[];
  contestants: Contestant[];
  pendingAccounts: User[];
  pendingPhotos: Contestant[];
  stats: {
    totalUsers: number;
    pendingAccountsCount: number;
    pendingPhotosCount: number;
    activeContestants: number;
    totalVotesCast: number;
  };
}> {
  const res = await fetch('/api/admin/data', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Admin authorization failed');
  return await res.json();
}

export async function approveUserAccount(userId: string): Promise<User> {
  const res = await fetch(`/api/admin/users/${userId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Account approval failed');
  }
  const data = await res.json();
  return data.user;
}

export async function rejectUserAccount(userId: string): Promise<User> {
  const res = await fetch(`/api/admin/users/${userId}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Account rejection failed');
  }
  const data = await res.json();
  return data.user;
}

export async function approveContestPhoto(contestantId: string): Promise<Contestant> {
  const res = await fetch(`/api/admin/photos/${contestantId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Photo approval failed');
  }
  const data = await res.json();
  return data.contestant;
}

export async function rejectContestPhoto(contestantId: string): Promise<Contestant> {
  const res = await fetch(`/api/admin/photos/${contestantId}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Photo rejection failed');
  }
  const data = await res.json();
  return data.contestant;
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Delete failed');
  }
}

export function subscribeToLiveEvents(
  onEvent: (event: LiveEventPayload) => void
): () => void {
  if (typeof window === 'undefined' || !window.EventSource) {
    return () => {};
  }

  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource('/api/events');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data && data.type !== 'CONNECTED') {
          onEvent(data);
        }
      } catch {
        // Ignore
      }
    };
  } catch {
    // Ignore
  }

  return () => {
    if (eventSource) eventSource.close();
  };
}
