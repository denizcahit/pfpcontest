import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  ChevronRight, 
  ChevronLeft, 
  Vote, 
  CheckCircle2, 
  AlertCircle,
  LogIn,
  Clock,
  ZoomIn,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Contestant, SystemSettings, User } from '../types.ts';
import { playScoreChime } from '../utils/audio.ts';

interface RatingArenaViewProps {
  contestants: Contestant[];
  currentUser: User | null;
  settings: SystemSettings;
  targetContestant?: Contestant | null;
  onDirectVote: (contestantId: string) => Promise<void>;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenPhotoSubmitModal?: () => void;
  onMagnifyImage: (imageUrl: string, title: string, secondaryUrl?: string, isVerification?: boolean) => void;
}

export const RatingArenaView: React.FC<RatingArenaViewProps> = ({
  contestants,
  currentUser,
  settings,
  targetContestant,
  onDirectVote,
  onOpenAuthModal,
  onOpenPhotoSubmitModal,
  onMagnifyImage,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  const activeContestant = targetContestant || contestants[currentIndex] || contestants[0];

  if (!activeContestant) {
    return (
      <div className="text-center py-20 bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8 max-w-lg mx-auto space-y-4">
        <h3 className="text-xl font-bold text-white mb-1">No Contestants in this Theme Yet</h3>
        <p className="text-zinc-400 text-xs max-w-md mx-auto">
          Theme: <strong>{settings.currentTheme.title}</strong>. Be the first player to submit a theme photo to receive votes!
        </p>
        <div className="pt-2">
          {currentUser ? (
            <button
              onClick={onOpenPhotoSubmitModal}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              Submit Your Theme Photo 🚀
            </button>
          ) : (
            <button
              onClick={() => onOpenAuthModal('register')}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              Register as Player 🚀
            </button>
          )}
        </div>
      </div>
    );
  }

  const isMyProfile = currentUser?.id === activeContestant.userId;
  const isVotedByMe = currentUser?.votedContestantIds?.includes(activeContestant.id);
  const remainingVotes = currentUser
    ? Math.max(0, settings.maxVotesPerUser - (currentUser.votedContestantIds?.length || 0))
    : settings.maxVotesPerUser;

  const handleNext = () => {
    if (contestants.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % contestants.length);
    setAlertNotice(null);
  };

  const handlePrev = () => {
    if (contestants.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + contestants.length) % contestants.length);
    setAlertNotice(null);
  };

  const handleVoteClick = async () => {
    if (!currentUser) {
      onOpenAuthModal('login');
      return;
    }

    if (currentUser.status !== 'approved') {
      setAlertNotice('Your player account is waiting for in-game profile screenshot verification before you can vote.');
      return;
    }

    if (isMyProfile) {
      setAlertNotice('You cannot vote for your own profile picture.');
      return;
    }

    if (!isVotedByMe && remainingVotes <= 0) {
      setAlertNotice(`You have reached your vote limit of ${settings.maxVotesPerUser} votes. Retract a previous vote to vote for someone else.`);
      return;
    }

    setIsSubmitting(true);
    setAlertNotice(null);

    try {
      playScoreChime(10);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#fbbf24', '#f43f5e', '#6366f1', '#10b981'],
      });

      await onDirectVote(activeContestant.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAlertNotice(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Header bar */}
      <div className="flex items-center justify-between bg-zinc-900/70 border border-zinc-800 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-2">
          <Vote className="w-5 h-5 text-rose-400" />
          <h2 className="text-sm sm:text-base font-bold text-white">In-Game Theme Photo Voting</h2>
        </div>

        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="text-xs text-zinc-400 hidden sm:block">
              Votes Left: <strong className="text-amber-400 font-mono">{remainingVotes} / {settings.maxVotesPerUser}</strong>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">
              {currentIndex + 1} / {contestants.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={contestants.length <= 1}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-300 transition cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={contestants.length <= 1}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-300 transition cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {alertNotice && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{alertNotice}</span>
        </div>
      )}

      {/* Main Profile Showcase Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Photo with Magnifier trigger */}
          <div className="md:col-span-6">
            <div 
              onClick={() => onMagnifyImage(activeContestant.photoUrl, `@${activeContestant.nickname}'s Theme Photo`, activeContestant.inGameScreenshotUrl)}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 shadow-xl group cursor-pointer"
              title="Click to open full magnifier viewer"
            >
              <img
                src={activeContestant.photoUrl}
                alt={activeContestant.nickname}
                className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
              />
              <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-mono text-amber-400 border border-zinc-800">
                {activeContestant.votesCount} Direct Votes
              </div>

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <span className="bg-zinc-900/90 text-white text-xs px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1.5 shadow-lg">
                  <ZoomIn className="w-4 h-4 text-amber-400" />
                  Magnify High-Definition Details
                </span>
              </div>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-6">
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest block mb-1">
                  Contestant Entry
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
                  @{activeContestant.nickname}
                </h3>
                <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                  <span>Theme: {activeContestant.themeTitle}</span>
                </div>
              </div>

              {activeContestant.inGameScreenshotUrl && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>In-Game Verification Screenshot on File</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onMagnifyImage(activeContestant.inGameScreenshotUrl!, `@${activeContestant.nickname}'s In-Game Proof`, undefined, true)}
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    Inspect Proof
                  </button>
                </div>
              )}

              {/* Vote Statistics */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {activeContestant.votesCount}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase">Total Votes</div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-indigo-400 font-mono">
                    {activeContestant.elo}
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase">Elo Duel Score</div>
                </div>
              </div>
            </div>

            {/* Voting Controls */}
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              
              {!currentUser ? (
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-center space-y-2">
                  <p className="text-xs text-zinc-300 font-medium">Please sign in as a player to vote.</p>
                  <button
                    onClick={() => onOpenAuthModal('login')}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Player Sign In</span>
                  </button>
                </div>
              ) : currentUser.status === 'pending' ? (
                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-center space-y-1">
                  <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <strong className="text-xs text-amber-300 block">Account Pending Verification</strong>
                  <p className="text-[11px] text-zinc-400">Waiting for administrator to verify your in-game profile screenshot.</p>
                </div>
              ) : isMyProfile ? (
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500">
                  You cannot vote for your own profile picture.
                </div>
              ) : isVotedByMe ? (
                <div className="space-y-2">
                  <div className="w-full py-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>You Voted for @{activeContestant.nickname} ✓</span>
                  </div>
                  <button
                    onClick={handleVoteClick}
                    disabled={isSubmitting}
                    className="w-full text-center text-xs text-zinc-500 hover:text-rose-400 cursor-pointer transition"
                  >
                    Retract Vote
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleVoteClick}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 text-zinc-950 font-extrabold rounded-2xl text-base shadow-lg shadow-amber-400/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Vote className="w-5 h-5 text-zinc-950" />
                  <span>{isSubmitting ? 'Recording...' : `Vote for @${activeContestant.nickname}`}</span>
                </button>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                <button
                  onClick={handleNext}
                  className="hover:text-zinc-300 cursor-pointer flex items-center gap-1"
                >
                  Next Profile →
                </button>
                <button
                  type="button"
                  onClick={() => onMagnifyImage(activeContestant.photoUrl, `@${activeContestant.nickname}'s Theme Photo`, activeContestant.inGameScreenshotUrl)}
                  className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  Inspect Photo
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
