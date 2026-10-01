import React from 'react';
import { Sparkles, Calendar, Clock, Camera, Image, ZoomIn, ArrowRight } from 'lucide-react';
import { ContestTheme, User } from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';

interface ThemeShowcaseBannerProps {
  theme: ContestTheme;
  currentUser: User | null;
  onOpenPhotoSubmitModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onMagnifyImage: (url: string, title: string) => void;
}

export const ThemeShowcaseBanner: React.FC<ThemeShowcaseBannerProps> = ({
  theme,
  currentUser,
  onOpenPhotoSubmitModal,
  onOpenAuthModal,
  onMagnifyImage,
}) => {
  const { t } = useLanguage();

  // Calculate days remaining
  const now = new Date().getTime();
  const end = new Date(theme.endDate).getTime();
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl mb-8">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        
        {/* Left Side: Theme Details & Dates */}
        <div className="max-w-2xl space-y-4">
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 bg-amber-400 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
              Active Contest Theme
            </span>

            <div className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950/80 px-3 py-1 rounded-xl border border-zinc-800">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatDate(theme.startDate)} – {formatDate(theme.endDate)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysLeft > 0 ? `${daysLeft} days remaining` : 'Ending Today'}
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {theme.title}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {theme.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {currentUser ? (
              <button
                onClick={onOpenPhotoSubmitModal}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 text-zinc-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-400/20 active:scale-95 transition cursor-pointer flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-zinc-950" />
                <span>Submit Theme Photo for Contest</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuthModal('register')}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center gap-2"
              >
                <span>Join Contest as In-Game Player</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <span className="text-xs text-zinc-500">
              Photos must match the theme to compete
            </span>
          </div>

        </div>

        {/* Right Side: Inspirational Example Photos Gallery */}
        {theme.examplePhotoUrls && theme.examplePhotoUrls.length > 0 && (
          <div className="shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Image className="w-4 h-4 text-amber-400" />
                Theme Inspiration Examples:
              </span>
              <span className="text-[11px] text-zinc-500">Click to magnify</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5">
              {theme.examplePhotoUrls.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => onMagnifyImage(url, `Theme Example #${idx + 1}`)}
                  className="group relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 cursor-pointer shadow-md hover:border-amber-400 transition"
                >
                  <img
                    src={url}
                    alt={`Theme example ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </section>
  );
};
