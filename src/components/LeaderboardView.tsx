import React from 'react';
import { 
  Trophy, 
  Search, 
  Eye, 
  Sparkles, 
  Vote, 
  Check, 
  Camera,
  ZoomIn,
  ShieldCheck
} from 'lucide-react';
import { Contestant, SortOption, SystemSettings, User } from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { ThemeShowcaseBanner } from './ThemeShowcaseBanner.tsx';

interface LeaderboardViewProps {
  contestants: Contestant[];
  currentUser: User | null;
  settings: SystemSettings;
  sortOption: SortOption;
  onSelectSort: (sort: SortOption) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectContestant: (contestant: Contestant) => void;
  onVoteDirectly: (contestant: Contestant) => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenPhotoSubmitModal: () => void;
  onMagnifyImage: (imageUrl: string, title: string, secondaryUrl?: string, isVerification?: boolean) => void;
  recentlyUpdatedId?: string | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  contestants,
  currentUser,
  settings,
  sortOption,
  onSelectSort,
  searchQuery,
  onSearchChange,
  onSelectContestant,
  onVoteDirectly,
  onOpenAuthModal,
  onOpenPhotoSubmitModal,
  onMagnifyImage,
  recentlyUpdatedId,
}) => {
  const { t } = useLanguage();

  const top1 = contestants[0];
  const top2 = contestants[1];
  const top3 = contestants[2];

  const remainingVotes = currentUser
    ? Math.max(0, settings.maxVotesPerUser - (currentUser.votedContestantIds?.length || 0))
    : settings.maxVotesPerUser;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Active Theme Showcase Banner */}
      <ThemeShowcaseBanner
        theme={settings.currentTheme}
        currentUser={currentUser}
        onOpenPhotoSubmitModal={onOpenPhotoSubmitModal}
        onOpenAuthModal={onOpenAuthModal}
        onMagnifyImage={(url, title) => onMagnifyImage(url, title)}
      />

      {/* Top 3 Podium Showcase */}
      {contestants.length >= 3 && !searchQuery && (
        <section className="relative pt-2 pb-2">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Theme Podium Champions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Top Ranked Contestants
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto px-2">
            
            {/* 2nd Place */}
            {top2 && (
              <div 
                className={`order-2 md:order-1 group bg-zinc-900/80 border border-zinc-800 hover:border-slate-400/50 rounded-2xl p-5 text-center transition-all duration-300 transform hover:-translate-y-1.5 shadow-xl relative ${
                  recentlyUpdatedId === top2.id ? 'ring-2 ring-slate-400 animate-pulse' : ''
                }`}
              >
                <div className="relative inline-block mx-auto mb-4">
                  <div 
                    onClick={() => onMagnifyImage(top2.photoUrl, `@${top2.nickname}'s Contest Photo`, top2.inGameScreenshotUrl)}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md cursor-pointer group-hover:scale-105 transition"
                    title="Click to magnify"
                  >
                    <img src={top2.photoUrl} alt={top2.nickname} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-300 text-zinc-950 font-black text-sm flex items-center justify-center shadow-lg border-2 border-zinc-900">
                    2
                  </div>
                </div>

                <h3 className="font-bold text-white text-base truncate">
                  @{top2.nickname}
                </h3>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  {top2.featuredBadge || 'Contestant'}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-around">
                  <div>
                    <div className="text-xl font-extrabold text-white font-mono">{top2.votesCount}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">{t.leaderboard.votes}</div>
                  </div>
                  <div className="w-px h-8 bg-zinc-800" />
                  <div>
                    <div className="text-lg font-bold text-indigo-300 font-mono">{top2.elo}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">{t.leaderboard.eloRating}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top1 && (
              <div 
                className={`order-1 md:order-2 group bg-gradient-to-b from-amber-950/30 to-zinc-900/90 border border-amber-500/50 hover:border-amber-400 rounded-3xl p-6 text-center transition-all duration-300 transform hover:-translate-y-2 shadow-2xl relative ${
                  recentlyUpdatedId === top1.id ? 'ring-2 ring-amber-400 animate-pulse' : ''
                }`}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-zinc-950 px-3.5 py-0.5 rounded-full text-[11px] font-black uppercase shadow-lg">
                  1st Leader
                </div>

                <div className="relative inline-block mx-auto mb-4 mt-2">
                  <div 
                    onClick={() => onMagnifyImage(top1.photoUrl, `@${top1.nickname}'s Contest Photo`, top1.inGameScreenshotUrl)}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-4 border-amber-400 shadow-xl shadow-amber-500/20 cursor-pointer group-hover:scale-105 transition"
                    title="Click to magnify"
                  >
                    <img src={top1.photoUrl} alt={top1.nickname} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                      <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 font-black text-base flex items-center justify-center shadow-lg border-2 border-zinc-950">
                    1
                  </div>
                </div>

                <h3 className="font-extrabold text-white text-lg truncate">
                  @{top1.nickname}
                </h3>
                <div className="text-xs text-amber-400 font-mono mt-0.5">
                  {top1.featuredBadge || 'Rank #1'}
                </div>

                <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-around">
                  <div>
                    <div className="text-2xl font-black text-amber-400 font-mono">{top1.votesCount}</div>
                    <div className="text-[10px] text-zinc-400 uppercase">{t.leaderboard.votes}</div>
                  </div>
                  <div className="w-px h-8 bg-amber-500/20" />
                  <div>
                    <div className="text-xl font-bold text-indigo-300 font-mono">{top1.elo}</div>
                    <div className="text-[10px] text-zinc-400 uppercase">{t.leaderboard.eloRating}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div 
                className={`order-3 group bg-zinc-900/80 border border-zinc-800 hover:border-amber-700/50 rounded-2xl p-5 text-center transition-all duration-300 transform hover:-translate-y-1.5 shadow-xl relative ${
                  recentlyUpdatedId === top3.id ? 'ring-2 ring-amber-700 animate-pulse' : ''
                }`}
              >
                <div className="relative inline-block mx-auto mb-4">
                  <div 
                    onClick={() => onMagnifyImage(top3.photoUrl, `@${top3.nickname}'s Contest Photo`, top3.inGameScreenshotUrl)}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-700 shadow-md cursor-pointer group-hover:scale-105 transition"
                    title="Click to magnify"
                  >
                    <img src={top3.photoUrl} alt={top3.nickname} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-lg border-2 border-zinc-900">
                    3
                  </div>
                </div>

                <h3 className="font-bold text-white text-base truncate">
                  @{top3.nickname}
                </h3>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  {top3.featuredBadge || 'Contestant'}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-around">
                  <div>
                    <div className="text-xl font-extrabold text-white font-mono">{top3.votesCount}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">{t.leaderboard.votes}</div>
                  </div>
                  <div className="w-px h-8 bg-zinc-800" />
                  <div>
                    <div className="text-lg font-bold text-indigo-300 font-mono">{top3.elo}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">{t.leaderboard.eloRating}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* Search & Sort Controls */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by player @nickname..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl text-sm text-white placeholder-zinc-500 outline-none transition font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
          <button
            onClick={() => onSelectSort('votes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              sortOption === 'votes' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            🗳️ Most Votes
          </button>
          <button
            onClick={() => onSelectSort('elo')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              sortOption === 'elo' ? 'bg-indigo-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            ⚔️ Duel (Elo)
          </button>
          <button
            onClick={() => onSelectSort('newest')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              sortOption === 'newest' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            ⏱️ Newest
          </button>
        </div>

      </div>

      {/* Main Contest Ranking Table */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Live Contest Standings</h2>
            <span className="text-xs text-zinc-400">({contestants.length} Active Players)</span>
          </div>

          {currentUser ? (
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span>Your Remaining Votes:</span>
              <strong className="text-amber-400 font-mono">{remainingVotes} / {settings.maxVotesPerUser}</strong>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal('login')}
              className="text-xs text-amber-400 hover:underline"
            >
              Sign In to Vote
            </button>
          )}
        </div>

        {contestants.length === 0 ? (
          <div className="text-center py-20 px-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-white">No contestants have entered this theme yet.</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                Be the first gamer to submit your themed profile photo and claim the #1 rank on the leaderboard!
              </p>
            </div>
            <div className="pt-2">
              {currentUser ? (
                <button
                  type="button"
                  onClick={onOpenPhotoSubmitModal}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-amber-400/20 active:scale-95 transition cursor-pointer"
                >
                  Submit Theme Photo & Claim 1st Place 🚀
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('register')}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  Register Player & Enter Contest 🚀
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {contestants.map((c, index) => {
              const rank = index + 1;
              const isUpdated = recentlyUpdatedId === c.id;
              const isVotedByMe = currentUser?.votedContestantIds?.includes(c.id);
              const isMySelf = currentUser?.id === c.userId;

              return (
                <div
                  key={c.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-zinc-800/40 transition-colors gap-3 ${
                    isUpdated ? 'bg-amber-500/10' : ''
                  }`}
                >
                  {/* Left: Rank, Avatar with Magnifier, Nickname */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    
                    <div className="w-8 flex-shrink-0 text-center font-mono">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>

                    {/* Avatar with Magnifier trigger */}
                    <div 
                      onClick={() => onMagnifyImage(c.photoUrl, `@${c.nickname}'s Theme Photo`, c.inGameScreenshotUrl)}
                      className="relative w-16 h-16 rounded-2xl overflow-hidden border border-zinc-700 shrink-0 cursor-pointer group shadow-md"
                      title="Click to magnify with lens"
                    >
                      <img src={c.photoUrl} alt={c.nickname} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <ZoomIn className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base font-mono truncate">
                          @{c.nickname}
                        </h4>
                        {c.featuredBadge && (
                          <span className="text-[11px] font-semibold text-amber-400">
                            {c.featuredBadge}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                        <span>Theme: {c.themeTitle}</span>
                        {c.inGameScreenshotUrl && (
                          <button
                            type="button"
                            onClick={() => onMagnifyImage(c.inGameScreenshotUrl!, `@${c.nickname}'s In-Game Proof`, undefined, true)}
                            className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Proof Screenshot
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right: Votes & Direct Vote button */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-11 sm:pl-0">
                    
                    <div className="text-right">
                      <div className="text-lg font-black text-amber-400 font-mono">
                        {c.votesCount}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                        Votes
                      </div>
                    </div>

                    {/* Direct Vote Button */}
                    <div className="flex items-center gap-2">
                      {isMySelf ? (
                        <span className="text-xs text-zinc-500 italic px-2">
                          (Your photo)
                        </span>
                      ) : isVotedByMe ? (
                        <button
                          onClick={() => onVoteDirectly(c)}
                          className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-rose-500/20 text-emerald-300 hover:text-rose-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 group"
                        >
                          <Check className="w-3.5 h-3.5 group-hover:hidden" />
                          <span className="group-hover:hidden">Voted ✓</span>
                          <span className="hidden group-hover:inline">Retract</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onVoteDirectly(c)}
                          className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Vote className="w-3.5 h-3.5" />
                          <span>Vote</span>
                        </button>
                      )}

                      <button
                        onClick={() => onMagnifyImage(c.photoUrl, `@${c.nickname}'s Theme Photo`, c.inGameScreenshotUrl)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                        title="Inspect with Big Magnifier"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
