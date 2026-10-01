import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, ShieldCheck, Sparkles } from 'lucide-react';

interface ImageMagnifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  secondaryImageUrl?: string; // e.g. in-game verification screenshot
  title: string;
  subtitle?: string;
  isVerification?: boolean;
}

export const ImageMagnifierModal: React.FC<ImageMagnifierModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  secondaryImageUrl,
  title,
  subtitle,
  isVerification,
}) => {
  const [activeImage, setActiveImage] = useState<string>(imageUrl);
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);
  const [isLensActive, setIsLensActive] = useState<boolean>(false);
  const [lensPos, setLensPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveImage(imageUrl);
  }, [imageUrl]);

  if (!isOpen) return null;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/90 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ZoomIn className="w-5 h-5 text-amber-400" />
                <span>{title}</span>
              </h3>
              {isVerification && (
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  In-Game Proof
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {secondaryImageUrl && (
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveImage(imageUrl)}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    activeImage === imageUrl ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Contest Avatar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImage(secondaryImageUrl)}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    activeImage === secondaryImageUrl ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Game Proof Screenshot
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Magnifier Controls Bar */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl my-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="font-semibold text-white">Magnification:</span>
            <span className="font-mono text-amber-400 font-bold">{zoomLevel.toFixed(1)}x</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              disabled={zoomLevel <= 1}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-white transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="1"
              max="3.5"
              step="0.25"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-28 accent-amber-400 cursor-pointer"
            />

            <button
              onClick={() => setZoomLevel((z) => Math.min(3.5, z + 0.5))}
              disabled={zoomLevel >= 3.5}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-white transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setZoomLevel(1.5);
                setLensPos({ x: 50, y: 50 });
              }}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition cursor-pointer ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 hidden sm:block">
            Move mouse over photo to magnify details
          </div>
        </div>

        {/* Big Interactive Photo Container */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsLensActive(true)}
          onMouseLeave={() => setIsLensActive(false)}
          className="relative flex-1 min-h-[350px] sm:min-h-[440px] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center cursor-crosshair select-none"
        >
          <img
            src={activeImage}
            alt={title}
            className="w-full h-full object-contain pointer-events-none transition-transform duration-100 ease-out"
            style={{
              transformOrigin: `${lensPos.x}% ${lensPos.y}%`,
              transform: isLensActive ? `scale(${zoomLevel})` : 'scale(1)',
            }}
          />

          {!isLensActive && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-1.5 pointer-events-none">
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              Hover to inspect high-definition pixels
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
