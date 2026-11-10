import React from 'react';
import { FamilyMember } from '../../types/family';
import { callLink } from '../../lib/siteSettings';
import { Icon, Svg } from '../../album/ui';

/**
 * Call button, shown only when the person gave a phone number and is not deceased.
 */
export const ContactButtons: React.FC<{ member: FamilyMember; message?: 'hello' | 'birthday'; compact?: boolean }> = ({ member, message = 'hello', compact = false }) => {
  if (member.isDeceased) return null;
  const tel = callLink(member.phone);
  if (!tel) return null;
  const size = compact ? 'min-h-[48px] text-base' : 'min-h-[60px] text-lg';
  return (
    <div className="grid grid-cols-1">
      <a
        href={tel}
        className={`${size} rounded-[18px] ${message === 'birthday' ? 'bg-album-terracotta sparkle text-white' : 'border-2 border-album-leaf bg-white text-album-leaf'} font-extrabold flex items-center justify-center gap-2 no-underline px-4`}
      >
        <Svg icon={Icon.phone} className="w-6 h-6" />
        {message === 'birthday' ? 'Call to wish' : 'Call'}
      </a>
    </div>
  );
};
