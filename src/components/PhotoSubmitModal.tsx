import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Check, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import { User, SystemSettings } from '../types.ts';
import { submitContestPhoto } from '../services/api.ts';
import { playFanfare } from '../utils/audio.ts';

interface PhotoSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  settings: SystemSettings;
  onSuccess: () => void;
}

export const PhotoSubmitModal: React.FC<PhotoSubmitModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  onSuccess,
}) => {
  const [photoUrl, setPhotoUrl] = useState('');
  const [sourceTab, setSourceTab] = useState<'upload' | 'url'>('upload');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      setErrorMsg('Please upload or select a photo matching the active theme.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await submitContestPhoto({
        photoUrl,
        themeId: settings.currentTheme.id,
        themeTitle: settings.currentTheme.title,
      });

      playFanfare();

      if (result.status === 'pending') {
        setSuccessMsg('Your photo was submitted and is pending administrator review before going live on the leaderboard!');
      } else {
        setSuccessMsg('Your photo is now live in the contest arena!');
      }

      onSuccess();
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
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

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Submit Theme Profile Photo</h2>
            <p className="text-xs text-zinc-400">
              Player: <strong className="text-white font-mono">@{currentUser.nickname}</strong> · Theme: {settings.currentTheme.title}
            </p>
          </div>
        </div>

        {currentUser.status === 'pending' && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 font-bold mb-0.5">Account Pending In-Game Verification</strong>
              <span>
                Your registration in-game screenshot is currently awaiting administrator review. Once verified, you will be able to enter your photo in this theme!
              </span>
            </div>
          </div>
        )}

        {settings.requirePhotoApproval && (
          <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Administrator photo approval is enabled. Photos are reviewed before joining the live public leaderboard.</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
            {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">{successMsg}</h3>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">Choose Theme Photo</label>
                <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setSourceTab('upload')}
                    className={`px-3 py-1 rounded-lg ${sourceTab === 'upload' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500'}`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTab('url')}
                    className={`px-3 py-1 rounded-lg ${sourceTab === 'url' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500'}`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {sourceTab === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 hover:border-amber-400 bg-zinc-950 rounded-2xl p-7 text-center cursor-pointer transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white">Click or drag your theme photo here</p>
                  <p className="text-[11px] text-zinc-500 mt-1">PNG, JPG, WebP (up to 15MB)</p>
                </div>
              )}

              {sourceTab === 'url' && (
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://... direct image URL"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {photoUrl && (
                <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 shrink-0">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Photo Loaded
                    </span>
                    <p className="text-[11px] text-zinc-400 truncate">Ready for entry into current theme competition</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-xs text-zinc-500 hover:text-rose-400 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !photoUrl || currentUser.status === 'pending'}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-sm shadow-md transition cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : currentUser.status === 'pending' ? 'Verification Pending...' : 'Submit Photo to Contest 🚀'}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
