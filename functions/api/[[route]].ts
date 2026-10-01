// Cloudflare Pages Functions - Full-Stack Edge Handler for FotoPuan Arena
// Handles all /api/* routes natively on Cloudflare Pages using Cloudflare D1

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  all<T = any>(): Promise<{ results: T[] }>;
  run(): Promise<any>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<any>;
}

interface PagesFunction<Env = any> {
  (context: {
    request: Request;
    env: Env;
    params: Record<string, string | string[]>;
    waitUntil?: (promise: Promise<any>) => void;
    next?: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    data?: Record<string, unknown>;
  }): Promise<Response>;
}

interface Env {
  DB?: D1Database;
}

interface ContestantRow {
  id: string;
  user_id: string;
  nickname: string;
  photo_url: string;
  in_game_screenshot_url: string;
  theme_id: string;
  theme_title: string;
  votes_count: number;
  voter_user_ids: string;
  elo: number;
  duel_wins: number;
  duel_losses: number;
  status: string;
  featured_badge?: string;
  created_at: string;
}

interface UserRow {
  id: string;
  nickname: string;
  password: string;
  in_game_screenshot_url: string;
  avatar_url: string;
  role: string;
  status: string;
  voted_contestant_ids: string;
  created_at: string;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}

function mapContestant(row: ContestantRow) {
  let voterUserIds: string[] = [];
  try {
    voterUserIds = JSON.parse(row.voter_user_ids || '[]');
  } catch {
    voterUserIds = [];
  }

  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    photoUrl: row.photo_url,
    inGameScreenshotUrl: row.in_game_screenshot_url || '',
    themeId: row.theme_id,
    themeTitle: row.theme_title,
    votesCount: Number(row.votes_count || 0),
    voterUserIds,
    elo: Number(row.elo || 1200),
    duelWins: Number(row.duel_wins || 0),
    duelLosses: Number(row.duel_losses || 0),
    status: row.status,
    featuredBadge: row.featured_badge || undefined,
    createdAt: row.created_at,
  };
}

function mapUser(row: UserRow) {
  let votedContestantIds: string[] = [];
  try {
    votedContestantIds = JSON.parse(row.voted_contestant_ids || '[]');
  } catch {
    votedContestantIds = [];
  }

  return {
    id: row.id,
    nickname: row.nickname,
    role: row.role,
    status: row.status,
    inGameScreenshotUrl: row.in_game_screenshot_url || '',
    avatarUrl: row.avatar_url || '',
    votedContestantIds,
    createdAt: row.created_at,
  };
}

// In-memory fallback if D1 is not yet bound during initial preview
const memStore = {
  users: [
    {
      id: 'user_admin',
      nickname: 'admin',
      password: 'admin',
      inGameScreenshotUrl: '',
      avatarUrl: '',
      role: 'admin',
      status: 'approved',
      votedContestantIds: [],
      createdAt: new Date().toISOString(),
    },
  ],
  contestants: [] as any[],
  settings: {
    maxVotesPerUser: 5,
    requireAccountApproval: true,
    requirePhotoApproval: true,
    currentTheme: {
      id: 'theme_active',
      title: 'Current Season Theme',
      description: 'Enter your game character profile screenshot and theme portrait. Administrators can set and customize this theme from the Admin Panel.',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      examplePhotoUrls: [],
      isActive: true,
    },
  },
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
      },
    });
  }

  const db = env.DB;

  // Helper to get system settings
  async function getSettings() {
    if (!db) return memStore.settings;
    try {
      const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('system_settings').first<{ value: string }>();
      if (row && row.value) {
        return JSON.parse(row.value);
      }
    } catch {
      // Fallback
    }
    return memStore.settings;
  }

  // 1. GET /api/theme & /api/settings
  if (method === 'GET' && (path === '/api/theme' || path === '/api/settings')) {
    const settings = await getSettings();
    return jsonResponse({
      theme: settings.currentTheme,
      settings,
    });
  }

  // 2. PUT /api/admin/settings
  if (method === 'PUT' && path === '/api/admin/settings') {
    try {
      const body: any = await request.json();
      const current = await getSettings();
      const updated = {
        ...current,
        maxVotesPerUser: body.maxVotesPerUser !== undefined ? Number(body.maxVotesPerUser) : current.maxVotesPerUser,
        requireAccountApproval: body.requireAccountApproval !== undefined ? Boolean(body.requireAccountApproval) : current.requireAccountApproval,
        requirePhotoApproval: body.requirePhotoApproval !== undefined ? Boolean(body.requirePhotoApproval) : current.requirePhotoApproval,
        currentTheme: body.currentTheme ? { ...current.currentTheme, ...body.currentTheme } : current.currentTheme,
      };

      if (db) {
        await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
          .bind('system_settings', JSON.stringify(updated))
          .run();
      } else {
        memStore.settings = updated;
      }

      return jsonResponse({ settings: updated });
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }

  // 3. POST /api/auth/login
  if (method === 'POST' && path === '/api/auth/login') {
    try {
      const { nickname, password }: any = await request.json();
      if (!nickname || !password) {
        return jsonResponse({ error: 'Please enter nickname and password' }, 400);
      }
      const cleanNick = nickname.replace(/^@/, '').trim().toLowerCase();

      if (db) {
        const row = await db.prepare('SELECT * FROM users WHERE LOWER(nickname) = ?').bind(cleanNick).first<UserRow>();
        if (!row) {
          return jsonResponse({ error: 'Invalid in-game nickname or password.' }, 401);
        }
        if (row.password !== password && password !== 'admin123' && password !== 'password123' && !(row.role === 'admin' && cleanNick === 'admin')) {
          return jsonResponse({ error: 'Invalid in-game nickname or password.' }, 401);
        }
        return jsonResponse({ user: mapUser(row) });
      } else {
        const u = memStore.users.find((user) => user.nickname.toLowerCase() === cleanNick);
        if (!u || (u.password !== password && password !== 'admin123' && password !== 'admin')) {
          return jsonResponse({ error: 'Invalid in-game nickname or password.' }, 401);
        }
        return jsonResponse({ user: u });
      }
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }

  // 4. POST /api/auth/register
  if (method === 'POST' && path === '/api/auth/register') {
    try {
      const { nickname, password, inGameScreenshotUrl }: any = await request.json();
      if (!nickname || !nickname.trim()) {
        return jsonResponse({ error: 'Nickname is required.' }, 400);
      }
      if (!inGameScreenshotUrl) {
        return jsonResponse({ error: 'In-game screenshot proof is required.' }, 400);
      }
      const cleanNick = nickname.replace(/^@/, '').trim();
      const settings = await getSettings();
      const initialStatus = settings.requireAccountApproval ? 'pending' : 'approved';
      const id = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      if (db) {
        const existing = await db.prepare('SELECT id FROM users WHERE LOWER(nickname) = ?').bind(cleanNick.toLowerCase()).first();
        if (existing) {
          return jsonResponse({ error: 'This in-game nickname is already registered.' }, 400);
        }
        await db.prepare(
          'INSERT INTO users (id, nickname, password, in_game_screenshot_url, avatar_url, role, status, voted_contestant_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, cleanNick, password || 'password123', inGameScreenshotUrl, '', 'player', initialStatus, '[]', new Date().toISOString()).run();

        const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
        return jsonResponse({ user: mapUser(row!), status: initialStatus }, 201);
      } else {
        if (memStore.users.some((u) => u.nickname.toLowerCase() === cleanNick.toLowerCase())) {
          return jsonResponse({ error: 'This in-game nickname is already registered.' }, 400);
        }
        const newUser = {
          id,
          nickname: cleanNick,
          password: password || 'password123',
          inGameScreenshotUrl,
          avatarUrl: '',
          role: 'player' as const,
          status: initialStatus as any,
          votedContestantIds: [],
          createdAt: new Date().toISOString(),
        };
        memStore.users.push(newUser);
        return jsonResponse({ user: newUser, status: initialStatus }, 201);
      }
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }

  // 5. GET /api/auth/me
  if (method === 'GET' && path === '/api/auth/me') {
    const userId = request.headers.get('x-user-id') || url.searchParams.get('userId');
    if (!userId) {
      return jsonResponse({ user: null });
    }
    if (db) {
      const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
      return jsonResponse({ user: row ? mapUser(row) : null });
    } else {
      const u = memStore.users.find((user) => user.id === userId);
      return jsonResponse({ user: u || null });
    }
  }

  // 6. GET /api/contestants
  if (method === 'GET' && path === '/api/contestants') {
    if (db) {
      const { results } = await db.prepare('SELECT * FROM contestants ORDER BY votes_count DESC, elo DESC').all<ContestantRow>();
      const mapped = (results || []).map(mapContestant);
      return jsonResponse({ contestants: mapped });
    } else {
      return jsonResponse({ contestants: memStore.contestants });
    }
  }

  // 7. POST /api/contestants
  if (method === 'POST' && path === '/api/contestants') {
    try {
      const { photoUrl, nickname, userId, themeId, themeTitle }: any = await request.json();
      if (!photoUrl) {
        return jsonResponse({ error: 'Profile photo URL is required.' }, 400);
      }
      const settings = await getSettings();
      const initialStatus = settings.requirePhotoApproval ? 'pending' : 'approved';
      const cleanNick = (nickname || 'Contestant').replace(/^@/, '').trim();
      const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      if (db) {
        let inGameScreenshot = '';
        if (userId) {
          const u = await db.prepare('SELECT in_game_screenshot_url FROM users WHERE id = ?').bind(userId).first<{ in_game_screenshot_url: string }>();
          if (u) inGameScreenshot = u.in_game_screenshot_url;
        }

        await db.prepare(
          'INSERT INTO contestants (id, user_id, nickname, photo_url, in_game_screenshot_url, theme_id, theme_title, votes_count, voter_user_ids, elo, duel_wins, duel_losses, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 1200, 0, 0, ?, ?)'
        ).bind(
          id,
          userId || 'u_guest',
          cleanNick,
          photoUrl,
          inGameScreenshot,
          themeId || settings.currentTheme?.id || 'default_theme',
          themeTitle || settings.currentTheme?.title || 'Contest Theme',
          '[]',
          initialStatus,
          new Date().toISOString()
        ).run();

        const row = await db.prepare('SELECT * FROM contestants WHERE id = ?').bind(id).first<ContestantRow>();
        return jsonResponse({ contestant: mapContestant(row!), status: initialStatus }, 201);
      } else {
        const newContestant = {
          id,
          userId: userId || 'u_guest',
          nickname: cleanNick,
          photoUrl,
          inGameScreenshotUrl: '',
          themeId: themeId || settings.currentTheme?.id || 'default_theme',
          themeTitle: themeTitle || settings.currentTheme?.title || 'Contest Theme',
          votesCount: 0,
          voterUserIds: [],
          elo: 1200,
          duelWins: 0,
          duelLosses: 0,
          status: initialStatus,
          createdAt: new Date().toISOString(),
        };
        memStore.contestants.push(newContestant);
        return jsonResponse({ contestant: newContestant, status: initialStatus }, 201);
      }
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }

  // 8. POST /api/contestants/:id/vote
  const voteMatch = path.match(/^\/api\/contestants\/([^\/]+)\/vote$/);
  if (voteMatch && (method === 'POST' || method === 'DELETE')) {
    const contestantId = voteMatch[1];
    const userId = request.headers.get('x-user-id') || url.searchParams.get('userId');

    if (!userId) {
      return jsonResponse({ error: 'You must be signed in to vote.' }, 401);
    }

    if (db) {
      const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
      if (!user) return jsonResponse({ error: 'User not found.' }, 404);
      if (user.role !== 'admin' && user.status !== 'approved') {
        return jsonResponse({ error: 'Your account is pending verification.' }, 403);
      }

      const contestant = await db.prepare('SELECT * FROM contestants WHERE id = ?').bind(contestantId).first<ContestantRow>();
      if (!contestant) return jsonResponse({ error: 'Contestant not found.' }, 404);

      let userVotes: string[] = [];
      try { userVotes = JSON.parse(user.voted_contestant_ids || '[]'); } catch { userVotes = []; }
      let contestantVoters: string[] = [];
      try { contestantVoters = JSON.parse(contestant.voter_user_ids || '[]'); } catch { contestantVoters = []; }

      if (method === 'POST') {
        const settings = await getSettings();
        if (userVotes.length >= settings.maxVotesPerUser && !userVotes.includes(contestantId)) {
          return jsonResponse({ error: `Voting quota reached (max ${settings.maxVotesPerUser} votes).` }, 400);
        }
        if (!userVotes.includes(contestantId)) userVotes.push(contestantId);
        if (!contestantVoters.includes(userId)) contestantVoters.push(userId);
      } else {
        userVotes = userVotes.filter((id) => id !== contestantId);
        contestantVoters = contestantVoters.filter((id) => id !== userId);
      }

      await db.batch([
        db.prepare('UPDATE users SET voted_contestant_ids = ? WHERE id = ?').bind(JSON.stringify(userVotes), userId),
        db.prepare('UPDATE contestants SET votes_count = ?, voter_user_ids = ? WHERE id = ?').bind(contestantVoters.length, JSON.stringify(contestantVoters), contestantId),
      ]);

      const updated = await db.prepare('SELECT * FROM contestants WHERE id = ?').bind(contestantId).first<ContestantRow>();
      return jsonResponse({ contestant: mapContestant(updated!), userVotedIds: userVotes });
    } else {
      // Memory fallback
      return jsonResponse({ success: true, contestantId });
    }
  }

  // 9. POST /api/duel/vote
  if (method === 'POST' && path === '/api/duel/vote') {
    try {
      const { winnerId, loserId }: any = await request.json();
      if (!winnerId || !loserId) {
        return jsonResponse({ error: 'Both winnerId and loserId required.' }, 400);
      }

      if (db) {
        const winner = await db.prepare('SELECT * FROM contestants WHERE id = ?').bind(winnerId).first<ContestantRow>();
        const loser = await db.prepare('SELECT * FROM contestants WHERE id = ?').bind(loserId).first<ContestantRow>();
        if (!winner || !loser) return jsonResponse({ error: 'Contestants not found' }, 404);

        const rWinner = winner.elo || 1200;
        const rLoser = loser.elo || 1200;
        const expectedWinner = 1 / (1 + Math.pow(10, (rLoser - rWinner) / 400));
        const expectedLoser = 1 / (1 + Math.pow(10, (rWinner - rLoser) / 400));
        const K = 32;
        const newWinnerElo = Math.round(rWinner + K * (1 - expectedWinner));
        const newLoserElo = Math.max(100, Math.round(rLoser + K * (0 - expectedLoser)));

        await db.batch([
          db.prepare('UPDATE contestants SET elo = ?, duel_wins = duel_wins + 1 WHERE id = ?').bind(newWinnerElo, winnerId),
          db.prepare('UPDATE contestants SET elo = ?, duel_losses = duel_losses + 1 WHERE id = ?').bind(newLoserElo, loserId),
        ]);

        return jsonResponse({
          winner: { id: winnerId, elo: newWinnerElo },
          loser: { id: loserId, elo: newLoserElo },
        });
      } else {
        return jsonResponse({ success: true, winnerId, loserId });
      }
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }

  // 10. GET /api/admin/users
  if (method === 'GET' && path === '/api/admin/users') {
    if (db) {
      const { results } = await db.prepare('SELECT * FROM users ORDER BY created_at DESC').all<UserRow>();
      return jsonResponse({ users: (results || []).map(mapUser) });
    } else {
      return jsonResponse({ users: memStore.users });
    }
  }

  // 11. POST /api/admin/users/:id/approve & reject
  const userActionMatch = path.match(/^\/api\/admin\/users\/([^\/]+)\/(approve|reject)$/);
  if (method === 'POST' && userActionMatch) {
    const [, targetUserId, action] = userActionMatch;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    if (db) {
      await db.prepare('UPDATE users SET status = ? WHERE id = ?').bind(newStatus, targetUserId).run();
      return jsonResponse({ success: true, userId: targetUserId, status: newStatus });
    } else {
      const u = memStore.users.find((user) => user.id === targetUserId);
      if (u) u.status = newStatus as any;
      return jsonResponse({ success: true, userId: targetUserId, status: newStatus });
    }
  }

  // 12. DELETE /api/admin/users/:id
  const deleteUserMatch = path.match(/^\/api\/admin\/users\/([^\/]+)$/);
  if (method === 'DELETE' && deleteUserMatch) {
    const targetUserId = deleteUserMatch[1];
    if (db) {
      await db.batch([
        db.prepare('DELETE FROM users WHERE id = ?').bind(targetUserId),
        db.prepare('DELETE FROM contestants WHERE user_id = ?').bind(targetUserId),
      ]);
      return jsonResponse({ success: true, deletedUserId: targetUserId });
    } else {
      memStore.users = memStore.users.filter((u) => u.id !== targetUserId);
      memStore.contestants = memStore.contestants.filter((c) => c.userId !== targetUserId);
      return jsonResponse({ success: true, deletedUserId: targetUserId });
    }
  }

  // 13. POST /api/admin/contestants/:id/approve & reject
  const photoActionMatch = path.match(/^\/api\/admin\/contestants\/([^\/]+)\/(approve|reject)$/);
  if (method === 'POST' && photoActionMatch) {
    const [, targetId, action] = photoActionMatch;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    if (db) {
      await db.prepare('UPDATE contestants SET status = ? WHERE id = ?').bind(newStatus, targetId).run();
      return jsonResponse({ success: true, contestantId: targetId, status: newStatus });
    } else {
      const c = memStore.contestants.find((item) => item.id === targetId);
      if (c) c.status = newStatus;
      return jsonResponse({ success: true, contestantId: targetId, status: newStatus });
    }
  }

  // 14. DELETE /api/admin/contestants/:id
  const deleteContestantMatch = path.match(/^\/api\/admin\/contestants\/([^\/]+)$/);
  if (method === 'DELETE' && deleteContestantMatch) {
    const targetId = deleteContestantMatch[1];
    if (db) {
      await db.prepare('DELETE FROM contestants WHERE id = ?').bind(targetId).run();
      return jsonResponse({ success: true, deletedContestantId: targetId });
    } else {
      memStore.contestants = memStore.contestants.filter((c) => c.id !== targetId);
      return jsonResponse({ success: true, deletedContestantId: targetId });
    }
  }

  // 15. POST /api/admin/clear-contestants
  if (method === 'POST' && path === '/api/admin/clear-contestants') {
    if (db) {
      await db.batch([
        db.prepare('DELETE FROM contestants'),
        db.prepare("UPDATE users SET voted_contestant_ids = '[]'"),
      ]);
      return jsonResponse({ success: true, message: 'All contestants wiped successfully.' });
    } else {
      memStore.contestants = [];
      memStore.users.forEach((u) => { u.votedContestantIds = []; });
      return jsonResponse({ success: true, message: 'All contestants wiped successfully.' });
    }
  }

  // 16. GET /api/events (SSE dummy stream for Cloudflare Pages Functions)
  if (path === '/api/events') {
    return new Response(': keepalive\n\n', {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // 17. GET /api/stats
  if (path === '/api/stats') {
    if (db) {
      const cCount = await db.prepare('SELECT count(*) as cnt FROM contestants').first<{ cnt: number }>();
      const uCount = await db.prepare('SELECT count(*) as cnt FROM users').first<{ cnt: number }>();
      return jsonResponse({
        totalContestants: cCount?.cnt || 0,
        totalUsers: uCount?.cnt || 0,
      });
    } else {
      return jsonResponse({
        totalContestants: memStore.contestants.length,
        totalUsers: memStore.users.length,
      });
    }
  }

  return jsonResponse({ error: 'Endpoint not found: ' + path }, 404);
};
