import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { RatingArenaView } from './components/RatingArenaView.tsx';
import { DuelArenaView } from './components/DuelArenaView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { PhotoSubmitModal } from './components/PhotoSubmitModal.tsx';
import { AdminPanelModal } from './components/AdminPanelModal.tsx';
import { ContestRulesModal } from './components/ContestRulesModal.tsx';
import { ImageMagnifierModal } from './components/ImageMagnifierModal.tsx';
import { Contestant, LiveEventPayload, SortOption, SystemSettings, User } from './types.ts';
import { DEFAULT_SETTINGS } from './data/seedContestants.ts';
import { 
  fetchContestants, 
  fetchSettings, 
  checkCurrentUser, 
  castDirectVote, 
  submitContestantDuel, 
  subscribeToLiveEvents,
  setStoredUser
} from './services/api.ts';

function AppContent() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rate' | 'duel'>('leaderboard');
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [sortOption, setSortOption] = useState<SortOption>('votes');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isPhotoSubmitModalOpen, setIsPhotoSubmitModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  // Big Image Magnifier Modal state
  const [magnifierData, setMagnifierData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    secondaryUrl?: string;
    isVerification?: boolean;
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
  });

  // Live real-time update notifications
  const [liveTicker, setLiveTicker] = useState<{ message: string; id: string; isError?: boolean } | null>(null);
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);

  // Load contestants
  const loadContestantsData = useCallback(async () => {
    try {
      const data = await fetchContestants(sortOption, searchQuery);
      setContestants(data.contestants);
    } catch (err) {
      console.error('Failed to load contestants:', err);
    }
  }, [sortOption, searchQuery]);

  // Load initial settings and user
  useEffect(() => {
    fetchSettings().then(setSettings);
    checkCurrentUser().then(setCurrentUser);
  }, []);

  useEffect(() => {
    loadContestantsData();
  }, [loadContestantsData]);

  // Subscribe to real-time events via Server-Sent Events (SSE)
  useEffect(() => {
    const unsubscribe = subscribeToLiveEvents((event: LiveEventPayload) => {
      setLiveTicker({
        message: event.message,
        id: event.timestamp + Math.random(),
      });

      if (event.contestantId) {
        setRecentlyUpdatedId(event.contestantId);
        setTimeout(() => setRecentlyUpdatedId(null), 3000);
      }

      if (event.type === 'THEME_UPDATED') {
        fetchSettings().then(setSettings);
      }

      loadContestantsData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadContestantsData]);

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    setStoredUser(null);
    setCurrentUser(null);
  };

  const handleDirectVote = async (contestantId: string) => {
    if (!currentUser) {
      handleOpenAuthModal('login');
      return;
    }

    try {
      const result = await castDirectVote(contestantId);
      setCurrentUser(result.user);
      await loadContestantsData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLiveTicker({
          message: err.message,
          id: Date.now() + Math.random().toString(),
          isError: true,
        });
        setTimeout(() => setLiveTicker(null), 4000);
      }
    }
  };

  const handleDuelDecided = async (winnerId: string, loserId: string) => {
    const result = await submitContestantDuel(winnerId, loserId);
    await loadContestantsData();
    return result;
  };

  const handleMagnifyImage = (
    imageUrl: string,
    title: string,
    secondaryUrl?: string,
    isVerification?: boolean
  ) => {
    setMagnifierData({
      isOpen: true,
      imageUrl,
      title,
      secondaryUrl,
      isVerification,
    });
  };

  const totalVotesCount = contestants.reduce((sum, c) => sum + (c.votesCount || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950">
      
      {/* Live notification ticker toast */}
      {liveTicker && (
        <div className={`border-b px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
          liveTicker.isError
            ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
            : 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border-amber-500/30 text-amber-300'
        }`}>
          <span className={`w-2 h-2 rounded-full ${liveTicker.isError ? 'bg-rose-400' : 'bg-amber-400 animate-ping'}`} />
          <span>{liveTicker.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        settings={settings}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onLogout={handleLogout}
        contestantCount={contestants.length}
        totalVotesCount={totalVotesCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            contestants={contestants}
            currentUser={currentUser}
            settings={settings}
            sortOption={sortOption}
            onSelectSort={setSortOption}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectContestant={(c) => {
              handleMagnifyImage(c.photoUrl, `@${c.nickname}'s Theme Photo`, c.inGameScreenshotUrl);
            }}
            onVoteDirectly={(c) => handleDirectVote(c.id)}
            onOpenAuthModal={handleOpenAuthModal}
            onOpenPhotoSubmitModal={() => setIsPhotoSubmitModalOpen(true)}
            onMagnifyImage={handleMagnifyImage}
            recentlyUpdatedId={recentlyUpdatedId}
          />
        )}

        {activeTab === 'rate' && (
          <RatingArenaView
            contestants={contestants}
            currentUser={currentUser}
            settings={settings}
            onDirectVote={handleDirectVote}
            onOpenAuthModal={handleOpenAuthModal}
            onOpenPhotoSubmitModal={() => setIsPhotoSubmitModalOpen(true)}
            onMagnifyImage={handleMagnifyImage}
          />
        )}

        {activeTab === 'duel' && (
          <DuelArenaView
            contestants={contestants}
            currentUser={currentUser}
            onDuelDecided={handleDuelDecided}
            onOpenAuthModal={handleOpenAuthModal}
            onOpenPhotoSubmitModal={() => setIsPhotoSubmitModalOpen(true)}
            onMagnifyImage={handleMagnifyImage}
          />
        )}

      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          loadContestantsData();
        }}
      />

      <PhotoSubmitModal
        isOpen={isPhotoSubmitModalOpen}
        onClose={() => setIsPhotoSubmitModalOpen(false)}
        currentUser={currentUser}
        settings={settings}
        onSuccess={loadContestantsData}
      />

      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        settings={settings}
        onSettingsUpdated={(updated) => setSettings(updated)}
        onContestantsUpdated={loadContestantsData}
        onMagnifyImage={handleMagnifyImage}
      />

      <ContestRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Big Interactive Image Magnifier Modal */}
      <ImageMagnifierModal
        isOpen={magnifierData.isOpen}
        onClose={() => setMagnifierData((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={magnifierData.imageUrl}
        secondaryImageUrl={magnifierData.secondaryUrl}
        title={magnifierData.title}
        isVerification={magnifierData.isVerification}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 py-6 text-center text-xs text-zinc-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">In-Game Contest Arena</span>
            <span aria-hidden="true">·</span>
            <span>Current Theme: {settings.currentTheme.title}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="hover:text-zinc-300 cursor-pointer"
            >
              Contest Rules
            </button>
            <span aria-hidden="true">·</span>
            {currentUser ? (
              <button
                onClick={() => setIsPhotoSubmitModalOpen(true)}
                className="text-amber-400 hover:text-amber-300 cursor-pointer font-semibold"
              >
                Submit Theme Photo
              </button>
            ) : (
              <button
                onClick={() => handleOpenAuthModal('register')}
                className="text-amber-400 hover:text-amber-300 cursor-pointer font-semibold"
              >
                Register as Player
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
