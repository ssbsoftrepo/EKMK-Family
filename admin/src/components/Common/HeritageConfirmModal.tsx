import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { PersonAvatar } from './PersonAvatar';
import { Gender } from '../../types/family';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  member?: {
    fullName: string;
    tamilName?: string;
    generation?: number;
    gender?: Gender;
    photoUrl?: string;
    branchName?: string;
  };
  onConfirm: () => void;
  onClose: () => void;
}

export const HeritageConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Yes, Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
  member,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[10000] w-screen h-screen flex items-center justify-center p-4 bg-heritage-charcoal/75 backdrop-blur-sm animate-fadeIn"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#FFFEFB] rounded-2xl border-2 border-heritage-gold/60 shadow-heritage-lg overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cultural Kalasam Corner Accents */}
        <div className="absolute top-3 right-3 text-heritage-gold-300 text-sm select-none pointer-events-none">✦</div>
        <div className="absolute bottom-3 left-3 text-heritage-gold-300 text-sm select-none pointer-events-none">✦</div>

        {/* Top Accent Strip */}
        <div
          className={`h-1.5 w-full ${
            isDestructive
              ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600'
              : 'bg-gradient-to-r from-heritage-gold via-heritage-maroon to-heritage-gold'
          }`}
        />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Header Icon & Close Button */}
          <div className="flex items-start justify-between">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                isDestructive
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-heritage-gold-100 text-heritage-gold-800 border border-heritage-gold-300'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="text-heritage-muted hover:text-heritage-charcoal p-1.5 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-heritage-charcoal">
              {title}
            </h3>
            <p className="text-xs text-heritage-muted leading-relaxed">
              {message}
            </p>
          </div>

          {/* Member Preview Card (if deleting a member) */}
          {member && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-heritage-ivory border border-heritage-border">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-heritage-gold/50 flex-shrink-0">
                <PersonAvatar
                  photoUrl={member.photoUrl}
                  name={member.fullName}
                  gender={member.gender || 'male'}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-xs font-bold text-heritage-charcoal truncate">
                  {member.fullName}
                </p>
                {member.tamilName && (
                  <p className="text-[11px] font-tamil text-heritage-gold-700 font-semibold truncate">
                    {member.tamilName}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  {member.generation && (
                    <span className="text-[10px] font-bold text-heritage-maroon bg-heritage-maroon/10 px-1.5 py-0.2 rounded">
                      Gen {member.generation}
                    </span>
                  )}
                  {member.branchName && (
                    <span className="text-[10px] text-heritage-muted truncate">
                      {member.branchName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">
              This action permanent and will detach reciprocal spouse and parental links in the tree.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-heritage-border text-xs font-semibold text-heritage-charcoal hover:bg-heritage-cream transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer ${
                isDestructive
                  ? 'bg-rose-700 hover:bg-rose-800 disabled:opacity-50'
                  : 'bg-heritage-maroon hover:bg-heritage-maroon-800 disabled:opacity-50'
              }`}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
