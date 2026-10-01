import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Swords, RefreshCw, ZoomIn, ShieldCheck } from 'lucide-react';
import { Contestant, User } from '../types.ts';
import { playDuelWhoosh } from '../utils/audio.ts';

interface DuelArenaViewProps {
  contestants: Contestant[];
  currentUser?: User | null;
  onDuelDecided: (winnerId: string, loserId: string) => Promise<{ winner: Contestant; loser: Contestant } | void>;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenPhotoSubmitModal?: () => void;
  onMagnifyImage: (imageUrl: string, title: string, secondaryUrl?: string, isVerification?: boolean) => void;
}

export const DuelArenaView: React.FC<DuelArenaViewProps> = ({
  contestants,
  currentUser,
  onDuelDecided,
  onOpenAuthModal,
  onOpenPhotoSubmitModal,
  onMagnifyImage,
}) => {
  const [leftIndex, setLeftIndex] = useState<number>(0);
  const [rightIndex, setRightIndex] = useState<number>(1);
  const [totalDuelsVoted, setTotalDuelsVoted] = useState<number>(0);
  const [lastWinnerId, setLastWinnerId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [eloGainNotice, setEloGainNotice] = useState<string | null>(null);

  const pickNewPair = () => {
    if (contestants.length < 2) return;
    const idx1 = Math.floor(Math.random() * contestants.length);
    let idx2 = Math.floor(Math.random() * contestants.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * contestants.length);
    }
    setLeftIndex(idx1);
    setRightIndex(idx2);
    setLastWinnerId(null);
    setEloGainNotice(null);
  };

  useEffect(() => {
    if (contestants.length >= 2 && leftIndex === rightIndex) {
      pickNewPair();
    }
  }, [contestants.length]);

  const leftContestant = contestants[leftIndex] || contestants[0];
  const rightContestant = contestants[rightIndex] || contestants[1];

  if (!leftContestant || !rightContestant || contestants.length < 2) {
    return (
      <div className="text-center py-20 bg-zinc-900/60 rounded-3xl border border-zinc-800 p-8 max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mx-auto text-indigo-400">
          <Swords className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">1v1 Duels Locked</h3>
          <p className="text-zinc-400 text-xs max-w-sm mx-auto">
            At least 2 approved player photos are required to start head-to-head duels. Submit a photo to help unlock the arena!
          </p>
        </div>
        <div className="pt-2">
          {currentUser ? (
            <button
              onClick={onOpenPhotoSubmitModal}
              className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              Submit Your Photo 🚀
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

  const handlePickWinner = async (winner: Contestant, loser: Contestant) => {
    if (!currentUser) {
      onOpenAuthModal('login');
      return;
    }

    if (currentUser.status !== 'approved') {
      setEloGainNotice('Your player account is pending in-game screenshot verification before you can vote in duels.');
      setTimeout(() => setEloGainNotice(null), 4000);
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      playDuelWhoosh();
      setLastWinnerId(winner.id);

      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#fbbf24', '#f43f5e'],
      });

      setEloGainNotice(`@${winner.nickname} won the duel! (+16 Elo)`);
      setTotalDuelsVoted((prev) => prev + 1);

      await onDuelDecided(winner.id, loser.id);

      setTimeout(() => {
        pickNewPair();
        setIsProcessing(false);
      }, 900);

    } catch (err) {
      console.error('Duel vote error:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
          <Swords className="w-4 h-4 text-indigo-400" />
          <span>1v1 Theme Photo Duel</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Which Theme Profile Photo Is Better?
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Choose which player captured the theme aesthetic best. Win results raise Elo league points.
        </p>

        <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 pt-1">
          <span>Duels Voted: <strong className="text-white font-mono">{totalDuelsVoted}</strong></span>
          <span aria-hidden="true">·</span>
          <button
            onClick={pickNewPair}
            className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Next Matchup
          </button>
        </div>
      </div>

      {eloGainNotice && (
        <div className="max-w-md mx-auto py-2 px-4 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-center text-xs font-bold text-indigo-300 animate-bounce">
          {eloGainNotice}
        </div>
      )}

      {/* Duel Cards */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center mt-6">
        
        {/* Left Contestant */}
        <div
          className={`group bg-zinc-900/80 border-2 rounded-3xl p-5 sm:p-6 transition-all duration-300 transform hover:-translate-y-1.5 shadow-2xl relative overflow-hidden ${
            lastWinnerId === leftContestant.id
              ? 'border-indigo-400 bg-indigo-950/40 ring-4 ring-indigo-400/50'
              : 'border-zinc-800 hover:border-indigo-500/80'
          }`}
        >
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-950 mb-4 border border-zinc-800">
            <img
              src={leftContestant.photoUrl}
              alt={leftContestant.nickname}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-mono text-indigo-300 border border-zinc-800">
              {leftContestant.elo} Elo
            </div>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMagnifyImage(leftContestant.photoUrl, `@${leftContestant.nickname}'s Theme Photo`, leftContestant.inGameScreenshotUrl);
              }}
              className="absolute top-3 right-3 p-2 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700 text-white rounded-xl transition cursor-pointer"
              title="Magnify Photo"
            >
              <ZoomIn className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-mono">
                @{leftContestant.nickname}
              </h3>
              <div className="text-xs text-zinc-400">{leftContestant.themeTitle}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-amber-400 font-mono">
                {leftContestant.votesCount} Votes
              </div>
              <div className="text-[11px] text-zinc-500">{leftContestant.duelWins}W / {leftContestant.duelLosses}L</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handlePickWinner(leftContestant, rightContestant)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
          >
            Select @{leftContestant.nickname} as Winner ⚔️
          </button>
        </div>

        {/* Center VS Badge */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-500 p-0.5 items-center justify-center shadow-2xl">
          <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
            <span className="text-sm font-black text-white tracking-widest">VS</span>
          </div>
        </div>

        {/* Right Contestant */}
        <div
          className={`group bg-zinc-900/80 border-2 rounded-3xl p-5 sm:p-6 transition-all duration-300 transform hover:-translate-y-1.5 shadow-2xl relative overflow-hidden ${
            lastWinnerId === rightContestant.id
              ? 'border-rose-400 bg-rose-950/40 ring-4 ring-rose-400/50'
              : 'border-zinc-800 hover:border-rose-500/80'
          }`}
        >
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-950 mb-4 border border-zinc-800">
            <img
              src={rightContestant.photoUrl}
              alt={rightContestant.nickname}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-mono text-rose-300 border border-zinc-800">
              {rightContestant.elo} Elo
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMagnifyImage(rightContestant.photoUrl, `@${rightContestant.nickname}'s Theme Photo`, rightContestant.inGameScreenshotUrl);
              }}
              className="absolute top-3 right-3 p-2 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700 text-white rounded-xl transition cursor-pointer"
              title="Magnify Photo"
            >
              <ZoomIn className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-mono">
                @{rightContestant.nickname}
              </h3>
              <div className="text-xs text-zinc-400">{rightContestant.themeTitle}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-amber-400 font-mono">
                {rightContestant.votesCount} Votes
              </div>
              <div className="text-[11px] text-zinc-500">{rightContestant.duelWins}W / {rightContestant.duelLosses}L</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handlePickWinner(rightContestant, leftContestant)}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
          >
            Select @{rightContestant.nickname} as Winner ⚔️
          </button>
        </div>

      </div>

    </div>
  );
};
