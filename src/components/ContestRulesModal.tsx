import React from 'react';
import { X, Trophy, ShieldCheck, Vote, Swords, Flame } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.tsx';

interface ContestRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContestRulesModal: React.FC<ContestRulesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t.rules.title}</h2>
            <p className="text-xs text-zinc-400">{t.rules.subtitle}</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-zinc-300">
          
          <div className="flex gap-3 bg-zinc-950/60 border border-zinc-800 p-4 rounded-2xl">
            <Vote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">{t.rules.rule1Title}</strong>
              {t.rules.rule1Desc}
            </div>
          </div>

          <div className="flex gap-3 bg-zinc-950/60 border border-zinc-800 p-4 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">{t.rules.rule2Title}</strong>
              {t.rules.rule2Desc}
            </div>
          </div>

          <div className="flex gap-3 bg-zinc-950/60 border border-zinc-800 p-4 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">{t.rules.rule3Title}</strong>
              {t.rules.rule3Desc}
            </div>
          </div>

          <div className="flex gap-3 bg-zinc-950/60 border border-zinc-800 p-4 rounded-2xl">
            <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">{t.rules.rule4Title}</strong>
              {t.rules.rule4Desc}
            </div>
          </div>

        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
          >
            {t.rules.closeBtn}
          </button>
        </div>

      </div>
    </div>
  );
};
