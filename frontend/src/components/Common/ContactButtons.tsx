import React from 'react';
import { FamilyMember } from '../../types/family';
import { callLink, fillMessage, useSiteSettings, whatsappLink } from '../../lib/whatsapp';

const firstName = (m: FamilyMember) => m.firstName || m.fullName.split(' ')[0];

/** Big Call and WhatsApp buttons. Shown only when the person gave a phone number. */
export const ContactButtons: React.FC<{ member: FamilyMember; message?: 'hello' | 'birthday' }> = ({ member, message = 'hello' }) => {
  const settings = useSiteSettings();
  if (member.isDeceased) return null;
  const template = message === 'birthday' ? settings.whatsappBirthday : settings.whatsappHello;
  const wa = whatsappLink(member.phone, fillMessage(template, firstName(member), settings));
  const tel = callLink(member.phone);
  if (!wa && !tel) return null;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {tel && (
        <a href={tel} className="min-h-[52px] rounded-2xl border-2 border-heritage-charcoal bg-white text-heritage-charcoal font-bold text-base flex items-center justify-center gap-2 no-underline">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
          Call
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" className="min-h-[52px] rounded-2xl bg-[#1E4636] text-white font-bold text-base flex items-center justify-center gap-2 no-underline">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" /></svg>
          {message === 'birthday' ? 'Wish on WhatsApp' : 'WhatsApp'}
        </a>
      )}
    </div>
  );
};
