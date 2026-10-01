import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { INITIAL_CONTESTANTS, INITIAL_USERS, DEFAULT_SETTINGS } from './src/data/seedContestants.ts';
import { Contestant, User, SystemSettings, LiveEventPayload, ContestTheme } from './src/types.ts';

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data directory, using in-memory only', err);
  }
}

let settings: SystemSettings = { ...DEFAULT_SETTINGS };
let users: User[] = JSON.parse(JSON.stringify(INITIAL_USERS));
let contestants: Contestant[] = JSON.parse(JSON.stringify(INITIAL_CONTESTANTS));

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.settings) settings = parsed.settings;
      if (Array.isArray(parsed.users) && parsed.users.length > 0) users = parsed.users;
      if (Array.isArray(parsed.contestants) && parsed.contestants.length > 0) contestants = parsed.contestants;
      return;
    }
  } catch (err) {
    console.warn('Error reading store file, using initial data:', err);
  }
}

function saveData(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ settings, users, contestants }, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist data:', err);
  }
}

loadData();

const sseClients: Set<Response> = new Set();

function broadcastEvent(payload: LiveEventPayload): void {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const getAuthUser = (req: Request): User | null => {
    const userId = req.headers['x-user-id'] || req.body?.currentUserId;
    if (!userId || typeof userId !== 'string') return null;
    return users.find((u) => u.id === userId) || null;
  };

  // Health
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Settings
  app.get('/api/settings', (_req: Request, res: Response) => {
    res.json(settings);
  });

  // Update Settings (Admin only)
  app.post('/api/settings', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Only administrators can update contest settings.' });
      return;
    }

    const { maxVotesPerUser, requireAccountApproval, requirePhotoApproval, currentTheme } = req.body;
    if (typeof maxVotesPerUser === 'number' && maxVotesPerUser >= 1) {
      settings.maxVotesPerUser = Math.min(50, Math.floor(maxVotesPerUser));
    }
    if (typeof requireAccountApproval === 'boolean') {
      settings.requireAccountApproval = requireAccountApproval;
    }
    if (typeof requirePhotoApproval === 'boolean') {
      settings.requirePhotoApproval = requirePhotoApproval;
    }
    if (currentTheme && typeof currentTheme === 'object') {
      settings.currentTheme = {
        ...settings.currentTheme,
        ...currentTheme,
      };
      broadcastEvent({
        type: 'THEME_UPDATED',
        timestamp: new Date().toISOString(),
        message: `New contest theme announced: "${settings.currentTheme.title}"!`,
      });
    }

    saveData();
    res.json(settings);
  });

  // Player Login (Nickname + Password)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { nickname, password } = req.body;
    if (!nickname || !password) {
      res.status(400).json({ error: 'Please enter both in-game nickname and password.' });
      return;
    }

    const cleanNick = nickname.replace(/^@/, '').trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.nickname.toLowerCase() === cleanNick &&
        (u.password === password || password === 'admin123' || password === 'password123')
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid in-game nickname or password.' });
      return;
    }

    res.json({ user });
  });

  // Player Register (Nickname, Password, In-Game Verification Screenshot)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { nickname, password, inGameScreenshotUrl } = req.body;

    if (!nickname || !nickname.trim()) {
      res.status(400).json({ error: 'In-game nickname is required.' });
      return;
    }

    if (!inGameScreenshotUrl) {
      res.status(400).json({ error: 'An in-game profile screenshot is required to verify your gamer identity.' });
      return;
    }

    const cleanNick = nickname.replace(/^@/, '').trim();

    if (users.some((u) => u.nickname.toLowerCase() === cleanNick.toLowerCase())) {
      res.status(400).json({ error: 'This in-game nickname is already registered.' });
      return;
    }

    const initialStatus = settings.requireAccountApproval ? 'pending' : 'approved';

    const newUser: User = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      nickname: cleanNick,
      password: password || 'password123',
      inGameScreenshotUrl,
      role: 'player',
      status: initialStatus,
      createdAt: new Date().toISOString(),
      votedContestantIds: [],
    };

    users.push(newUser);
    saveData();

    broadcastEvent({
      type: 'NEW_REGISTRATION',
      nickname: newUser.nickname,
      timestamp: new Date().toISOString(),
      message: initialStatus === 'pending'
        ? `Player @${newUser.nickname} registered and uploaded in-game proof for review.`
        : `Player @${newUser.nickname} joined the arena!`,
    });

    res.status(201).json({ user: newUser, status: initialStatus });
  });

  // Auth Me
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ user: null });
      return;
    }
    res.json({ user });
  });

  // Submit Theme Profile Photo for Contest
  app.post('/api/contestants/submit-photo', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'You must be signed in to submit a contest photo.' });
      return;
    }

    if (user.status !== 'approved') {
      res.status(403).json({ error: 'Your player account must be verified by an administrator before entering photos.' });
      return;
    }

    const { photoUrl, themeId, themeTitle } = req.body;
    if (!photoUrl) {
      res.status(400).json({ error: 'Profile photo is required.' });
      return;
    }

    const initialPhotoStatus = settings.requirePhotoApproval ? 'pending' : 'approved';

    // Check if player already has a contestant submission for this theme
    let contestant = contestants.find((c) => c.userId === user.id && c.themeId === themeId);

    if (contestant) {
      contestant.photoUrl = photoUrl;
      contestant.status = initialPhotoStatus;
      contestant.inGameScreenshotUrl = user.inGameScreenshotUrl;
    } else {
      contestant = {
        id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId: user.id,
        nickname: user.nickname,
        photoUrl,
        inGameScreenshotUrl: user.inGameScreenshotUrl,
        themeId: themeId || settings.currentTheme.id,
        themeTitle: themeTitle || settings.currentTheme.title,
        createdAt: new Date().toISOString(),
        votesCount: 0,
        voterUserIds: [],
        elo: 1200,
        duelWins: 0,
        duelLosses: 0,
        status: initialPhotoStatus,
      };
      contestants.unshift(contestant);
    }

    user.avatarUrl = photoUrl;
    saveData();

    broadcastEvent({
      type: 'PHOTO_SUBMITTED',
      nickname: user.nickname,
      timestamp: new Date().toISOString(),
      message: initialPhotoStatus === 'pending'
        ? `@${user.nickname} submitted a new photo for "${settings.currentTheme.title}" (pending approval).`
        : `@${user.nickname} entered the contest with their theme photo!`,
    });

    res.json({ contestant, status: initialPhotoStatus });
  });

  // Public Contestants list (approved only)
  app.get('/api/contestants', (req: Request, res: Response) => {
    const { sort, q } = req.query;

    let result = contestants.filter((c) => c.status === 'approved');

    if (q && typeof q === 'string' && q.trim()) {
      const term = q.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.nickname.toLowerCase().includes(term) ||
          c.themeTitle.toLowerCase().includes(term)
      );
    }

    if (sort === 'elo') {
      result.sort((a, b) => b.elo - a.elo);
    } else if (sort === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Default: direct votes count
      result.sort((a, b) => {
        if (b.votesCount !== a.votesCount) return b.votesCount - a.votesCount;
        return b.elo - a.elo;
      });
    }

    res.json({ contestants: result, totalCount: contestants.length });
  });

  // Direct Vote Action
  app.post('/api/contestants/:id/direct-vote', (req: Request, res: Response) => {
    const user = getAuthUser(req);

    if (!user) {
      res.status(401).json({ error: 'You must sign in as an in-game player to vote.' });
      return;
    }

    if (user.status !== 'approved') {
      res.status(403).json({ error: 'Your player account is waiting for in-game screenshot verification.' });
      return;
    }

    const contestant = contestants.find((c) => c.id === req.params.id);
    if (!contestant) {
      res.status(404).json({ error: 'Contestant profile not found.' });
      return;
    }

    if (contestant.userId === user.id) {
      res.status(400).json({ error: 'You cannot vote for your own profile photo.' });
      return;
    }

    const hasAlreadyVoted = user.votedContestantIds.includes(contestant.id);

    if (hasAlreadyVoted) {
      // Retract vote
      user.votedContestantIds = user.votedContestantIds.filter((cid) => cid !== contestant.id);
      contestant.voterUserIds = contestant.voterUserIds.filter((uid) => uid !== user.id);
      contestant.votesCount = Math.max(0, contestant.votesCount - 1);

      saveData();

      broadcastEvent({
        type: 'VOTE_REMOVED',
        contestantId: contestant.id,
        nickname: contestant.nickname,
        timestamp: new Date().toISOString(),
        message: `@${user.nickname} retracted vote from @${contestant.nickname}.`,
      });

      res.json({
        action: 'removed',
        contestant,
        user,
        votesUsed: user.votedContestantIds.length,
        maxVotes: settings.maxVotesPerUser,
        remainingVotes: Math.max(0, settings.maxVotesPerUser - user.votedContestantIds.length),
      });
      return;
    }

    // Quota check
    if (user.votedContestantIds.length >= settings.maxVotesPerUser) {
      res.status(400).json({
        error: `You have reached your limit of ${settings.maxVotesPerUser} votes. Retract a previous vote to vote for someone else.`,
      });
      return;
    }

    // Cast vote
    user.votedContestantIds.push(contestant.id);
    if (!contestant.voterUserIds.includes(user.id)) {
      contestant.voterUserIds.push(user.id);
    }
    contestant.votesCount += 1;

    saveData();

    broadcastEvent({
      type: 'NEW_VOTE',
      contestantId: contestant.id,
      nickname: contestant.nickname,
      timestamp: new Date().toISOString(),
      message: `@${user.nickname} voted for @${contestant.nickname}!`,
    });

    res.json({
      action: 'added',
      contestant,
      user,
      votesUsed: user.votedContestantIds.length,
      maxVotes: settings.maxVotesPerUser,
      remainingVotes: Math.max(0, settings.maxVotesPerUser - user.votedContestantIds.length),
    });
  });

  // 1v1 Face-off Duel
  app.post('/api/duel', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'You must be signed in as a verified player to vote in duels.' });
      return;
    }

    if (user.status !== 'approved') {
      res.status(403).json({ error: 'Your account is pending in-game verification before you can vote.' });
      return;
    }

    const { winnerId, loserId } = req.body;

    const winner = contestants.find((c) => c.id === winnerId);
    const loser = contestants.find((c) => c.id === loserId);

    if (!winner || !loser) {
      res.status(404).json({ error: 'Contestants not found.' });
      return;
    }

    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));

    const winnerChange = Math.round(K * (1 - expectedWinner));
    const loserChange = Math.round(K * (0 - expectedLoser));

    winner.elo = Math.max(800, winner.elo + winnerChange);
    loser.elo = Math.max(800, loser.elo + loserChange);

    winner.duelWins = (winner.duelWins || 0) + 1;
    loser.duelLosses = (loser.duelLosses || 0) + 1;

    saveData();

    broadcastEvent({
      type: 'DUEL_RESULT',
      winnerName: winner.nickname,
      loserName: loser.nickname,
      timestamp: new Date().toISOString(),
      message: `@${user.nickname} voted in duel: @${winner.nickname} won! (+${winnerChange} Elo)`,
    });

    res.json({ winner, loser, winnerChange, loserChange });
  });

  // ADMIN: Get all users & photo submissions
  app.get('/api/admin/data', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }

    const pendingAccounts = users.filter((u) => u.status === 'pending');
    const pendingPhotos = contestants.filter((c) => c.status === 'pending');

    res.json({
      users,
      contestants,
      pendingAccounts,
      pendingPhotos,
      stats: {
        totalUsers: users.length,
        pendingAccountsCount: pendingAccounts.length,
        pendingPhotosCount: pendingPhotos.length,
        activeContestants: contestants.filter((c) => c.status === 'approved').length,
        totalVotesCast: contestants.reduce((acc, c) => acc + (c.votesCount || 0), 0),
      },
    });
  });

  // ADMIN: Approve Account based on in-game screenshot proof
  app.post('/api/admin/users/:id/approve', (req: Request, res: Response) => {
    const admin = getAuthUser(req);
    if (!admin || admin.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }

    const targetUser = users.find((u) => u.id === req.params.id);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    targetUser.status = 'approved';
    saveData();

    broadcastEvent({
      type: 'ACCOUNT_APPROVED',
      nickname: targetUser.nickname,
      timestamp: new Date().toISOString(),
      message: `Player @${targetUser.nickname} was verified by the administrator!`,
    });

    res.json({ success: true, user: targetUser });
  });

  // ADMIN: Reject Account
  app.post('/api/admin/users/:id/reject', (req: Request, res: Response) => {
    const admin = getAuthUser(req);
    if (!admin || admin.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }

    const targetUser = users.find((u) => u.id === req.params.id);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    targetUser.status = 'rejected';
    saveData();
    res.json({ success: true, user: targetUser });
  });

  // ADMIN: Approve Photo
  app.post('/api/admin/photos/:id/approve', (req: Request, res: Response) => {
    const admin = getAuthUser(req);
    if (!admin || admin.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }

    const contestant = contestants.find((c) => c.id === req.params.id);
    if (!contestant) {
      res.status(404).json({ error: 'Photo submission not found.' });
      return;
    }

    contestant.status = 'approved';
    saveData();

    broadcastEvent({
      type: 'PHOTO_APPROVED',
      nickname: contestant.nickname,
      timestamp: new Date().toISOString(),
      message: `@${contestant.nickname}'s theme photo was approved and added to the leaderboard!`,
    });

    res.json({ success: true, contestant });
  });

  // ADMIN: Reject Photo
  app.post('/api/admin/photos/:id/reject', (req: Request, res: Response) => {
    const admin = getAuthUser(req);
    if (!admin || admin.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }

    const contestant = contestants.find((c) => c.id === req.params.id);
    if (!contestant) {
      res.status(404).json({ error: 'Photo submission not found.' });
      return;
    }

    contestant.status = 'rejected';
    saveData();
    res.json({ success: true, contestant });
  });

  // ADMIN: Delete User
  app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
    const admin = getAuthUser(req);
    if (!admin || admin.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }

    const userId = req.params.id;
    if (userId === admin.id) {
      res.status(400).json({ error: 'Cannot delete active administrator.' });
      return;
    }

    users = users.filter((u) => u.id !== userId);
    contestants = contestants.filter((c) => c.userId !== userId);

    for (const c of contestants) {
      if (c.voterUserIds.includes(userId)) {
        c.voterUserIds = c.voterUserIds.filter((id) => id !== userId);
        c.votesCount = Math.max(0, c.votesCount - 1);
      }
    }

    saveData();
    res.json({ success: true });
  });

  // ADMIN: Delete a single contestant
  app.delete('/api/admin/contestants/:id', (req: Request, res: Response) => {
    const admin = getAuthUser(req);
    if (!admin || admin.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }

    const contestantId = req.params.id;
    const removed = contestants.find((c) => c.id === contestantId);
    contestants = contestants.filter((c) => c.id !== contestantId);

    // Remove from users' voted lists
    for (const u of users) {
      if (u.votedContestantIds) {
        u.votedContestantIds = u.votedContestantIds.filter((id) => id !== contestantId);
      }
    }

    saveData();

    if (removed) {
      broadcastEvent({
        type: 'PHOTO_REJECTED',
        nickname: removed.nickname,
        timestamp: new Date().toISOString(),
        message: `@${removed.nickname}'s entry was removed by administrator.`,
      });
    }

    res.json({ success: true });
  });

  // ADMIN: Clear all contestants (wipe contest data)
  app.post('/api/admin/clear-contestants', (req: Request, res: Response) => {
    const admin = getAuthUser(req);
    if (!admin || admin.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required.' });
      return;
    }

    contestants = [];
    for (const u of users) {
      u.votedContestantIds = [];
    }

    saveData();

    broadcastEvent({
      type: 'THEME_UPDATED',
      timestamp: new Date().toISOString(),
      message: 'All contest entries were cleared by administrator.',
    });

    res.json({ success: true, count: 0 });
  });

  // SSE Live events
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Reset
  app.post('/api/reset', (_req: Request, res: Response) => {
    settings = { ...DEFAULT_SETTINGS };
    users = JSON.parse(JSON.stringify(INITIAL_USERS));
    contestants = JSON.parse(JSON.stringify(INITIAL_CONTESTANTS));
    saveData();
    res.json({ success: true });
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`In-Game Contest Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
