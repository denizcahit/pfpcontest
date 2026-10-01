import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Clock, 
  Sliders, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Save, 
  Sparkles,
  Calendar,
  Image as ImageIcon,
  ZoomIn,
  Camera,
  RefreshCw,
  Plus
} from 'lucide-react';
import { ContestTheme, Contestant, SystemSettings, User } from '../types.ts';
import { 
  fetchAdminData, 
  approveUserAccount, 
  rejectUserAccount, 
  approveContestPhoto, 
  rejectContestPhoto, 
  deleteUserAccount, 
  deleteContestant,
  clearAllContestants,
  updateSystemSettings 
} from '../services/api.ts';
import { THEME_PRESETS } from '../data/seedContestants.ts';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onSettingsUpdated: (newSettings: SystemSettings) => void;
  onContestantsUpdated: () => void;
  onMagnifyImage: (imageUrl: string, title: string, secondaryUrl?: string, isVerification?: boolean) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
  onContestantsUpdated,
  onMagnifyImage,
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'photos' | 'accounts' | 'directory' | 'settings'>('theme');
  const [users, setUsers] = useState<User[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [pendingAccounts, setPendingAccounts] = useState<User[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<Contestant[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingAccountsCount: 0,
    pendingPhotosCount: 0,
    activeContestants: 0,
    totalVotesCast: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Theme Form State
  const [themeTitle, setThemeTitle] = useState(settings.currentTheme.title);
  const [themeDesc, setThemeDesc] = useState(settings.currentTheme.description);
  const [startDate, setStartDate] = useState(settings.currentTheme.startDate.substring(0, 10));
  const [endDate, setEndDate] = useState(settings.currentTheme.endDate.substring(0, 10));
  const [examplePhotos, setExamplePhotos] = useState<string[]>(settings.currentTheme.examplePhotoUrls || []);
  const [newExampleInput, setNewExampleInput] = useState('');

  // Settings State
  const [maxVotesInput, setMaxVotesInput] = useState(settings.maxVotesPerUser);
  const [requireAccountApproval, setRequireAccountApproval] = useState(settings.requireAccountApproval);
  const [requirePhotoApproval, setRequirePhotoApproval] = useState(settings.requirePhotoApproval);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminData();
      setUsers(data.users);
      setContestants(data.contestants);
      setPendingAccounts(data.pendingAccounts);
      setPendingPhotos(data.pendingPhotos);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setThemeTitle(settings.currentTheme.title);
      setThemeDesc(settings.currentTheme.description);
      setStartDate(settings.currentTheme.startDate.substring(0, 10));
      setEndDate(settings.currentTheme.endDate.substring(0, 10));
      setExamplePhotos(settings.currentTheme.examplePhotoUrls || []);
      setMaxVotesInput(settings.maxVotesPerUser);
      setRequireAccountApproval(settings.requireAccountApproval);
      setRequirePhotoApproval(settings.requirePhotoApproval);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleApproveAccount = async (userId: string) => {
    try {
      await approveUserAccount(userId);
      setNotice('Player account verified!');
      setTimeout(() => setNotice(null), 3000);
      await loadData();
      onContestantsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectAccount = async (userId: string) => {
    try {
      await rejectUserAccount(userId);
      setNotice('Player account rejected.');
      setTimeout(() => setNotice(null), 3000);
      await loadData();
      onContestantsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovePhoto = async (photoId: string) => {
    try {
      await approveContestPhoto(photoId);
      setNotice('Photo approved and published to leaderboard!');
      setTimeout(() => setNotice(null), 3000);
      await loadData();
      onContestantsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectPhoto = async (photoId: string) => {
    try {
      await rejectContestPhoto(photoId);
      setNotice('Photo rejected.');
      setTimeout(() => setNotice(null), 3000);
      await loadData();
      onContestantsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserAccount(userId);
      setNotice('User profile was removed.');
      setTimeout(() => setNotice(null), 3000);
      await loadData();
      onContestantsUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExamplePhoto = () => {
    if (!newExampleInput.trim()) return;
    setExamplePhotos([...examplePhotos, newExampleInput.trim()]);
    setNewExampleInput('');
  };

  const handleRemoveExamplePhoto = (idx: number) => {
    setExamplePhotos(examplePhotos.filter((_, i) => i !== idx));
  };

  const applyThemePreset = (preset: ContestTheme) => {
    setThemeTitle(preset.title);
    setThemeDesc(preset.description);
    setStartDate(preset.startDate.substring(0, 10));
    setEndDate(preset.endDate.substring(0, 10));
    setExamplePhotos(preset.examplePhotoUrls || []);
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedTheme: ContestTheme = {
        ...settings.currentTheme,
        title: themeTitle.trim(),
        description: themeDesc.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        examplePhotoUrls: examplePhotos,
      };

      const updated = await updateSystemSettings({
        currentTheme: updatedTheme,
      });

      onSettingsUpdated(updated);
      setNotice('Contest theme successfully saved & broadcasted!');
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateSystemSettings({
        maxVotesPerUser: Number(maxVotesInput),
        requireAccountApproval,
        requirePhotoApproval,
      });

      onSettingsUpdated(updated);
      setNotice('Settings saved successfully!');
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContestant = async (contestantId: string) => {
    try {
      await deleteContestant(contestantId);
      setNotice('Contestant entry successfully removed.');
      loadData();
      onContestantsUpdated();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) setNotice(err.message);
    }
  };

  const handleClearAllContestants = async () => {
    try {
      await clearAllContestants();
      setNotice('All contestant profiles and votes have been purged!');
      loadData();
      onContestantsUpdated();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) setNotice(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Guild Administrator Control Panel</h2>
              <p className="text-xs text-zinc-400">Manage in-game contest themes, photo reviews, and verification proofs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refresh"
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {notice && (
          <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300">
            {notice}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3">
            <div className="text-xl font-black text-white">{stats.totalUsers}</div>
            <div className="text-[10px] text-zinc-400 uppercase">Registered Players</div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3">
            <div className="text-xl font-black text-amber-400 flex items-center gap-1.5">
              <span>{stats.pendingAccountsCount}</span>
              {stats.pendingAccountsCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase">Pending In-Game Proofs</div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3">
            <div className="text-xl font-black text-rose-400 flex items-center gap-1.5">
              <span>{stats.pendingPhotosCount}</span>
              {stats.pendingPhotosCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase">Pending Theme Photos</div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3">
            <div className="text-xl font-black text-indigo-400">{stats.activeContestants}</div>
            <div className="text-[10px] text-zinc-400 uppercase">Live Contestants</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'theme' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Contest Theme & Dates</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'photos' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Theme Photos Review</span>
            {pendingPhotos.length > 0 && (
              <span className="px-1.5 py-0.2 bg-zinc-950 text-rose-400 rounded-full text-[10px]">
                {pendingPhotos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'accounts' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>In-Game Proof Approvals</span>
            {pendingAccounts.length > 0 && (
              <span className="px-1.5 py-0.2 bg-zinc-950 text-amber-300 rounded-full text-[10px]">
                {pendingAccounts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'directory' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contestants & Players</span>
            {contestants.length > 0 && (
              <span className="px-1.5 py-0.2 bg-zinc-950 text-indigo-300 rounded-full text-[10px]">
                {contestants.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Voting Quota & Approval Toggles</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
          
          {/* TAB 1: THEME CONFIGURATION */}
          {activeTab === 'theme' && (
            <form onSubmit={handleSaveTheme} className="space-y-5 bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800">
              
              {/* Preset buttons (if any configured) */}
              {THEME_PRESETS.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1.5">
                    Quick Theme Presets:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {THEME_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyThemePreset(p)}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-400 rounded-xl text-xs text-white transition cursor-pointer"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Active Theme Title *
                </label>
                <input
                  type="text"
                  value={themeTitle}
                  onChange={(e) => setThemeTitle(e.target.value)}
                  placeholder="e.g. Tim Burton / Dark Fantasy & Gothic Aesthetic"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:border-amber-400 outline-none font-bold"
                />
              </div>

              {/* Description & Rules for Players */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Theme Guidelines / Explanations for Players *
                </label>
                <textarea
                  rows={3}
                  value={themeDesc}
                  onChange={(e) => setThemeDesc(e.target.value)}
                  placeholder="Explain the aesthetic, mood, and criteria for this theme..."
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Contest Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-400" />
                    Contest End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Example Inspiration Photos */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="text-xs font-bold text-zinc-300 block">
                  Example Photos for Theme Inspiration (Players can click to magnify)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {examplePhotos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-700 group">
                      <img src={url} alt={`Example ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExamplePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Remove Example"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://... example photo URL"
                    value={newExampleInput}
                    onChange={(e) => setNewExampleInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddExamplePhoto}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Photo
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save & Publish Theme
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: PENDING THEME PHOTOS REVIEW */}
          {activeTab === 'photos' && (
            <div className="space-y-3">
              {pendingPhotos.length === 0 ? (
                <div className="text-center py-12 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">No pending theme photos</h4>
                  <p className="text-xs text-zinc-500 mt-1">All submitted contestant photos have been reviewed.</p>
                </div>
              ) : (
                pendingPhotos.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950 border border-zinc-800 hover:border-amber-400/50 rounded-2xl gap-4 transition"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Big photo thumbnail with Magnifier click */}
                      <div 
                        onClick={() => onMagnifyImage(c.photoUrl, `@${c.nickname}'s Theme Photo`, c.inGameScreenshotUrl)}
                        className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/60 shrink-0 cursor-pointer group shadow-lg"
                        title="Click to open big magnifier"
                      >
                        <img src={c.photoUrl} alt={c.nickname} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">@{c.nickname}</h4>
                          <span className="text-[11px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                            Pending Review
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">Theme: {c.themeTitle}</p>

                        <button
                          type="button"
                          onClick={() => onMagnifyImage(c.photoUrl, `@${c.nickname}'s Theme Photo`, c.inGameScreenshotUrl)}
                          className="mt-2 text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          Inspect Photo with Magnifier
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleRejectPhoto(c.id)}
                        className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>

                      <button
                        onClick={() => handleApprovePhoto(c.id)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve Photo
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: IN-GAME SCREENSHOT PROOF APPROVALS */}
          {activeTab === 'accounts' && (
            <div className="space-y-3">
              {pendingAccounts.length === 0 ? (
                <div className="text-center py-12 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">No pending in-game proof verifications</h4>
                  <p className="text-xs text-zinc-500 mt-1">All player in-game screenshots have been examined.</p>
                </div>
              ) : (
                pendingAccounts.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950 border border-zinc-800 hover:border-amber-400/50 rounded-2xl gap-4 transition"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Big in-game screenshot thumbnail with magnifier */}
                      <div
                        onClick={() => onMagnifyImage(u.inGameScreenshotUrl, `@${u.nickname}'s In-Game Proof`, undefined, true)}
                        className="relative w-28 h-16 rounded-xl overflow-hidden border-2 border-indigo-400/60 shrink-0 cursor-pointer group shadow-lg bg-black"
                        title="Click to magnify screenshot"
                      >
                        <img src={u.inGameScreenshotUrl} alt={u.nickname} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">@{u.nickname}</h4>
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-lg uppercase font-bold">
                            In-Game Proof
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Registered: {new Date(u.createdAt).toLocaleDateString()}
                        </p>

                        <button
                          type="button"
                          onClick={() => onMagnifyImage(u.inGameScreenshotUrl, `@${u.nickname}'s In-Game Proof`, undefined, true)}
                          className="mt-1.5 text-xs text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          Magnify In-Game Profile Screenshot
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleRejectAccount(u.id)}
                        className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => handleApproveAccount(u.id)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verify Player
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: CONTESTANTS & PLAYERS DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-6">
              {/* Contestants Sub-Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Active Theme Contestants ({contestants.length})</span>
                  </h3>
                  {contestants.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllContestants}
                      className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All Contestants
                    </button>
                  )}
                </div>

                {contestants.length === 0 ? (
                  <div className="text-center py-8 bg-zinc-950/40 rounded-2xl border border-zinc-800 text-xs text-zinc-500">
                    No contestants entered yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contestants.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={c.photoUrl}
                            alt={c.nickname}
                            className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0 cursor-pointer"
                            onClick={() => onMagnifyImage(c.photoUrl, `@${c.nickname}'s Photo`)}
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-xs font-mono truncate">@{c.nickname}</h4>
                            <p className="text-[11px] text-zinc-400">
                              Votes: <strong className="text-amber-400">{c.votesCount}</strong> · Elo: {c.elo}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteContestant(c.id)}
                          className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          title="Delete Contestant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Players Sub-Section */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Registered In-Game Players ({users.length})</span>
                </h3>

                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {u.inGameScreenshotUrl ? (
                          <img
                            src={u.inGameScreenshotUrl}
                            alt={u.nickname}
                            className="w-12 h-8 rounded-lg object-cover border border-indigo-500/40 shrink-0 cursor-pointer bg-black"
                            onClick={() => onMagnifyImage(u.inGameScreenshotUrl, `@${u.nickname}'s Proof`, undefined, true)}
                          />
                        ) : (
                          <div className="w-12 h-8 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                            N/A
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-white text-xs font-mono truncate">@{u.nickname}</h4>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              u.role === 'admin'
                                ? 'bg-amber-400 text-zinc-950'
                                : u.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : u.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {u.role === 'admin' ? 'ADMIN' : u.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500">
                            Voted: {u.votedContestantIds?.length || 0} times
                          </p>
                        </div>
                      </div>

                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          title="Delete Player"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS (Photo Approval Toggle, Account Approval Toggle, Quota) */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveGeneralSettings} className="space-y-5 bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800">
              
              {/* Max votes per member */}
              <div>
                <label className="text-sm font-bold text-white block mb-1">
                  Maximum Votes Per Player Quota
                </label>
                <p className="text-xs text-zinc-400 mb-2">
                  Sets how many distinct profile photos a verified player can vote for.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={maxVotesInput}
                    onChange={(e) => setMaxVotesInput(parseInt(e.target.value) || 1)}
                    className="w-24 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-base font-mono text-white text-center outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-zinc-400">votes per player (e.g. 3, 5, 10)</span>
                </div>
              </div>

              {/* Photo Approval Toggle */}
              <div className="pt-3 border-t border-zinc-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requirePhotoApproval}
                    onChange={(e) => setRequirePhotoApproval(e.target.checked)}
                    className="w-5 h-5 rounded bg-zinc-900 border-zinc-700 text-amber-400 focus:ring-0 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Require Administrator Approval for Theme Photos (Fotoğraflar İçin Onay Gerekir)
                    </span>
                    <span className="text-xs text-zinc-400">
                      When enabled, player photo submissions go to the "Theme Photos Review" tab and require admin approval before appearing on the public leaderboard.
                    </span>
                  </div>
                </label>
              </div>

              {/* In-game proof approval toggle */}
              <div className="pt-3 border-t border-zinc-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireAccountApproval}
                    onChange={(e) => setRequireAccountApproval(e.target.checked)}
                    className="w-5 h-5 rounded bg-zinc-900 border-zinc-700 text-amber-400 focus:ring-0 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">
                      Require Admin Verification for In-Game Screenshot Registration
                    </span>
                    <span className="text-xs text-zinc-400">
                      When enabled, players cannot vote until their in-game profile screenshot is approved by an administrator.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save System Settings
                </button>
              </div>

              {/* Danger Zone: Purge all demo/mockup/contest data */}
              <div className="pt-6 border-t border-rose-500/30">
                <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-rose-300">Wipe Contest Data & Reset Entries</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Clears all entered contestant photos and resets all user votes to 0. (Admin account remains active).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAllContestants}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Wipe All Data
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
