import React, { useEffect, useState } from 'react';
import { Icon, Svg } from './ui';

interface FamilyPhotoModalProps {
  photoUrl: string;
  onClose: () => void;
}

/**
 * Minimalist, elegant Lightbox Modal for the Header Logo Photo.
 * No header, no footer, reduced size, snug around the photo with a floating close button.
 */
export const FamilyPhotoModal: React.FC<FamilyPhotoModalProps> = ({
  photoUrl,
  onClose,
}) => {
  const [loaded, setLoaded] = useState(false);

  // Keyboard escape listener & body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Family photo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-[4px] transition-all duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl sm:max-w-3xl w-auto max-h-[85vh] bg-black/35 backdrop-blur-md border border-white/20 rounded-[18px] sm:rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex items-center justify-center p-1.5 sm:p-2 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition active:scale-95 border border-white/25 backdrop-blur-sm cursor-pointer shadow-md"
        >
          <Svg icon={Icon.close} className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {!loaded && (
          <div className="w-56 h-40 flex items-center justify-center text-white/70 text-sm">
            <span className="animate-pulse">Loading photo…</span>
          </div>
        )}

        <img
          src={photoUrl}
          alt="Family logo photo"
          onLoad={() => setLoaded(true)}
          className={`max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-[14px] sm:rounded-[18px] shadow-sm transition-opacity duration-200 ${
            loaded ? 'opacity-100' : 'opacity-0 hidden'
          }`}
        />
      </div>
    </div>
  );
};
