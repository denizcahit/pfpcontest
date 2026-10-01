// Voter session and client persistence

const VOTER_ID_KEY = 'fotopuan_voter_id';
const MY_CONTESTANT_KEY = 'fotopuan_my_contestant_id';
const VOTED_CONTESTANTS_KEY = 'fotopuan_voted_map'; // Record<contestantId, score>

export function getVoterId(): string {
  try {
    let id = localStorage.getItem(VOTER_ID_KEY);
    if (!id) {
      id = 'voter_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(VOTER_ID_KEY, id);
    }
    return id;
  } catch {
    return 'voter_anonymous_' + Math.random().toString(36).substring(2, 8);
  }
}

export function getMyContestantId(): string | null {
  try {
    return localStorage.getItem(MY_CONTESTANT_KEY);
  } catch {
    return null;
  }
}

export function setMyContestantId(id: string): void {
  try {
    localStorage.setItem(MY_CONTESTANT_KEY, id);
  } catch {
    // Ignore
  }
}

export function getVotedMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(VOTED_CONTESTANTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordLocalVote(contestantId: string, score: number): void {
  try {
    const map = getVotedMap();
    map[contestantId] = score;
    localStorage.setItem(VOTED_CONTESTANTS_KEY, JSON.stringify(map));
  } catch {
    // Ignore
  }
}
