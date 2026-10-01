import React, { useState, useRef, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Swords, 
  PlusCircle, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Globe, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  LogOut, 
  LogIn, 
  Settings,
  Vote
} from 'lucide-react';
import { User, SystemSettings } from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';
import { isSoundEnabled, toggleSound } from '../utils/audio.ts';

interface NavbarProps {
  activeTab: 'leaderboard' | 'rate' | 'duel';
  setActiveTab: (tab: 'leaderboard' | 'rate' | 'duel') => void;
  currentUser: User | null;
  settings: SystemSettings;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenAdminModal: () => void;
  onOpenRulesModal: () => void;
  onLogout: () => void;
  contestantCount: number;
  totalVotesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  settings,
  onOpenAuthModal,
  onOpenAdminModal,
  onOpenRulesModal,
  onLogout,
  contestantCount,
  totalVotesCount,
}) => {
  const { language, setLanguage, t, options } = useLanguage();
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangOption = options.find((o) => o.code === language) || options[0];

  const remainingVotes = currentUser
    ? Math.max(0, settings.maxVotesPerUser - (currentUser.votedContestantIds?.length || 0))
    : settings.maxVotesPerUser;

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Brand Logo & Live Signal */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-sans">
                  {t.appName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 tracking-wide uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  {t.liveArena}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
                <span>{contestantCount} {t.contestantsCount}</span>
                <span aria-hidden="true">·</span>
                <span>{totalVotesCount} {t.totalVotesCount}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Segmented Control) */}
          <nav className="flex items-center p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-zinc-800 text-white shadow-sm shadow-zinc-950/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Trophy className={`w-4 h-4 ${activeTab === 'leaderboard' ? 'text-amber-400' : ''}`} />
              <span>{t.nav.leaderboard}</span>
            </button>

            <button
              onClick={() => setActiveTab('rate')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'rate'
                  ? 'bg-zinc-800 text-white shadow-sm shadow-zinc-950/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Vote className={`w-4 h-4 ${activeTab === 'rate' ? 'text-rose-400' : ''}`} />
              <span>{t.nav.voteArena}</span>
            </button>

            <button
              onClick={() => setActiveTab('duel')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'duel'
                  ? 'bg-zinc-800 text-white shadow-sm shadow-zinc-950/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Swords className={`w-4 h-4 ${activeTab === 'duel' ? 'text-indigo-400' : ''}`} />
              <span>{t.nav.duel}</span>
            </button>
          </nav>

          {/* Right Area: Language Switcher, User Status, Admin, Login/Register */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Multi-language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs text-zinc-300 hover:text-white transition cursor-pointer"
                title="Change Language"
              >
                <span>{currentLangOption.flag}</span>
                <span className="hidden md:inline font-medium">{currentLangOption.code.toUpperCase()}</span>
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-1 z-50 overflow-hidden">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800">
                    Languages (Diller)
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {options.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => {
                          setLanguage(opt.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs transition cursor-pointer ${
                          language === opt.code
                            ? 'bg-amber-400/10 text-amber-400 font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{opt.flag}</span>
                          <span>{opt.label}</span>
                        </span>
                        {language === opt.code && <span className="text-amber-400">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              title={soundOn ? 'Mute' : 'Unmute'}
              className="p-2 sm:p-2.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition cursor-pointer"
              aria-label="Sound"
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
            </button>

            {/* User Session Badges & Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                
                {/* Remaining Votes Quota Badge */}
                {currentUser.status === 'approved' && (
                  <div 
                    title={`${t.remainingVotes}: ${remainingVotes} / ${settings.maxVotesPerUser}`}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold"
                  >
                    <span className="text-zinc-400">{t.remainingVotes}:</span>
                    <span className={`font-mono ${remainingVotes > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {remainingVotes} / {settings.maxVotesPerUser}
                    </span>
                  </div>
                )}

                {/* Status Badges */}
                {currentUser.role === 'admin' ? (
                  <button
                    onClick={onOpenAdminModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t.nav.adminPanel}</span>
                  </button>
                ) : currentUser.status === 'pending' ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.nav.pendingApprovalBadge}</span>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-zinc-200">@{currentUser.nickname}</span>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title={t.nav.logout}
                  className="p-2 text-zinc-400 hover:text-rose-400 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition cursor-pointer"
                >
                  {t.nav.login}
                </button>

                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-zinc-950" />
                  <span>{t.nav.joinContest}</span>
                </button>
              </div>
            )}

            {/* Rules button */}
            <button
              onClick={onOpenRulesModal}
              title={t.nav.rules}
              className="hidden lg:flex p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
