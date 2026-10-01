import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Gamepad2, 
  ShieldCheck, 
  Check, 
  LogIn, 
  UserPlus, 
  Clock,
  Link as LinkIcon
} from 'lucide-react';
import { User } from '../types.ts';
import { loginPlayer, registerPlayer } from '../services/api.ts';
import { playFanfare } from '../utils/audio.ts';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login fields
  const [loginNickname, setLoginNickname] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [inGameScreenshotUrl, setInGameScreenshotUrl] = useState('');
  const [screenshotTab, setScreenshotTab] = useState<'upload' | 'url'>('upload');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image screenshot file (PNG, JPG, WebP).');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setInGameScreenshotUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const user = await loginPlayer(loginNickname.trim(), loginPassword);
      onSuccess(user);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inGameScreenshotUrl) {
      setErrorMessage('Please upload a screenshot of your in-game profile for account verification.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerPlayer({
        nickname: nickname.trim(),
        password: password || 'password123',
        inGameScreenshotUrl,
      });

      playFanfare();

      if (result.status === 'pending') {
        setPendingNotice('Registration received! Your in-game screenshot has been submitted for administrator verification. Once verified, you can vote and enter the contest!');
        onSuccess(result.user);
      } else {
        onSuccess(result.user);
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl mb-6 max-w-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setPendingNotice(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              mode === 'login' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Player Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setPendingNotice(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              mode === 'register' ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            New Player Registration
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {pendingNotice ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Verification Screenshot Submitted</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              {pendingNotice}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Continue to Arena
            </button>
          </div>
        ) : mode === 'login' ? (
          /* LOGIN */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-amber-400" />
                <span>Player Login</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your in-game nickname and password. No emails or personal information required.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                In-Game Nickname *
              </label>
              <input
                type="text"
                placeholder="e.g. YourNickname"
                value={loginNickname}
                onChange={(e) => setLoginNickname(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl text-sm text-white placeholder-zinc-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Password *
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl text-sm text-white placeholder-zinc-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoading ? 'Signing In...' : 'Enter Contest Arena'}
            </button>
          </form>
        ) : (
          /* GAMER REGISTRATION */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-amber-400" />
                <span>Player Registration</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Choose your in-game nickname and upload your in-game profile screenshot for verification.
              </p>
            </div>

            {/* In-Game Proof Policy Notice */}
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs text-indigo-300 block">In-Game Identity Verification</strong>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  To protect your privacy, real-world personal information is never asked. To prevent bot and fake accounts, please provide a screenshot of your in-game character profile.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  In-Game Nickname *
                </label>
                <input
                  type="text"
                  placeholder="e.g. PhoenixHunter"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  required
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* In-Game Profile Verification Screenshot Upload */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  In-Game Profile Screenshot (Proof) *
                </label>
                <div className="flex gap-1 text-[11px] bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setScreenshotTab('upload')}
                    className={`px-2.5 py-1 rounded-md transition ${screenshotTab === 'upload' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500'}`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreenshotTab('url')}
                    className={`px-2.5 py-1 rounded-md transition ${screenshotTab === 'url' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500'}`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {screenshotTab === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 hover:border-amber-400 bg-zinc-950 rounded-2xl p-6 text-center cursor-pointer transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-7 h-7 text-zinc-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-white">Click or drag your in-game profile screenshot</p>
                  <p className="text-[10px] text-zinc-500 mt-1">PNG, JPG, WebP (showing your character name or stats)</p>
                </div>
              )}

              {screenshotTab === 'url' && (
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://... screenshot image URL"
                    value={inGameScreenshotUrl}
                    onChange={(e) => setInGameScreenshotUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {inGameScreenshotUrl && (
                <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="w-16 h-12 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-black">
                    <img src={inGameScreenshotUrl} alt="Game proof" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Screenshot Loaded
                    </span>
                    <p className="text-[10px] text-zinc-400 truncate">Ready for admin verification</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInGameScreenshotUrl('')}
                    className="text-xs text-zinc-500 hover:text-rose-400 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="pt-1 text-center text-[11px] text-zinc-500">
              Contest theme photos can be submitted after your player account is created.
            </div>

            <button
              type="submit"
              disabled={isLoading || !inGameScreenshotUrl}
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 text-zinc-950 font-bold rounded-xl text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-zinc-950" />
              {isLoading ? 'Submitting...' : 'Register Player Profile 🚀'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
