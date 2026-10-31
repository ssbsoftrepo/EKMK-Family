import React from 'react';
import { FamilyMember } from '../../types/family';
import { callLink, fillMessage, useSiteSettings, whatsappLink } from '../../lib/whatsapp';
import { Icon, Svg } from '../../album/ui';

const firstName = (m: FamilyMember) => m.firstName || m.fullName.split(' ')[0];

/**
 * Big Call and WhatsApp buttons, shown only when the person gave a phone number.
 * WhatsApp opens on the visitor's own phone with the admin's message ready; nothing is sent by the site.
 */
export const ContactButtons: React.FC<{ member: FamilyMember; message?: 'hello' | 'birthday'; compact?: boolean }> = ({ member, message = 'hello', compact = false }) => {
  const settings = useSiteSettings();
  if (member.isDeceased) return null;
  const template = message === 'birthday' ? settings.whatsappBirthday : settings.whatsappHello;
  const wa = whatsappLink(member.phone, fillMessage(template, firstName(member), settings));
  const tel = callLink(member.phone);
  if (!wa && !tel) return null;
  const size = compact ? 'min-h-[48px] text-base' : 'min-h-[60px] text-lg';
  return (
    <div className={`grid gap-2.5 ${tel && wa && !compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {tel && !compact && (
        <a href={tel} className={`${size} rounded-[18px] border-2 border-album-leaf bg-white text-album-leaf font-extrabold flex items-center justify-center gap-2 no-underline`}>
          <Svg icon={Icon.phone} className="w-6 h-6" />
          Call
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className={`${size} rounded-[18px] ${message === 'birthday' ? 'bg-album-terracotta sparkle' : 'bg-album-leaf'} text-white font-extrabold flex items-center justify-center gap-2 no-underline px-4`}>
          <Svg icon={Icon.chat} className="w-6 h-6" />
          {message === 'birthday' ? 'Wish on WhatsApp' : 'WhatsApp'}
        </a>
      )}
    </div>
  );
};
